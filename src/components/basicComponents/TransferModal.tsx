import {HStack, VStack} from '@react-native-material/core';
import React, {useEffect, useState} from 'react';
import {Avatar, Button, Card, Text, TextInput} from 'react-native-paper';
import {
  LayoutAnimation,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useAppSelector} from '../../constants/AppFunctions';
import {getResizedAvatar} from '../../utils/ImageApis';
import {parseUsername, validateUsername} from '../../utils/user';
import CardTextInput from './CardTextInput';
import Toast from 'react-native-toast-message';
import MainWrapper from '../wrappers/MainWrapper';
import ModalHeader from './ModalHeader';
import {AppConstants} from '../../constants/AppConstants';
import {isFloatOrInt} from '../../utils/utils';
import {getCredentials} from '../../utils/realm';
import {transferAsset} from '../../steem/CondenserApis';
import {useDispatch} from 'react-redux';
import {saveLoginInfo} from '../../utils/handlers';
import ConfirmationDialog from './ConfirmationDialog';
import {AppStrings} from '../../constants/AppStrings';
import {Icons} from '../Icons';
import {AppColors} from '../../constants/AppColors';
import DropdownItem from './DropdownItem';
import {toastConfig} from '../../utils/toastConfig';

interface Props {
  visible: boolean;
  setVisible: any;
  isSteem: boolean;
}

