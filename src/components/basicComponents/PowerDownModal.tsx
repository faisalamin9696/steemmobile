import {HStack, VStack} from '@react-native-material/core';
import React, {useEffect, useState} from 'react';
import {Avatar, Button, MD2Colors, Text, TextInput} from 'react-native-paper';
import {LayoutAnimation, Modal, ScrollView} from 'react-native';
import {useAppSelector} from '../../constants/AppFunctions';
import {getResizedAvatar} from '../../utils/ImageApis';
import {parseUsername} from '../../utils/user';
import CardTextInput from './CardTextInput';
import Toast from 'react-native-toast-message';
import MainWrapper from '../wrappers/MainWrapper';
import ModalHeader from './ModalHeader';
import {AppConstants} from '../../constants/AppConstants';
import {isFloatOrInt} from '../../utils/utils';
import {getCredentials} from '../../utils/realm';
import {
  steemToVest,
  vestToSteem,
  withdrawVesting,
} from '../../steem/CondenserApis';
import {useDispatch} from 'react-redux';
import ConfirmationDialog from './ConfirmationDialog';
import {toastConfig} from '../../utils/toastConfig';
import {useMutation} from '@tanstack/react-query';
import moment from 'moment';
import {saveLoginHandler} from '../../redux/reducers/LoginReducer';
import Slider from '@react-native-community/slider';
import {AppColors} from '../../constants/AppColors';

interface Props {
  visible: boolean;
  setVisible: any;
  cancel?: boolean;
}

const TransferModal = (props: Props) => {
  const {visible, setVisible, cancel} = props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const steemGlobals = useAppSelector(state => state.steemGlobalReducer.value);
  let [amountInput, setAmountInput] = useState('');
  const [confirmation, setConfirmation] = useState({open: false, body: <></>});
  const dispatch = useDispatch();
  const hideModal = () => setVisible(false);

  // Start loading the interstitial straight away

  // Unsubscribe from events on unmount

  const availableBalance = vestToSteem(
    loginInfo.vests_own - loginInfo.vests_out - loginInfo.powerdown,
    steemGlobals.steem_per_share,
  );

  const withdrawMutation = useMutation({
    mutationFn: (data: {key: string; amount: number}) =>
      withdrawVesting(loginInfo, data.key, data.amount),
    onSettled(data, error, variables, context) {
      if (error) {
        AppConstants.SHOW_TOAST('Failed', String(error), 'error');
        return;
      }
      dispatch(
        saveLoginHandler({
          ...loginInfo,
          powerdown: Number(variables.amount),
          next_powerdown: cancel ? 0 : moment().add(5, 'days').unix(),
          powerdown_rate: cancel ? 0 : Number(variables.amount) / 5,
        }),
      );

      hideModal();
      if (cancel) AppConstants.SHOW_TOAST('Power down canceled', '', 'success');
      else
        AppConstants.SHOW_TOAST(
          `${vestToSteem(
            variables.amount,
            steemGlobals.steem_per_share,
          )?.toLocaleString()} Steem power down started`,
          '',
          'success',
        );
    },
  });

  const transferConfirmation = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const credentials = await getCredentials();
    if (credentials && credentials.password) {
      withdrawMutation.mutate({
        key: credentials.password,
        amount: cancel
          ? 0
          : steemToVest(Number(amountInput), steemGlobals.steem_per_share),
      });
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const handleTransfer = async () => {
    amountInput = amountInput?.trim();

    if (!isFloatOrInt(amountInput) && !cancel) {
      AppConstants.SHOW_TOAST('Invalid amount', '', 'info');
      return;
    }
    if (parseFloat(amountInput) < 0.001 && !cancel) {
      AppConstants.SHOW_TOAST(
        'Invalid amount',
        'Amount can not be less than 0.001',
        'info',
      );
      return;
    }

    setConfirmation({
      ...confirmation,
      body: (
        <HStack spacing={4} items="center">
          <Text>{(cancel ? 'Cancel ' : '') + 'Power Down'}</Text>
          {!cancel && <Text variant="labelSmall">({amountInput} SP)</Text>}
        </HStack>
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
            title={(cancel ? 'Cancel ' : '') + 'Power Down'}
            onClose={hideModal}
            // subTitle={`Move funds to another Steem account.`}
          />
          <ScrollView keyboardShouldPersistTaps="always">
            <VStack spacing={10}>
              <HStack style={{flex: 1}} mt={10} justify="between">
                <Slider
                  disabled={withdrawMutation.isPending || cancel}
                  style={{flex: 1}}
                  minimumValue={0}
                  maximumValue={availableBalance}
                  value={Number(amountInput)}
                  step={0.001}
                  minimumTrackTintColor={MD2Colors.green600}
                  maximumTrackTintColor={MD2Colors.red400}
                  onValueChange={value =>
                    setAmountInput(value.toLocaleString())
                  }
                />
                <Text style={{textAlign: 'right'}} variant="labelSmall">
                  {(
                    (Number(amountInput || 0) / availableBalance) *
                    100
                  )?.toFixed(2)}{' '}
                  %
                </Text>
              </HStack>

              <CardTextInput
                cardStyle={{flex: 1}}
                value={amountInput?.toLocaleLowerCase()}
                onChangeText={setAmountInput}
                placeholder="Amount"
                inputStyle={{fontWeight: 'normal'}}
                mode="outlined"
                inputMode="decimal"
                disabled={withdrawMutation.isPending || cancel}
                inputRight={
                  <TextInput.Icon
                    disabled
                    icon={() => (
                      <Avatar.Image
                        size={25}
                        style={{backgroundColor: 'white'}}
                        source={{
                          uri: getResizedAvatar(parseUsername(loginInfo.name)),
                        }}
                      />
                    )}
                  />
                }
              />
            </VStack>

            <VStack spacing={6}>
              {!!loginInfo.powerdown && (
                <Text variant="labelSmall" style={{textAlign: 'justify'}}>
                  {`You're currently powering down ${vestToSteem(
                    loginInfo.powerdown,
                    steemGlobals.steem_per_share,
                  )?.toLocaleString()} STEEM, with ${vestToSteem(
                    loginInfo.powerdown_done,
                    steemGlobals.steem_per_share,
                  )?.toLocaleString()} STEEM paid out so far. Changing the power down amount will reset the payout schedule.`}
                </Text>
              )}

              {!!loginInfo.vests_out && (
                <Text variant="labelSmall" style={{textAlign: 'justify'}}>
                  {`You're delegating ${vestToSteem(
                    loginInfo.vests_out,
                    steemGlobals.steem_per_share,
                  )?.toLocaleString()} STEEM. This amount is locked and can't be powered down until the delegation is removed, which takes 5 days.`}
                </Text>
              )}

              {parseFloat(amountInput) > availableBalance - 5 && (
                <Text
                  variant="labelSmall"
                  style={{textAlign: 'justify', color: AppColors.ERROR}}>
                  {`Leaving less than 5 STEEM POWER in your account is not recommended and can leave your account in a unusable state.`}
                </Text>
              )}
            </VStack>

            <HStack fill>
              <HStack style={{flex: 0.25}}></HStack>

              <HStack p={4} style={{flex: 1}}>
                <Button
                  icon={'transfer'}
                  style={{marginTop: 20, alignSelf: 'center'}}
                  mode="contained"
                  uppercase
                  disabled={withdrawMutation.isPending}
                  loading={withdrawMutation.isPending}
                  onPress={handleTransfer}>
                  {(cancel ? 'Cancel ' : '') + 'Power Down'}
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
