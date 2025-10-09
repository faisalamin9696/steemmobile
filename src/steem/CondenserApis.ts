import axios, {AxiosProgressEvent} from 'axios';
import {ImageOrVideo} from 'react-native-image-crop-picker';
import {Platform} from 'react-native';
import {AppConstants} from '../constants/AppConstants';
import {AppStrings} from '../constants/AppStrings';
import {Client, cryptoUtils, Operation, PrivateKey} from '@steempro/dsteem';
import {getServer} from '../utils/realm';
import {PrivKey} from '../utils/privKey';
import RNHeicConverter from 'react-native-heic-converter';
import {pushFcmToken} from '../services/NotificationService';
global.Buffer = global.Buffer || require('buffer').Buffer;

const DEFAULT_SERVER = AppStrings.RPC_SERVERS;

export let client = new Client(AppStrings.RPC_SERVERS[0], {
  timeout: AppStrings.CHAIN_TIMEOUT,
  addressPrefix: AppStrings.CHAIN_PREFIX,
  chainId: AppStrings.CHAIN_ID,
  failoverThreshold: 10,
  consoleOnFailover: true,
});

export const checkClient = () => {
  const selectedServer = DEFAULT_SERVER;
  const server = getServer();
  const index = selectedServer.indexOf(server);
  if (server && index !== -1) {
    selectedServer.splice(index, 1);
    selectedServer.unshift(server);
  }

  client = new Client(selectedServer, {
    timeout: AppStrings.CHAIN_TIMEOUT,
    addressPrefix: AppStrings.CHAIN_PREFIX,
    chainId: AppStrings.CHAIN_ID,
    failoverThreshold: 10,
    consoleOnFailover: true,
  });
  console.log('CLIENT', client);
};

checkClient();

// get public wif from private wif
export const wifToPublic = (privWif: string) => {
  const privateKey = PrivateKey.fromString(privWif);
  const pubWif = privateKey.createPublic(client.addressPrefix).toString();
  return pubWif;
};

export const wifIsValid = (privWif: string, pubWif: string) => {
  return wifToPublic(privWif) == pubWif;
};

// sign image to upload
export const signImage = async (photo, password) => {
  try {
    const photoBuf = Buffer.from(photo.data, 'base64');
    const prefix = Buffer.from('ImageSigningChallenge');
    const data = Buffer.concat([prefix, photoBuf]);
    const privateKey = PrivateKey.fromString(password);
    const hash = cryptoUtils.sha256(data);
    const signature = privateKey.sign(hash);
    if (!privateKey.createPublic().verify(hash, signature)) {
      AppConstants.SHOW_TOAST('Invalid key', '', 'error');
      console.error('signature is invalid');
      return null;
    }
    return signature;
  } catch (error) {
    console.log('failed to sign images', error);
    return null;
  }
};

// upload image
export const uploadImage = async (
  media: ImageOrVideo,
  username: string,
  sign,
  uploadProgress?: (event: AxiosProgressEvent) => void,
) => {
  let image_name = media.path.split('/').pop();
  if (Platform.OS === 'ios') {
    image_name = media.filename;
  }
  const file = {
    uri: media.path,
    type: media.mime,
    name: image_name,
    size: media.size,
  };

  if (media.mime === 'image/heic') {
    const res = await RNHeicConverter.convert({path: media.sourceURL}); // default with quality = 1 & jpg extension
    if (res && res.path) {
      file.type = 'image/jpeg';
      file.uri = res.path;
      file.name = media.filename
        ? media.filename.replace('.HEIC', '.JPG')
        : image_name || '';
    }
  }

  const fData = new FormData();
  // replace the braces and spaces with _ in file name with replaceAll
  fData.append(file!.name!.split(' ')?.join('_'), file);
  return _upload(fData, username, sign, uploadProgress);
};

