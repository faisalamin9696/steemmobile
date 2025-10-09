import {HStack, VStack} from '@react-native-material/core';
import {Avatar, Button, Card, Text} from 'react-native-paper';
import {TouchableOpacity, View} from 'react-native';
import {
  delegateVestingShares,
  steemToVest,
  vestToSteem,
} from '../../../steem/CondenserApis';
import {useEffect, useMemo, useState} from 'react';
import {isFloatOrInt} from '../../../utils/utils';
import {AppConstants} from '../../../constants/AppConstants';
import {getCredentials} from '../../../utils/realm';
import {useDispatch} from 'react-redux';
import {useQueryClient} from '@tanstack/react-query';
import {parseUsername} from '../../../utils/user';
import {saveLoginInfo} from '../../../utils/handlers';
import {getResizedAvatar} from '../../../utils/ImageApis';
import {AppColors} from '../../../constants/AppColors';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import TimeAgoWrapper from '../../../components/wrappers/TimeAgoWrapper';
import ConfirmationModal from '../../../components/basicComponents/ConfirmationModal';
import CardTextInput from '../../../components/basicComponents/CardTextInput';
import {Icons} from '../../../components/Icons';

interface DelegationProps {
  item: Delegation;
  index: number;
  loginInfo: AccountExt;
  steemGlobals: SteemProps;
  account: AccountExt;
  navigation: any;
}

const EditorItem = (
  props: DelegationProps & {
    loading: boolean;
    handleUpdateClick: (item: Delegation, amount: string) => void;
  },
) => {
  const {item, index, loginInfo, steemGlobals, loading, handleUpdateClick} =
    props;
  const [amountInput, setAmountInput] = useState('0');

  const totalAvailable = useMemo(
    () =>
      (
        vestToSteem(
          loginInfo.vests_own - loginInfo.vests_out,
          steemGlobals.steem_per_share,
        ) +
        item.vests * steemGlobals.steem_per_share
      ).toFixed(3),
    [loginInfo.vests_own, loginInfo.vests_out, steemGlobals.steem_per_share],
  );

  return (
    <HStack items="center" spacing={10}>
      <Text variant="labelMedium" style={{flex: 0.2, marginTop: -20}}>
        New Amount
      </Text>
      <VStack style={{flex: 1}}>
        <CardTextInput
          disabled={loading}
          cardStyle={{flex: 0}}
          value={amountInput}
          onChangeText={setAmountInput}
          placeholder="Amount"
          inputStyle={{fontWeight: 'normal'}}
          mode="outlined"
          inputMode="decimal"
        />
        <VStack spacing={4}>
          <TouchableOpacity
            disabled={loading}
            onPress={() => {
              setAmountInput(totalAvailable);
            }}>
            <Text style={{textDecorationLine: 'underline'}}>
              {`Available: ${totalAvailable}`}
            </Text>
          </TouchableOpacity>

          <Button
            uppercase
            onPress={() => handleUpdateClick(item, amountInput)}
            mode="elevated"
            disabled={loading}
            loading={loading}
            style={{alignSelf: 'flex-start'}}
            labelStyle={{marginVertical: 3, fontSize: 12}}>
            {'UPDATE'}
          </Button>
        </VStack>
      </VStack>
    </HStack>
  );
};

