import * as Keychain from 'react-native-keychain';
import {AppStrings} from '../constants/AppStrings';
import {getAccountExt} from '../steem/SteemApis';
import {MMKV} from 'react-native-mmkv';
import {empty_draft, empty_settings} from './placeholders';
import {saveSettingsHandler} from '../redux/reducers/SettingsReducer';
import {Action, Dispatch} from '@reduxjs/toolkit';
import {Decrypt, Encrypt, decryptKey, encryptKey} from './encrypt';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {AppConstants} from '../constants/AppConstants';
import {AppGlobals} from '../constants/AppGlobals';

export const SharedPreference = new MMKV();

const options_set: Keychain.SetOptions = {
  accessControl: Keychain.ACCESS_CONTROL.USER_PRESENCE,
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.ANY,
  authenticationPrompt: {title: 'Confirm your identity'},
};

const options_get: Keychain.SetOptions = {
  accessControl: Keychain.ACCESS_CONTROL.USER_PRESENCE,
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.ANY,
  authenticationPrompt: {title: 'Confirm your identity'},
};

const accountsKey = 'user-accounts';

export const getSettings = (): Setting => {
  try {
    const settings = SharedPreference.getString(
      `${AppStrings.SETTINGS_SCHEMA}`,
    );

    if (settings)
      return {...empty_settings(), ...JSON.parse(settings)} as Setting;
    else return empty_settings();
  } catch (error) {
    console.log('Setting error ' + String(error));
    return {...empty_settings()};
  }
};

export const setSettings = (settings: any, dispatch: Dispatch<Action>) => {
  const newChange = settings;
  const newData = {
    ...getSettings(),
    ...newChange,
  };
  setItemToStorage(AppStrings.SETTINGS_SCHEMA, newData);
  dispatch(saveSettingsHandler(newData));
};

export const storeCredentials = async (
  username: string,
  password: string,
  keyType?: string,
): Promise<boolean> => {
  try {
    const storeResult = await Keychain.setGenericPassword(
      username,
      password,
      options_set,
    );
    return storeResult ? true : false;
  } catch (error) {
    console.log('Error storing credentials:', error);
    return false;
  }
};

export async function getCredentials(): Promise<
  false | Keychain.UserCredentials