const _upload = (
  fd,
  username: string,
  signature,
  uploadProgress?: (event: AxiosProgressEvent) => void,
) => {
  const image = axios.create({
    baseURL: `${AppStrings.IMAGER_SERVER}/${username}/${signature}`,
    onUploadProgress: progressEvent => {
      // console.log(progressEvent.loaded)
      if (uploadProgress) uploadProgress(progressEvent);
    },
    headers: {
      Authorization: AppStrings.IMAGER_SERVER,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000,
  });
  return image.post('', fd);
};

export function getKeyType(account: AccountExt, key: string) {
  if (!account) {
    throw new Error('Account not found');
  }

  // idr interface dalna
  let keyType: string = '';
  if (key[0] !== '5') {
    const privPostingKey = PrivateKey.fromLogin(
      typeof account === 'string' ? account : account.name,
      key,
      'posting',
    ).toString();
    const isvalid = wifIsValid(
      privPostingKey,
      account?.posting_key_auths[0][0],
    );
    if (isvalid) {
      keyType = AppStrings.KEY_TYPES.MASTER;
    } else {
      keyType = '';
    }
  } else {
    const keyArray = [
      AppStrings.KEY_TYPES.ACTIVE,
      AppStrings.KEY_TYPES.OWNER,
      AppStrings.KEY_TYPES.POSTING,
      AppStrings.KEY_TYPES.MEMO,
    ];

    const publicKey = wifToPublic(key);

    const publicKeys = [
      account?.active_key_auths[0][0],
      account?.owner_key_auths[0][0],
      account?.posting_key_auths[0][0],
      account.memo_key,
    ];

    keyType =
      publicKeys.indexOf(publicKey) !== -1
        ? keyArray[publicKeys.indexOf(publicKey)]
        : '';
  }

  return keyType
    ? {
        account: account.name,
        type: keyType as 'POSTING' | 'ACTIVE' | 'OWNER' | 'MASTER' | 'MEMO',
      }
    : '';
}

export const voteComment = async (
  comment: Feed | Post,
  voter: AccountExt,
  key: string,
  weight: number,
) => {
  const keyData = getKeyType(voter, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);

    if (weight > 100 || weight < -100) {
      throw new Error('Invalid weight');
    }

    const voteData = {
      voter: keyData.account,
      author: comment.author,
      permlink: comment.permlink,
      weight: weight * 100,
    };

    return new Promise((resolve, reject) => {
      client.broadcast
        .vote(voteData, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required posting active key or above.',
    ),
  );
};

export interface BlockchainGlobalProps {
  steemPerMVests: number;
  base: number;
  quote: number;
  fundRecentClaims: number;
  fundRewardBalance: number;
  sbdPrintRate: number;
  dynamicProps: {};
  chainProps: {};
}

//// global props
let globalProps: BlockchainGlobalProps | any = null;

// helper function
export const parseToken = (strVal: string): number => {
  if (!strVal) {
    return 0;
  }
  return Number(parseFloat(strVal.split(' ')[0]));
};
export const vestToSteem = (
  rewards_vests: number | string,
  steem_per_share,
): number => {
  if (typeof rewards_vests === 'string')
    return parseFloat(rewards_vests.split(' ')[0]) * steem_per_share;
  else return rewards_vests * steem_per_share;
};

export const steemToVest = (steem: number, steem_per_share: number): number => {
  return steem / steem_per_share;
};

// export async function vestsToSteem(vests: number): Promise<number> {
//   const dynamicGlobalProperties: any =
//     await client.database.getDynamicGlobalProperties();
//   const totalVestingFundSteem = Number(
//     parseToken(dynamicGlobalProperties.total_vesting_fund_steem),
//   );
//   const totalVestingShares = Number(
//     parseToken(dynamicGlobalProperties.total_vesting_shares),
//   );
//   const base = Math.pow(10, 6);
//   const steemPerMVests = (totalVestingFundSteem / totalVestingShares) * base;
//   const steem = (vests * steemPerMVests) / base;
//   return steem;
// }

// export const getUnreadNotifications = async (
//   account: string,
// ): Promise<{ lastread: string; unread: number }> => {
//   try {
//     console.log(account, 'bridge', 'unread_notifications');
//     return new Promise((resolve, reject) => {
//       client
//         .call2('bridge', 'unread_notifications', {
//           account: account,
//         })
//         .then(result => {
//           resolve(result);
//         })
//         .catch(err => {
//           reject(err);
//         });
//     });
//   } catch (error) {
//     console.log(`failed to fetch unread notifications for ${account}`);
//     throw new Error(`${error}`);
//   }
// };

// export const getNotifications = async (
//   account: string,
//   LAST_ID?: number,
// ): Promise<Notification[]> => {
//   try {
//     let notifications: Notification[];
//     if (LAST_ID) {
//       notifications = await client.call2('bridge', 'account_notifications', {
//         account: account,
//         limit: 50,
//         last_id: LAST_ID,
//       });
//     } else
//       notifications = await client.call2('bridge', 'account_notifications', {
//         account: account,
//         limit: 15,
//       });
//     console.log('Çondensor', 'account_notifications');
//     const data = await getUnreadNotifications(account);
//     const lastReadTime = data?.lastread;
//     if (lastReadTime) {
//       await Promise.all(
//         notifications.map(
//           item =>
//           (item.read =
//             Date.parse(`${lastReadTime}Z`) >
//             moment(item.date + 'Z').unix() * 1000),
//         ),
//       );
//     }

//     return notifications as Notification[];
//   } catch (error) {
//     console.log(
//       `failed to fetch notifications for ${account} and Last ID ${LAST_ID}`,
//     );
//     throw new Error(`${error}`);
//   }
// };

export const markSteemNotifications = async (
  account: AccountExt,
  key: string,
) => {
  const keyData = getKeyType(account, key);
  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    let date = new Date().toISOString().slice(0, 19);

    const params = {
      id: 'notify',
      required_auths: [],
      required_posting_auths: [account.name],
      json: JSON.stringify(['setLastRead', {date}]),
    };
    const params1 = {
      id: 'steemmobile_notify',
      required_auths: [],
      required_posting_auths: [account.name],
      json: JSON.stringify(['setLastRead', {date}]),
    };

    const opArray: Operation[] = [
      ['custom_json', params],
      ['custom_json', params1],
    ];

    const privateKey = PrivateKey.fromString(key);
    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(async result => {
          try {
            await pushFcmToken(account.name, true);
          } catch {}
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

// export async function getCustomJson() {
//   const op = utils.operationOrders;
//   const operationsBitmask = utils.makeBitMaskFilter([op.custom_json]);
//   const operations = await client.database.getAccountHistory(
//     'faisalamin',
//     -1,
//     50,
//     operationsBitmask[0],
//   );
//   const transfers = operations.filter(tx => tx[1].op[0] === 'custom_json');
//   return transfers;
// }

interface TransferOptions {
  to: string;
  username: AccountExt;
  privateKey: string;
  asset: string;
  amount: string | number;
  memo?: string;
}

export const transferToSavings = ({
  to,
  username,
  privateKey,
  amount,
  asset,
  memo = '',
}: TransferOptions) => {
  const keyData = getKeyType(username, privateKey);

  if (keyData && PrivKey.atLeast(keyData.type, 'ACTIVE')) {
    const key = PrivateKey.fromString(privateKey);

    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }

    const from = keyData.account;
    const transferAmount = amount.toFixed(3).toString() + ' ' + asset;

    const args: any = [
      [
        'transfer_to_savings',
        {
          from,
          to,
          amount: transferAmount,
          memo,
        },
      ],
    ];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(args, key)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
          console.log('Transfer error', err);
        });
    });
  }
  return Promise.reject(
    new Error(
      'Check private key permission! Required posting active key or above.',
    ),
  );
};