const TransferModal = (props: Props) => {
  const {visible, setVisible, isSteem} = props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const [fromInput, setFromInput] = useState(loginInfo.name);
  let [toInput, setToInput] = useState('');
  let [amountInput, setAmountInput] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [confirmation, setConfirmation] = useState({open: false, body: <></>});
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const hideModal = () => setVisible(false);

  // const walletKey = MakeQueryKey('', 'wallet', loginInfo.name);
  // const queryClient = useQueryClient();

  const [asset, setAsset] = useState<'STEEM' | 'SBD'>(
    isSteem ? 'STEEM' : 'SBD',
  );
  const items: {item: 'STEEM' | 'SBD'; value: 'STEEM' | 'SBD'}[] = [
    {item: 'STEEM', value: 'STEEM'},
    {item: 'SBD', value: 'SBD'},
  ];

  useEffect(() => {
    setAsset(isSteem ? 'STEEM' : 'SBD');
  }, [isSteem]);

  const transferConfirmation = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setLoading(true);

    const credentials = await getCredentials();
    if (credentials) {
      const transferOptions = {
        to: parseUsername(toInput),
        username: loginInfo,
        amount: amountInput,
        privateKey: credentials!.password,
        asset: asset,
        memo: memoInput,
      };

      transferAsset(transferOptions)
        .then((res: any) => {
          if (res?.id) {
            setToInput('');
            setAmountInput('');
            setMemoInput('');
            let newBalance;
            if (asset === 'STEEM') {
              newBalance = loginInfo.balance_steem - Number(amountInput);
              saveLoginInfo(dispatch, {
                ...loginInfo,
                balance_steem: newBalance ?? 0,
              });
              // queryClient.setQueryData([walletKey], { ...loginInfo, balance_steem: newBalance })
            } else {
              newBalance = loginInfo.balance_sbd - Number(amountInput);
              saveLoginInfo(dispatch, {
                ...loginInfo,
                balance_sbd: newBalance ?? 0,
              });
              // queryClient.setQueryData([walletKey], { ...loginInfo, balance_sbd: newBalance })
            }
            AppConstants.SHOW_TOAST(
              'Transfered',
              `${amountInput} ${asset} transfered to ${toInput}`,
              'success',
            );
          } else {
            AppConstants.SHOW_TOAST('Failed', ``, 'error');
          }
        })
        .catch(error => {
          if (String(error).includes('Missing Active Authority')) {
            AppConstants.SHOW_TOAST(
              'Failed',
              `Active key or above required`,
              'error',
            );
          } else AppConstants.SHOW_TOAST('Failed', String(error), 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    toInput = parseUsername(toInput);

    if (!validateUsername(toInput)) {
      AppConstants.SHOW_TOAST('Invalid username', '', 'info');
      return;
    }

    if (fromInput === toInput) {
      AppConstants.SHOW_TOAST('Cannot perform self-transfer', '', 'info');
      return;
    }

    amountInput = amountInput?.trim();

    if (!isFloatOrInt(amountInput)) {
      AppConstants.SHOW_TOAST('Invalid amount', '', 'info');
      return;
    }
    if (parseFloat(amountInput) <= 0) {
      AppConstants.SHOW_TOAST(
        'Invalid amount',
        'Amount is not transferable',
        'info',
      );
      return;
    }
    if (asset === 'STEEM')
      if (parseFloat(amountInput) > loginInfo.balance_steem) {
        AppConstants.SHOW_TOAST('Invalid amount', 'Insufficient funds', 'info');
        return;
      }
    if (asset === 'SBD')
      if (parseFloat(amountInput) > loginInfo.balance_sbd) {
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
              source={{uri: getResizedAvatar(fromInput)}}
            />
            <Text>{fromInput} </Text>
            <Text variant="labelSmall">
              ({amountInput} {asset})
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
              source={{uri: getResizedAvatar(parseUsername(toInput))}}
            />
            <Text>{parseUsername(toInput)}</Text>
          </HStack>
          <Text style={{marginTop: 20, opacity: 0.8}} variant="labelMedium">
            Memo
          </Text>
          <Text
            style={{
              opacity: 0.8,
              fontStyle: memoInput === '' ? 'italic' : 'normal',
              fontWeight: 'normal',
              fontSize: 10,
              marginTop: 5,
            }}>
            {memoInput === '' ? 'No Memo' : memoInput}
          </Text>
        </VStack>
      ),
      open: true,
    });
  };

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={hideModal}
      onDismiss={hideModal}
      presentationStyle={'fullScreen'}>
      <MainWrapper>
        <VStack fill style={{paddingHorizontal: 20, paddingTop: 20}}>
          <ModalHeader
            title="Transfer"
            onClose={hideModal}
            subTitle={`Move funds to another Steem account.`}
          />
          <ScrollView keyboardShouldPersistTaps="always">
            <HStack items="center" spacing={10} mt={10}>
              <Text variant="labelMedium" style={{flex: 0.2}}>
                From
              </Text>
              <CardTextInput
                cardStyle={{flex: 1}}
                value={fromInput}
                onChangeText={setFromInput}
                placeholder="Weight"
                inputStyle={{fontWeight: 'normal'}}
                mode="flat"
                inputMode="text"
                disabled
                inputRight={
                  <TextInput.Icon
                    disabled
                    icon={() => (
                      <Avatar.Image
                        style={{backgroundColor: 'white'}}
                        size={25}
                        source={{
                          uri: validateUsername(parseUsername(fromInput))
                            ? getResizedAvatar(parseUsername(fromInput))
                            : AppStrings.ERROR_404,
                        }}
                      />
                    )}
                  />
                }
              />
            </HStack>
            <HStack items="center" spacing={10} mt={10}>
              <Text variant="labelMedium" style={{flex: 0.2}}>
                To
              </Text>
              <CardTextInput
                cardStyle={{flex: 1}}
                value={toInput}
                onChangeText={setToInput}
                placeholder="Username"
                inputStyle={{fontWeight: 'normal'}}
                mode="outlined"
                inputMode="text"
                autoCapitalize="none"
                disabled={loading}
                inputRight={
                  <TextInput.Icon
                    disabled
                    icon={() => (
                      <Avatar.Image
                        size={25}
                        style={{backgroundColor: 'white'}}
                        source={{
                          uri: validateUsername(parseUsername(toInput))
                            ? getResizedAvatar(parseUsername(toInput))
                            : AppStrings.ERROR_404,
                        }}
                      />
                    )}
                  />
                }
              />
            </HStack>

            <HStack items="center" spacing={10} mt={10}>
              <Text variant="labelMedium" style={{flex: 0.2}}>
                Amount
              </Text>

              <VStack style={{flex: 1}}>
                <HStack>
                  <CardTextInput
                    cardStyle={{flex: 0.75, marginEnd: 10}}
                    value={amountInput}
                    onChangeText={setAmountInput}
                    placeholder="Amount"
                    inputStyle={{fontWeight: 'normal'}}
                    mode="outlined"
                    inputMode="decimal"
                    disabled={loading}
                  />

                  <DropdownItem
                    value={asset}
                    items={items}
                    dropdownStyle={{width: undefined}}
                    cardStyle={{
                      flex: 0.35,
                      alignSelf: 'center',
                    }}
                    onChange={item => {
                      setAsset(item.value as 'STEEM' | 'SBD');
                    }}
                  />
                </HStack>

                <TouchableOpacity
                  disabled={loading}
                  onPress={() => {
                    setAmountInput(
                      asset === 'STEEM'
                        ? loginInfo.balance_steem?.toFixed(3)
                        : loginInfo.balance_sbd?.toFixed(3),
                    );
                  }}>
                  <Text style={{textDecorationLine: 'underline'}}>
                    {`Available ${asset}: ${
                      asset === 'STEEM'
                        ? loginInfo.balance_steem.toFixed(3)
                        : loginInfo.balance_sbd.toFixed(3)
                    }`}
                  </Text>
                </TouchableOpacity>
              </VStack>
            </HStack>

            <HStack items="center" spacing={10} mt={10}>
              <Text variant="labelMedium" style={{flex: 0.2}}>
                Memo
              </Text>
              <CardTextInput
                cardStyle={{flex: 1}}
                value={memoInput}
                onChangeText={setMemoInput}
                placeholder="Memo"
                inputStyle={{fontWeight: 'normal'}}
                mode="outlined"
                inputMode="text"
                multiline
                numberOfLines={3}
                disabled={loading}
              />
            </HStack>

            <HStack fill>
              <HStack style={{flex: 0.25}}></HStack>

              <HStack p={4} style={{flex: 1}}>
                <Button
                  icon={'transfer'}
                  style={{marginTop: 20, alignSelf: 'center'}}
                  mode="contained"
                  uppercase
                  disabled={loading}
                  loading={loading}
                  onPress={handleTransfer}>
                  Transfer
                </Button>
              </HStack>
            </HStack>
          </ScrollView>
        </VStack>
        <ConfirmationDialog
          visible={confirmation.open}
          primaryText="Confirm"
          setVisible={() => setConfirmation({...confirmation, open: false})}
          handlePrimaryClick={transferConfirmation}
          body={confirmation.body}
          handleSecondaryClick={() => {}}
        />
        <Toast position="top" topOffset={80} config={toastConfig} />
      </MainWrapper>
    </Modal>
  );
};

export default TransferModal;
