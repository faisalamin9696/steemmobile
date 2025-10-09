import {HStack, VStack} from '@react-native-material/core';
import React, {useEffect, useState} from 'react';
import {Avatar, Button, Text, TextInput} from 'react-native-paper';
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
import {
  steemToVest,
  transferToSavings,
  transferToVesting,
} from '../../steem/CondenserApis';
import {useDispatch} from 'react-redux';
import {saveLoginInfo} from '../../utils/handlers';
import ConfirmationDialog from './ConfirmationDialog';
import {AppStrings} from '../../constants/AppStrings';
import {Icons} from '../Icons';
import {AppColors} from '../../constants/AppColors';
import {useQueryClient} from '@tanstack/react-query';
import DropdownItem from './DropdownItem';
import {toastConfig} from '../../utils/toastConfig';

interface Props {
  visible: boolean;
  setVisible: any;
  isSaving: boolean;
  isSteem: boolean;
}

const PowerupModal = (props: Props) => {
  const {visible, setVisible, isSteem, isSaving} = props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const steemGlobals = useAppSelector(state => state.steemGlobalReducer.value);
  const [fromInput, setFromInput] = useState(loginInfo.name);

  let [toInput, setToInput] = useState(loginInfo.name);
  let [amountInput, setAmountInput] = useState('');
  let [advance, setAdvance] = useState(false);
  // const walletKey = MakeQueryKey('', 'wallet', loginInfo.name);
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState({open: false, body: <></>});
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const hideModal = () => setVisible(false);

  const [asset, setAsset] = useState(isSteem ? 'STEEM' : 'SBD');
  const [items, setItems] = useState<any>([
    {item: 'STEEM', value: 'STEEM'},
    {item: 'SBD', value: 'SBD'},
  ]);

  useEffect(() => {
    setAsset(isSteem ? 'STEEM' : 'SBD');
  }, [isSteem]);

  const transferConfirmation = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoading(true);

    const credentials = await getCredentials();
    if (credentials) {
      const transferOptions = {
        from: fromInput,
        to: parseUsername(toInput),
        amount: parseFloat(amountInput),
        asset: 'STEEM',
      };

      transferToVesting(loginInfo, credentials!.password, transferOptions)
        .then((res: any) => {
          if (res?.id) {
            setAmountInput('');
            if (advance) {
              setToInput(loginInfo.name);
              setAdvance(false);
            }
            const newBalancs =
              loginInfo.balance_steem - parseFloat(amountInput);
            const new_vests =
              loginInfo.vests_own +
              steemToVest(
                parseFloat(amountInput),
                steemGlobals.steem_per_share,
              );
            // queryClient.setQueryData([walletKey], { ...loginInfo, balance_steem: newBalancs, vests_own: new_vests });
            saveLoginInfo(dispatch, {
              ...loginInfo,
              balance_steem: newBalancs,
              vests_own: new_vests ?? 0,
            });
            AppConstants.SHOW_TOAST(
              'Powered Up',
              `${amountInput} STEEM Powered Up to ${toInput}`,
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

  const transferSavingConfirmation = async () => {
    setLoading(true);

    const credentials = await getCredentials();

    if (credentials) {
      const transferOptions = {
        to: parseUsername(toInput),
        username: loginInfo,
        amount: amountInput,
        privateKey: credentials!.password,
        asset: asset,
        memo: '',
      };

      transferToSavings(transferOptions)
        .then((res: any) => {
          if (res?.id) {
            setToInput('');
            setAmountInput('');
            let newBalance;
            if (asset === 'STEEM') {
              newBalance = loginInfo.savings_steem + parseFloat(amountInput);
              saveLoginInfo(dispatch, {
                ...loginInfo,
                savings_steem:
                  transferOptions.to === loginInfo.name
                    ? newBalance
                    : loginInfo.savings_steem,
                balance_steem:
                  loginInfo.balance_steem - (Number(amountInput) ?? 0),
              });
            } else {
              newBalance = loginInfo.savings_sbd + parseFloat(amountInput);
              saveLoginInfo(dispatch, {
                ...loginInfo,
                savings_sbd:
                  transferOptions.to === loginInfo.name
                    ? newBalance
                    : loginInfo.savings_sbd,
                balance_sbd: loginInfo.balance_sbd - (Number(amountInput) ?? 0),
              });
            }

            AppConstants.SHOW_TOAST(
              'Transfered',
              `${amountInput} ${asset} transfered to ${toInput}'s savings`,
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
          } else AppConstants.SHOW_TOAST('Failed', ``, 'error');
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

    amountInput = amountInput?.trim();

    if (!isFloatOrInt(amountInput)) {
      AppConstants.SHOW_TOAST('Invalid amount', '', 'info');
      return;
    }
    if (
      Number(amountInput) > Number(loginInfo.balance_steem) ||
      Number(amountInput) <= 0
    ) {
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
        </VStack>
      ),
      open: true,
    });
  };

  const handleAdvance = () => {
    // toggle advance option
    setAdvance(!advance);
    setToInput(loginInfo.name);
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
            title={isSaving ? 'Savings' : 'Power Up'}
            onClose={hideModal}
            subTitle={
              isSaving
                ? 'Protect funds by requiring a 3 day withdraw waiting period. '
                : `Influence tokens which give you more control over post payouts and allow you to earn on curation rewards.\n\nSTEEM POWER is non-transferable and requires 1 month (4 payments) to convert back to Steem.`
            }
          />
          <ScrollView keyboardShouldPersistTaps="always">
            <HStack items="center" spacing={10} mt={20}>
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
            {advance ? (
              <HStack
                items={isSaving ? 'center' : 'start'}
                spacing={10}
                mt={10}>
                <Text variant="labelMedium" style={{flex: 0.2}}>
                  To
                </Text>

                <VStack fill>
                  <CardTextInput
                    disabled={!advance || loading}
                    cardStyle={{flex: 1}}
                    value={toInput}
                    onChangeText={setToInput}
                    placeholder="Username"
                    inputStyle={{fontWeight: 'normal'}}
                    mode={!advance ? 'flat' : 'outlined'}
                    inputMode="text"
                    autoCapitalize="none"
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
                  {isSaving ? null : (
                    <Text style={{textAlign: 'justify', marginTop: 5}}>
                      {
                        'Converted STEEM POWER can be sent to yourself or someone else but can not transfer again without converting back to Steem.'
                      }
                    </Text>
                  )}
                </VStack>
              </HStack>
            ) : null}

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
                    cardStyle={{
                      flex: 0.35,
                      alignSelf: 'center',
                    }}
                    disabled={!isSaving}
                    value={asset}
                    items={items}
                    dropdownStyle={{width: undefined}}
                    onChange={item => {
                      setAsset(item.value);
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

            <HStack fill>
              <HStack style={{flex: 0.25}}></HStack>

              <HStack p={4} style={{flex: 1}} spacing={10}>
                {isSaving ? (
                  <Button
                    icon={'solar-power'}
                    style={{marginTop: 20, alignSelf: 'center'}}
                    mode="contained"
                    uppercase
                    disabled={loading}
                    loading={loading}
                    onPress={handleTransfer}>
                    Transfer
                  </Button>
                ) : (
                  <Button
                    icon={'solar-power'}
                    style={{marginTop: 20, alignSelf: 'center'}}
                    mode="contained"
                    uppercase
                    disabled={loading}
                    loading={loading}
                    onPress={handleTransfer}>
                    Power Up
                  </Button>
                )}

                <Button
                  style={{marginTop: 20, alignSelf: 'center'}}
                  mode="elevated"
                  uppercase
                  onPress={handleAdvance}>
                  {advance ? 'Basic' : 'Advance'}
                </Button>
              </HStack>
            </HStack>
          </ScrollView>
        </VStack>
        <ConfirmationDialog
          visible={confirmation.open}
          primaryText="Confirm"
          setVisible={() => setConfirmation({...confirmation, open: false})}
          handlePrimaryClick={
            isSaving ? transferSavingConfirmation : transferConfirmation
          }
          body={confirmation.body}
          handleSecondaryClick={() => {}}
        />
        <Toast position="top" topOffset={80} config={toastConfig} />
      </MainWrapper>
    </Modal>
  );
};

export default PowerupModal;