export async function transferAsset({
  to,
  username,
  privateKey,
  amount,
  asset,
  memo = '',
}: TransferOptions) {
  const keyData = getKeyType(username, privateKey);

  if (keyData && PrivKey.atLeast(keyData.type, 'ACTIVE')) {
    const key = PrivateKey.fromString(privateKey);
    const from = keyData.account;
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    const transferAmount = amount.toFixed(3).toString() + ' ' + asset;

    const transferOp: any = [
      'transfer',
      {
        from,
        to,
        amount: transferAmount,
        memo,
      },
    ];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations([transferOp], key)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
          console.log('Transfer error', err);
        });
    });
  }
  return Promise.reject(
    new Error(
      'Check private key permission! Required posting active key or above.',
    ),
  );
}

export async function withdrawVesting(
  account: AccountExt,
  privateKey: string,
  amount: number,
) {
  const keyData = getKeyType(account, privateKey);

  if (keyData && PrivKey.atLeast(keyData.type, 'ACTIVE')) {
    const key = PrivateKey.fromString(privateKey);

    const op: Operation = [
      'withdraw_vesting',
      {
        account: keyData.account,
        vesting_shares: amount?.toFixed(6) + ' VESTS',
      },
    ];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations([op], key)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
          console.log('Transfer error', err);
        });
    });
  }
  return Promise.reject(
    new Error(
      'Check private key permission! Required posting active key or above.',
    ),
  );
}

// set parent_author  = '' for root post