const OutgoingItem = (props: DelegationProps) => {
  const {account, item, index, loginInfo, steemGlobals, navigation} = props;
  const [update, setUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const isSelf = account.name === loginInfo.name;
  const accountData: AccountExt = isSelf ? loginInfo : account;
  const outgoingKey = `Delagation-${accountData.name}-Outgoing`;

  const [confirmation, setConfirmation] = useState({
    open: false,
    body: <></>,
    item: {
      time: 0,
      from: '',
      to: '',
      vests: 0,
    },
    amount: '0',
  });

  const totalAvailable = useMemo(
    () =>
      (
        vestToSteem(
          loginInfo.vests_own - loginInfo.vests_out,
          steemGlobals.steem_per_share,
        ) +
        item.vests * steemGlobals.steem_per_share
      ).toFixed(3),
    [loginInfo.vests_own, loginInfo.vests_out, steemGlobals.steem_per_share],
  );

  const updateConfirmation = async (
    currentItem: Delegation,
    amount: string,
  ) => {
    setLoading(true);
    const credentials = await getCredentials();
    if (credentials && currentItem) {
      const total_amount_vests = steemToVest(
        parseFloat(amount),
        steemGlobals.steem_per_share,
      );
      const transferOptions = {
        delegatee: parseUsername(currentItem.to),
        amount: total_amount_vests,
        asset: 'VESTS',
      };

      delegateVestingShares(loginInfo, credentials!.password, transferOptions)
        .then((res: any) => {
          if (res?.id) {
            const oldData = queryClient.getQueryData<Delegation[]>([
              outgoingKey,
            ]);
            if (oldData)
              queryClient.setQueryData([outgoingKey], () => {
                return oldData.map(item =>
                  item.to === currentItem.to
                    ? {...item, vests: total_amount_vests}
                    : item,
                );
              });
            setUpdate(false);
            let vests_out =
              loginInfo.vests_out - currentItem.vests + total_amount_vests;
            saveLoginInfo(dispatch, {...loginInfo, vests_out: vests_out});
            AppConstants.SHOW_TOAST(
              'Delegation Updated',
              `${amount} ${'SP'} delegated to ${currentItem.to}`,
              'success',
            );
          } else {
            AppConstants.SHOW_TOAST('Failed', ``, 'error');
          }
        })
        .catch(error => {
          AppConstants.SHOW_TOAST('Failed', String(error), 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
      setLoading(false);
    }
  };

  const handleUpdateClick = (item: Delegation, amount) => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }

    amount = amount?.trim();
    if (!isFloatOrInt(amount)) {
      AppConstants.SHOW_TOAST('Invalid amount', '', 'info');
      return;
    }

    console.log(
      amount,
      totalAvailable,
      amount > parseFloat(totalAvailable),
      amount < 0,
    );
    if (amount > parseFloat(totalAvailable) || amount < 0) {
      AppConstants.SHOW_TOAST('Invalid amount', 'Insufficient funds', 'info');
      return;
    }
    setConfirmation({
      ...confirmation,
      body: (
        <VStack>
          <HStack items={'center'} mt={5} spacing={5}>
            <Avatar.Image
              size={20}
              style={{backgroundColor: 'white'}}
              source={{uri: getResizedAvatar(item.from)}}
            />
            <Text>{item.from} </Text>
            <Text variant="labelSmall">
              ({amount} {`SP`})
            </Text>
          </HStack>
          <Icons.MaterialCommunityIcons
            color={AppColors.STEEM}
            style={{padding: 4, marginTop: 5}}
            name="arrow-down"
          />
          <HStack items={'center'} mt={5} spacing={5}>
            <Avatar.Image
              size={20}
              style={{backgroundColor: 'white'}}
              source={{uri: getResizedAvatar(parseUsername(item.to))}}
            />
            <Text>{parseUsername(item.to)}</Text>
          </HStack>

          {Number(amount) === 0 ? (
            <Text style={{marginTop: 10, fontSize: 10}}>
              Delegating 0 SP will remove the delegation.
            </Text>
          ) : (
            <Text style={{marginTop: 10, fontSize: 10}}>
              Update will override the current delegation.
            </Text>
          )}
        </VStack>
      ),
      open: true,
      item: item,
      amount: amount,
    });
  };

  return (
    <View>
      <Card mode="contained">
        <Card.Content style={{paddingHorizontal: 6, paddingVertical: 6}}>
          <HStack spacing={10} items="center">
            <View>
              <BadgeAvatar name={item.to} navigation={navigation} />
            </View>
            <VStack spacing={4}>
              <HStack items="center" spacing={10}>
                <Text variant="labelLarge">{item.to}</Text>
                <View>
                  <TimeAgoWrapper date={item.time * 1000} />
                </View>
              </HStack>
              <Text variant="labelSmall">
                {(item.vests * steemGlobals.steem_per_share)?.toFixed(3)} SP
              </Text>
            </VStack>

            {isSelf ? (
              <Button
                uppercase
                onPress={() => setUpdate(!update)}
                mode="elevated"
                disabled={loading}
                style={{position: 'absolute', right: 0}}
                labelStyle={{
                  marginVertical: 3,
                  fontSize: 12,
                  marginHorizontal: 6,
                }}>
                {update ? 'CANCEL' : 'EDIT'}
              </Button>
            ) : null}
          </HStack>

          {isSelf && update && (
            <EditorItem
              loading={loading}
              handleUpdateClick={handleUpdateClick}
              {...props}
            />
          )}
        </Card.Content>
      </Card>

      {confirmation.open ? (
        <ConfirmationModal
          visible={confirmation.open}
          setVisible={() => setConfirmation({...confirmation, open: false})}
          handlePrimaryClick={() =>
            updateConfirmation(confirmation.item, confirmation.amount)
          }
          body={confirmation.body}
          primaryText="Update"
          handleSecondaryClick={() => {}}
        />
      ) : null}
    </View>
  );
};
export {OutgoingItem};
