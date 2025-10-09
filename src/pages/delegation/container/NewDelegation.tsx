import {HStack, VStack} from '@react-native-material/core';
import React, {useEffect, useState} from 'react';
import {Avatar, Button, Text, TextInput} from 'react-native-paper';
import {ScrollView, TouchableOpacity} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch} from 'react-redux';
import {useAppSelector} from '../../../constants/AppFunctions';
import {parseUsername, validateUsername} from '../../../utils/user';
import {getCredentials} from '../../../utils/realm';
import {AppColors} from '../../../constants/AppColors';
import {AppConstants} from '../../../constants/AppConstants';
import {AppStrings} from '../../../constants/AppStrings';
import {
  steemToVest,
  delegateVestingShares,
  vestToSteem,
} from '../../../steem/CondenserApis';
import {getResizedAvatar} from '../../../utils/ImageApis';
import {saveLoginInfo} from '../../../utils/handlers';
import {isFloatOrInt} from '../../../utils/utils';
import {Icons} from '../../../components/Icons';
import CardTextInput from '../../../components/basicComponents/CardTextInput';
import ConfirmationDialog from '../../../components/basicComponents/ConfirmationDialog';
import {toastConfig} from '../../../utils/toastConfig';

const NewDelegation = ({route}) => {
  const {account} = route?.params || {};
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const steemGlobals = useAppSelector(state => state.steemGlobalReducer.value);
  const [fromInput, setFromInput] = useState(loginInfo.name);
  let [toInput, setToInput] = useState(
    account ? (account.name === loginInfo.name ? '' : account.name) : '',
  );
  let [amountInput, setAmountInput] = useState('');
  const [confirmation, setConfirmation] = useState({open: false, body: <></>});
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState('VESTS');

 
  const transferConfirmation = async () => {
    setLoading(true);

    const credentials = await getCredentials();
    if (credentials) {
      const transferOptions = {
        delegatee: parseUsername(toInput),
        amount: steemToVest(
          parseFloat(amountInput),
          steemGlobals.steem_per_share,
        ),
        asset: asset,
      };

      delegateVestingShares(loginInfo, credentials!.password, transferOptions)
        .then((res: any) => {
          if (res?.id) {
            setToInput('');
            setAmountInput('');
            let vests_out = loginInfo.vests_out + transferOptions.amount;
            saveLoginInfo(dispatch, {...loginInfo, vests_out: vests_out});
            AppConstants.SHOW_TOAST(
              'Delegated',
              `${amountInput} ${'SP'} delegated to ${toInput}`,
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

  const handleTransfer = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }

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
    if (
      Number(amountInput) >
        vestToSteem(
          loginInfo.vests_own - loginInfo.vests_out,
          steemGlobals.steem_per_share,
        ) ||
      Number(amountInput) < 0
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
              ({amountInput} {`SP`})
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

          {Number(amountInput) === 0 && (
            <Text style={{marginTop: 10, fontSize: 10}}>
              Delegating 0 SP will remove the delegation.
            </Text>
          )}
        </VStack>
      ),
      open: true,
    });
  };

  return (
    <VStack fill mt={15}>
      <ScrollView keyboardShouldPersistTaps="always">
        <HStack items="center" spacing={10} mt={10}>
          <Text variant="labelMedium" style={{flex: 0.2}}>
            From
          </Text>
          <CardTextInput
            cardStyle={{flex: 1}}
            value={fromInput}
            onChangeText={setFromInput}
            placeholder="From"
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
            <CardTextInput
              cardStyle={{flex: 0}}
              value={amountInput}
              onChangeText={setAmountInput}
              placeholder="Amount"
              inputStyle={{fontWeight: 'normal'}}
              mode="outlined"
              inputMode="decimal"
            />

            <TouchableOpacity
              onPress={() => {
                setAmountInput(
                  vestToSteem(
                    loginInfo.vests_own - loginInfo.vests_out,
                    steemGlobals.steem_per_share,
                  ).toFixed(3),
                );
              }}>
              <Text style={{textDecorationLine: 'underline'}}>
                {`Available SP: ${vestToSteem(
                  loginInfo.vests_own - loginInfo.vests_out,
                  steemGlobals.steem_per_share,
                ).toFixed(3)}`}
              </Text>
            </TouchableOpacity>
          </VStack>
        </HStack>

        <HStack>
          <HStack style={{flex: 0.25}}></HStack>

          <HStack p={4} style={{flex: 1}}>
            <Button
              icon={'shield-sync'}
              style={{marginTop: 20, alignSelf: 'center'}}
              mode="contained"
              uppercase
              disabled={loading}
              loading={loading}
              onPress={handleTransfer}>
              Delegate
            </Button>
          </HStack>
        </HStack>

        <ConfirmationDialog
          visible={confirmation.open}
          setVisible={() => setConfirmation({...confirmation, open: false})}
          handlePrimaryClick={transferConfirmation}
          body={confirmation.body}
          handleSecondaryClick={() => {}}
        />
      </ScrollView>
      <Toast position="top" topOffset={80} config={toastConfig} />
    </VStack>
  );
};

export {NewDelegation};