export const publishContent = async (
  postingContent: PostingContent,
  options = null,
  key: string,
  voteWeight = null,
) => {
  const keyData = getKeyType(postingContent.author, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const opArray: any = [
      [
        'comment',
        {
          parent_author: postingContent.parent_author,
          parent_permlink: postingContent.parent_permlink,
          author: keyData.account,
          permlink: postingContent.permlink,
          title: postingContent.title,
          body: postingContent.body,
          json_metadata: JSON.stringify(postingContent.json_metadata),
        },
      ],
    ];

    if (options) {
      const e = ['comment_options', options];
      opArray.push(e);
    }

    // if (voteWeight) {
    //   const e = [
    //     'vote',
    //     {
    //       voter: author,
    //       author,
    //       permlink,
    //       weight: voteWeight,
    //     },
    //   ];
    //   opArray.push(e);
    // }

    const privateKey = PrivateKey.fromString(key);

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(error => {
          // if (error && error?.jse_info?.code === 4030100) {
          //   error.message = getDsteemDateErrorMessage(error);
          // }
          reject(error);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const reblogPost = async (
  account: AccountExt,
  key: string,
  data: {author: string; permlink: string},
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const follower = keyData.account;

    const json = {
      id: 'follow',
      json: JSON.stringify([
        'reblog',
        {
          account: follower,
          author: data.author,
          permlink: data.permlink,
        },
      ]),
      required_auths: [],
      required_posting_auths: [follower],
    };

    const opArray: any = [['custom_json', json]];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const updateProfile = async (
  account: AccountExt,
  key: string,
  params: {
    name: string;
    about: string;
    profile_image: string;
    website: string;
    location: string;
    cover_image: string;
    version?: number;
  },
) => {
  const keyData = getKeyType(account, key);
  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    params.version = 2;

    const opArray: any = [
      [
        'account_update2',
        {
          account: keyData.account,
          json_metadata: '',
          posting_json_metadata: JSON.stringify({profile: params}),
          extensions: [],
        },
      ],
    ];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(error => {
          // if (error && get(error, 'jse_info.code') === 4030100) {
          //   error.message = getDsteemDateErrorMessage(error);
          // }
          reject(error);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const claimRewardBalance = async (
  account: AccountExt,
  key: string,
  rewardSteem,
  rewardSbd,
  rewardVests,
) => {
  const keyData = getKeyType(account, key);
  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);

    const opArray: any = [
      [
        'claim_reward_balance',
        {
          account: keyData.account,
          reward_steem: rewardSteem,
          reward_sbd: rewardSbd,
          reward_vests: rewardVests,
        },
      ],
    ];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          console.log('Claim Error', err);
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const transferToVesting = async (
  account: AccountExt,
  key: string,
  DATA: {from: string; to: string; amount: number; asset: string},
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'ACTIVE')) {
    const privateKey = PrivateKey.fromString(key);

    const transferAmount = DATA.amount.toFixed(3).toString() + ' ' + DATA.asset;

    const args: any = [
      [
        'transfer_to_vesting',
        {
          from: keyData.account,
          to: DATA.to,
          amount: transferAmount,
        },
      ],
    ];
    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(args, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
          console.log('PowerUp error', err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private active key or above.',
    ),
  );
};

export const delegateVestingShares = async (
  account: AccountExt,
  key: string,
  DATA: {delegatee: string; amount: number; asset: string},
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'ACTIVE')) {
    const privateKey = PrivateKey.fromString(key);

    const transferAmount = DATA.amount.toFixed(6).toString() + ' ' + DATA.asset;

    return new Promise((resolve, reject) => {
      client.broadcast
        .delegateVestingShares(
          {
            delegator: keyData.account,
            delegatee: DATA.delegatee,
            vesting_shares: transferAmount,
          },
          privateKey,
        )
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
          console.log('PowerUp error', err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private active key or above.',
    ),
  );
};

export const voteForWitness = async (
  account: AccountExt,
  key: string,
  DATA: {from: string; witness: string; approved: boolean},
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'ACTIVE')) {
    const privateKey = PrivateKey.fromString(key);

    const args: any = [
      [
        'account_witness_vote',
        {
          account: keyData.account,
          witness: DATA.witness,
          approve: DATA.approved,
        },
      ],
    ];
    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(args, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
          console.log('PowerUp error', err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private active key or above.',
    ),
  );
};

export const deleteComment = (
  account: AccountExt,
  key: string,
  data: {author: string; permlink: string},
) => {
  const keyData = getKeyType(account, key);
  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const opArray: any = [
      [
        'delete_comment',
        {
          author: data.author,
          permlink: data.permlink,
        },
      ],
    ];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }
  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const followUser = async (
  account: AccountExt,
  key: string,
  data: {follower: string; following: string},
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const json = {
      id: 'follow',
      json: JSON.stringify([
        'follow',
        {
          follower: `${data.follower}`,
          following: `${data.following}`,
          what: ['blog'],
        },
      ]),
      required_auths: [],
      required_posting_auths: [`${data.follower}`],
    };
    const opArray: any = [['custom_json', json]];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const unfollowUser = async (
  account: AccountExt,
  key: string,
  data: {follower: string; following: string},
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);

    const json = {
      id: 'follow',
      json: JSON.stringify([
        'follow',
        {
          follower: `${data.follower}`,
          following: `${data.following}`,
          what: [],
        },
      ]),
      required_auths: [],
      required_posting_auths: [`${data.follower}`],
    };
    const opArray: any = [['custom_json', json]];
    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const subscribeCommunity = async (
  account: AccountExt,
  key: string,
  data: {communityId: string; subscribe: boolean},
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const json = [
      data.subscribe ? 'subscribe' : 'unsubscribe',
      {community: data.communityId},
    ];
    const custom_json = {
      id: 'community',
      json: JSON.stringify(json),
      required_auths: [],
      required_posting_auths: [keyData.account],
    };
    const opArray: any = [['custom_json', custom_json]];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const setUserTitle = async (
  account: AccountExt,
  key: string,
  data: {communityId: string; account: string; title: string},
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const action = 'setUserTitle';
    const json = [
      action,
      {
        community: data.communityId,
        account: data.account,
        title: data.title,
      },
    ];
    const custom_json = {
      id: 'community',
      json: JSON.stringify(json),
      required_auths: [],
      required_posting_auths: [keyData.account],
    };
    const opArray: any = [['custom_json', custom_json]];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const setUserRole = async (
  account: AccountExt,
  key: string,
  data: {
    communityId: string;
    account: string;
    role: 'muted' | 'guest' | 'member' | 'mod' | 'admin' | 'owner';
  },
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const action = 'setRole';
    const json = [
      action,
      {
        community: data.communityId,
        account: data.account,
        role: data.role,
      },
    ];
    const custom_json = {
      id: 'community',
      json: JSON.stringify(json),
      required_auths: [],
      required_posting_auths: [keyData.account],
    };
    const opArray: any = [['custom_json', custom_json]];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const setUserRoleTitle = async (
  account: AccountExt,
  key: string,
  data: {
    communityId: string;
    account: string;
    title: string;
    role: 'muted' | 'guest' | 'member' | 'mod' | 'admin' | 'owner';
  },
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const action1 = 'setRole';
    const action2 = 'setUserTitle';

    const json1 = [
      action1,
      {
        community: data.communityId,
        account: data.account,
        role: data.role,
      },
    ];

    const json2 = [
      action2,
      {
        community: data.communityId,
        account: data.account,
        title: data.title,
      },
    ];
    const custom_json1 = {
      id: 'community',
      json: JSON.stringify(json1),
      required_auths: [],
      required_posting_auths: [keyData.account],
    };
    const custom_json2 = {
      id: 'community',
      json: JSON.stringify(json2),
      required_auths: [],
      required_posting_auths: [keyData.account],
    };

    const opArray: any = [['custom_json', custom_json1, custom_json2]];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};
export const mutePost = async (
  account: AccountExt,
  key: string,
  mute: boolean,
  data: {
    communityId: string;
    account: string;
    permlink: string;
    notes: string;
  },
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const action = mute ? 'mutePost' : 'unmutePost';
    const json = [
      action,
      {
        community: data.communityId,
        account: data.account,
        permlink: data.permlink,
        notes: data.notes || 'mute',
      },
    ];
    const custom_json = {
      id: 'community',
      json: JSON.stringify(json),
      required_auths: [],
      required_posting_auths: [keyData.account],
    };
    const opArray: any = [['custom_json', custom_json]];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};

export const pinPost = async (
  account: AccountExt,
  key: string,
  pin: boolean,
  data: {
    communityId: string;
    account: string;
    permlink: string;
  },
) => {
  const keyData = getKeyType(account, key);

  if (keyData && PrivKey.atLeast(keyData.type, 'POSTING')) {
    const privateKey = PrivateKey.fromString(key);
    const action = pin ? 'pinPost' : 'unpinPost';
    const json = [
      action,
      {
        community: data.communityId,
        account: data.account,
        permlink: data.permlink,
      },
    ];
    const custom_json = {
      id: 'community',
      json: JSON.stringify(json),
      required_auths: [],
      required_posting_auths: [keyData.account],
    };
    const opArray: any = [['custom_json', custom_json]];

    return new Promise((resolve, reject) => {
      client.broadcast
        .sendOperations(opArray, privateKey)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return Promise.reject(
    new Error(
      'Check private key permission! Required private posting key or above.',
    ),
  );
};