> {
  try {
    const settings = getSettings();

    const credentials = await Keychain.getGenericPassword(options_get);
    if (credentials) {
      return {
        ...credentials,
        username: credentials.username,
        password: settings.pinEnabled
          ? decryptKey(
              Decrypt(credentials.password),
              Decrypt(AppGlobals.PIN_CODE),
              undefined,
            )
          : Decrypt(credentials.password),
      };
    } else return credentials;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getAllCredentials(): Promise<
  false | Keychain.UserCredentials
> {
  try {
    const credentials = await Keychain.getInternetCredentials(
      accountsKey,
      options_get,
    );
    if (credentials) {
      return credentials;
    } else return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export const addNewCredential = async (
  username: string,
  password: string,
): Promise<boolean> => {
  try {
    const settings = getSettings();
    const allAccounts = await getAllCredentials();
    let credentials = {};
    // Encrypt the password

    credentials[username] = {
      password: settings.pinEnabled
        ? Encrypt(encryptKey(password, Decrypt(AppGlobals.PIN_CODE)))
        : Encrypt(password),
    };
    //Example  {faisalamin:{
    //     password:'123'
    // }}
    let keysList: any[] = [];

    if (allAccounts) {
      const oldAccounts = JSON.parse(allAccounts.password);
      keysList = keysList.concat(oldAccounts);
      // check uniqueness
      const isExist = oldAccounts?.filter(
        key => Object.keys(key)[0] === username,
      );
      if (!isExist || isExist?.length <= 0) {
        // new requested account
        keysList.push(credentials);
      } else {
        const personIndex = keysList.findIndex(
          key => Object.keys(key)[0] === username,
        );

        if (personIndex !== -1) {
          // Found the person, update the object
          keysList[personIndex] = credentials;

          console.log('Credential updated:');
        } else {
          console.log('Credential not found!');
        }
      }
    } else {
      keysList.push(credentials);
    }

    const result = await Keychain.setInternetCredentials(
      accountsKey,
      accountsKey,
      JSON.stringify(keysList),
    );

    if (result) return true;
    else return false;
  } catch (error) {
    console.log('Error storing credentials:', error);
    return false;
  }
};

export const removeCredential = async (username: string): Promise<boolean> => {
  try {
    const allAccounts = await getAllCredentials();
    if (allAccounts) {
      const oldAccounts = JSON.parse(allAccounts.password);

      const result = await Keychain.setInternetCredentials(
        accountsKey,
        accountsKey,
        JSON.stringify(
          oldAccounts.filter(key => Object.keys(key)[0] !== username),
        ),
      );
      if (result) return true;
      else return false;
    } else return true;
  } catch (error) {
    console.log('Error removing credentials:', error);
    return false;
  }
};

export function isLogin() {
  try {
    const options: Keychain.SetOptions = {
      accessControl: Keychain.ACCESS_CONTROL.USER_PRESENCE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: {title: 'Confirm your identity'},
    };
    const credentials = Keychain.getGenericPassword(options)
      .then(res => {
        if (res) return true;
        else return false;
      })
      .catch(e => {
        return false;
      });

    return credentials;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export const setItemToStorage = (key, data) => {
  try {
    if (data) {
      const jsonValue = JSON.stringify(data);
      SharedPreference.set(`${key}`, jsonValue);
      return true;
    }
  } catch (e) {
    console.log('mmkv error: ' + String(e));
    return undefined;
  }
};

export const savePostDraft = ({
  title,
  body,
  tags,
  category,
  community,
  beneficiaries,
  reward,
}: PostDraft): true | undefined => {
  const draft = setItemToStorage(AppStrings.POST_DRAFT, {
    ...getPostDraft(),
    title,
    body,
    tags,
    category,
    community,
    beneficiaries,
    reward,
  });

  return draft;
};

export const saveCommentDraft = (
  permlink: string,
  body: string,
): true | undefined => {
  const draft = setItemToStorage(
    AppStrings.COMMENT_DRAFT + '_' + permlink,
    body,
  );

  return draft;
};

export const getCommentDraft = (permlink: string): string => {
  const draft = getItemFromStorage(AppStrings.COMMENT_DRAFT + '_' + permlink);
  if (draft) {
    return draft as string;
  } else return '';
};

export const getPostDraft = (): PostDraft => {
  const draft = getItemFromStorage(AppStrings.POST_DRAFT);
  if (draft) {
    return draft as PostDraft;
  } else return empty_draft();
};

export const getItemFromStorage = (key: string) => {
  try {
    const data = SharedPreference.getString(`${key}`);
    if (data) {
      const jsonValue = JSON.parse(data);
      return jsonValue;
    }
  } catch {
    return undefined;
  }
};

export const removeItemFromStorage = key => {
  try {
    SharedPreference.delete(`${key}`);
    return true;
  } catch {
    return undefined;
    // remove error
  }
};

export const syncAccountData = async (data?: any) => {
  try {
    if (!isLogin()) {
      return;
    }
    if (data) {
      setItemToStorage(AppStrings.CURRENT_USER_SCHEMA, data);
      // dispatch(saveLoginHandler(data));
    } else {
      const accountData = getItemFromStorage(AppStrings.CURRENT_USER_SCHEMA) as
        | AccountExt
        | undefined;
      if (accountData) {
        const accountExt = await getAccountExt(accountData.name)
          .then(result => {
            if (result) {
              result.login = accountData.login;
              syncAccountData(result);
              return result;
            } else {
              console.log(`failed to refresh data for ${accountData.name}`);
              return false;
            }
          })
          .catch(error => {
            console.log(
              `failed to refresh data for ${accountData.name}`,
              error,
            );
            return accountData;
          });

        return accountExt as AccountExt;
      } else {
        return false;
      }
    }
  } catch (error: any) {
    return false;
  }
};

export const getServer = () => {
  try {
    const setting = getItemFromStorage(`${AppStrings.SETTINGS_SCHEMA}`);
    if (setting) {
      return setting.rpc;
    } else return undefined;
  } catch (error) {
    return undefined;
  }
};

export const getSnippets = async (
  username: string,
): Promise<Snippet[] | undefined> => {
  if (!username) {
    return [];
  }
  try {
    if (auth().currentUser) {
      const data = (
        await firestore().collection('Users').doc(username).get()
      ).data() as FirestoreUser;
      return data?.snippets ?? [];
    } else {
      auth()
        .signInAnonymously()
        .then(res => {
          if (res)
            firestore()
              .collection('Users')
              .doc(username)
              .set(
                {
                  name: username,
                  userId: res.user.uid,
                  timestamp: Date.now(),
                },
                {merge: true},
              )
              .then(() => {
                getSnippets(username);
              })
              .catch(err => {
                console.log('Setting Snippet Error', err);
              });
        })
        .catch(e => {
          console.log('Signingin Error', String(e));
        });
    }
  } catch (e) {
    console.log('FirebaseAuth Error', String(e));
  }
};

export const addSnippet = async (
  username: string,
  snippet: {title: string; body: string},
): Promise<unknown> => {
  const allSnippets = await getSnippets(username);
  if (allSnippets) {
    const limit = AppConstants.SNIPPETS_LIMIT;

    if (allSnippets.length >= limit) {
      AppConstants.SHOW_TOAST(`You can add maximum ${limit} snippets.`);
      throw new Error(`You can add maximum ${limit} snippets.`);
    }
    const docRef = firestore().collection('uniqueStrings').doc();
    const snipId = docRef.id;
    const result = firestore()
      .collection('Users')
      .doc(username)
      .set(
        {
          timestamp: Date.now(),
          snippets: allSnippets.concat([{...snippet, id: snipId}]),
        },
        {merge: true},
      )
      .then(() => {
        return true;
      })
      .catch(err => {
        console.log('Adding Snippet Error', err);
        throw new Error('Adding Snippet Error ' + String(err));
      });

    return result;
  } else {
    throw new Error(`Something went wrong, try again`);
  }
};

export const deleteSnippet = async (
  username: string,
  id: string,
): Promise<unknown> => {
  const allSnippets = await getSnippets(username);
  if (allSnippets) {
    const newSnippets = allSnippets.filter(item => item.id !== id);
    const result = firestore()
      .collection('Users')
      .doc(username)
      .set(
        {
          timestamp: Date.now(),
          snippets: newSnippets,
        },
        {merge: true},
      )
      .then(() => {
        return true;
      })
      .catch(err => {
        throw new Error(err);
      });

    return result;
  } else {
    throw new Error(`Something went wrong, try again`);
  }
};

export const updateSnippet = async (
  username: string,
  snippet: Snippet,
): Promise<unknown> => {
  const allSnippets = await getSnippets(username);
  if (allSnippets) {
    const newSnippets = allSnippets.map(item =>
      item.id === snippet.id
        ? {
            ...item,
            ...snippet,
          }
        : item,
    );
    const result = firestore()
      .collection('Users')
      .doc(username)
      .set(
        {
          timestamp: Date.now(),
          snippets: newSnippets,
        },
        {merge: true},
      )
      .then(() => {
        return true;
      })
      .catch(err => {
        throw new Error(err);
      });

    return result;
  } else {
    throw new Error(`Something went wrong, try again`);
  }
};
