import React, {useEffect, useState} from 'react';

// import FingerprintScanner from 'react-native-fingerprint-scanner';

// Component
import PinCodeView from '../children/pinCodeView';
import {Decrypt, Encrypt, encryptKey} from '../../../utils/encrypt';
import {useAppSelector} from '../../../constants/AppFunctions';
import {
  addNewCredential,
  getAllCredentials,
  getCredentials,
  setSettings,
  storeCredentials,
} from '../../../utils/realm';
import {useDispatch} from 'react-redux';
import {AppConstants} from '../../../constants/AppConstants';
import {AppGlobals} from '../../../constants/AppGlobals';
import {AppRoutes} from '../../../constants/AppRoutes';
import {saveLoginInfo} from '../../../utils/handlers';
import * as Keychain from 'react-native-keychain';
import auth from '@react-native-firebase/auth';
import ConfirmationDialog from '../../../components/basicComponents/ConfirmationDialog';
import {delay} from '../../../utils/editor';

interface Props {
  navigation: any;
  pinCodeParams: {isReset: boolean; isNew: boolean};
  applicationPinCode;
  encUnlockPin;
  isBiometricEnabled: boolean;
  hideCloseButton: boolean;
}

const PinCodeContainer = (props: Props) => {
  let screenRef: any = null;
  const {pinCodeParams, hideCloseButton, navigation} = props;

  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const settings = useAppSelector(state => state.settingsReducer.value);
  const dispatch = useDispatch();
  const [progressDialog, setProgressDialog] = useState(false);
  const accountsKey = 'user-accounts';
  const [confirmation, setConfirmation] = useState(false);

  let [pinData, setPinData] = useState({
    informationText: '',
    newPinCode: null,
    isOldPinVerified: false,
    oldPinCode: '',
    failedAttempts: 0,
  });

  useEffect(() => {
    if (pinCodeParams.isNew) {
      setPinData({...pinData, informationText: 'Set New PIN'});
    } else {
      setPinData({
        ...pinData,
        informationText: `Enter to unlock${
          pinCodeParams.isReset
            ? '\nPIN removal deletes multiple account credentials'
            : ''
        }`,
      });
    }

    // _processBiometric();
  }, [settings.pinEnabled]);

  // const _processBiometric = async () => {
  //     try {
  //         const {
  //             pinCodeParams: { isReset },
  //             applicationPinCode,
  //             encUnlockPin,
  //             isBiometricEnabled,
  //         } = props;

  //         if (isReset || !isBiometricEnabled) {
  //             return;
  //         }

  //         const biometryType = await FingerprintScanner.isSensorAvailable();
  //         console.log('biometryType is => ', biometryType);

  //         await FingerprintScanner.authenticate({
  //             description: 'Scan your fingerprint',
  //         });
  //         console.log('successfully passed biometric auth');

  //         // code gets here means biometeric succeeded
  //         if (screenRef) {
  //             const encPin = encUnlockPin || applicationPinCode;
  //             const verifiedPin = decryptKey(encPin, Config.REACT_APP_ENC_KEY);
  //             screenRef.setPinThroughBiometric(verifiedPin);
  //         }
  //     } catch (err) {
  //         console.warn('Failed to process biometric', err);
  //     }

  //     FingerprintScanner.release();
  // };

  const handleLogout = async (navigate?: boolean) => {
    if (confirmation) setConfirmation(false);

    setProgressDialog(true);
    await delay(500);
    await Keychain.resetInternetCredentials({"server": accountsKey});
    Keychain.resetGenericPassword()
      .then(() => {
        auth().signOut();
        saveLoginInfo(dispatch, undefined, true);
        if (!navigate) AppConstants.SHOW_TOAST('Pin code reset', '', 'success');
        if (navigate) {
          navigation.navigate(AppRoutes.DRAWER.HomeDrawer);
        }
      })
      .catch(() => {
        AppConstants.SHOW_TOAST('Failed', '', 'error');
      })
      .finally(() => {
        setProgressDialog(false);
      });
  };

  const handlePinFailed = () => {
    const attempts = pinData.failedAttempts + 1;
    if (attempts >= AppConstants.MAX_PIN_ATTEMPS) {
      handleLogout(true);
      return;
    }

    pinData.informationText = `Enter to unlock, failed attempt (${attempts}/${AppConstants.MAX_PIN_ATTEMPS})`;

    setPinData({
      ...pinData,
      failedAttempts: attempts,
      informationText: `${pinData.informationText}`,
    });

    if (attempts === 2) {
      setPinData({
        ...pinData,
        failedAttempts: attempts,
        informationText: `${pinData.informationText}\nNote: All credentials will be cleared in next failed attempt`,
      });
    }

    AppConstants.SHOW_TOAST('Invalid PIN Code');
    setProgressDialog(false);
  };

  const onPinRemoveSuccess = () => {
    AppGlobals.PIN_CODE = '';
    setSettings({pinEnabled: false}, dispatch);
    setProgressDialog(false);
    AppConstants.SHOW_TOAST('Pin code removed', '', 'success');
    navigation.pop();
  };

  const onPinRemoveFailed = () => {
    setProgressDialog(false);
    AppConstants.SHOW_TOAST('Failed', 'Something went wrong');
  };

  const handleRemovePin = async () => {
    // const allAccounts = await getAllCredentials();
    // let keysList: any[] = [];

    // if (allAccounts) {
    //     const oldAccounts = JSON.parse(allAccounts.password);
    //     keysList = keysList.concat(oldAccounts);
    //     // check uniqueness

    //     for (var item of keysList) {
    //         const name = Object.keys(item)[0];
    //         const password = item?.[name]?.password;
    //         console.log(decryptKey(Decrypt(password),
    //             Decrypt(AppGlobals.PIN_CODE), undefined));

    //     }
    // }
    // return
    setProgressDialog(true);
    await delay(500);

    const credentials = await getCredentials();
    if (credentials) {
      const stored_cred = await storeCredentials(
        credentials.username,
        Encrypt(credentials.password),
      );
      if (stored_cred) {
        await Keychain.resetInternetCredentials({server:accountsKey});

        onPinRemoveSuccess();
        // let keysList: any[] = [];
        // const allAccounts = await getAllCredentials();
        // if (allAccounts) {
        //     const oldAccounts = JSON.parse(allAccounts.password);
        //     keysList = keysList.concat(oldAccounts);
        //     // check uniqueness

        //     for (var item of keysList) {
        //         const name = Object.keys(item)[0];
        //         const password = item?.[name]?.password;
        //         const stored = await addNewCredential(name, decryptKey(Decrypt(password),
        //             Decrypt(AppGlobals.PIN_CODE), undefined));
        //         if (stored)
        //             continue
        //         else {
        //             onPinRemoveFailed();
        //             break
        //         }
        //     }
        //     onPinRemoveSuccess();

        // } else {
        //     onPinRemoveSuccess();
        // }
      } else {
        onPinRemoveFailed();
      }
    } else {
      onPinRemoveFailed();
    }
  };
  const handlePinCode = async (pin: string) => {
    const {oldPinCode} = pinData;
    if (pinCodeParams.isNew && !oldPinCode) {
      setPinData({...pinData, informationText: 'Enter again', oldPinCode: pin});
    } else if (oldPinCode && oldPinCode !== pin) {
      AppConstants.SHOW_TOAST('PIN does not matched');
      return;
    } else {
      if (pinCodeParams.isNew) {
        setProgressDialog(true);
        await delay(500);

        AppGlobals.PIN_CODE = Encrypt(pin);
        const credentials = await getCredentials();

        // const allAccounts = await getAllCredentials();
        // let keysList: any[] = [];

        // if (allAccounts) {
        //     const oldAccounts = JSON.parse(allAccounts.password);
        //     keysList = keysList.concat(oldAccounts);
        //     for (var item of keysList) {
        //         const name = Object.keys(item)[0];
        //         const password = item?.[name]?.password;
        //     }
        // }
        // return
        if (credentials) {
          const stored = await storeCredentials(
            credentials.username,
            Encrypt(encryptKey(credentials.password, pin)),
          );
          if (stored) {
            const allAccounts = await getAllCredentials();
            let keysList: any[] = [];

            if (allAccounts) {
              const oldAccounts = JSON.parse(allAccounts.password);
              keysList = keysList.concat(oldAccounts);
              for (var item of keysList) {
                const name = Object.keys(item)[0];
                const password = item?.[name]?.password;
                const stored = await addNewCredential(name, Decrypt(password));
                if (stored) continue;
                else {
                  setProgressDialog(false);
                  AppConstants.SHOW_TOAST(
                    'Failed',
                    'Something went wrong',
                    'error',
                  );
                  break;
                }
              }
            }

            setSettings({pinEnabled: true}, dispatch);
            AppConstants.SHOW_TOAST('Pin code added', '', 'success');
            navigation.pop();
          } else {
            setProgressDialog(false);
            AppConstants.SHOW_TOAST('Failed', 'Something went wrong', 'error');
          }
        } else {
          setProgressDialog(false);
          AppConstants.SHOW_TOAST('Failed', 'Something went wrong', 'error');
        }
      } else {
        if (pinCodeParams.isReset) {
          AppGlobals.PIN_CODE = Encrypt(pin);
          handleRemovePin();
        } else {
          setProgressDialog(true);
          await delay(500);
          AppGlobals.PIN_CODE = Encrypt(pin);
          const credentials = await getCredentials();
          if (credentials) {
            if (!credentials.password) {
              handlePinFailed();
            } else {
              if (pinCodeParams?.['target']) {
                navigation.replace(AppRoutes.DRAWER.HomeDrawer);
                navigation.push(pinCodeParams?.['target'], {
                  ...pinCodeParams?.['targetProps'],
                });
              } else navigation.replace(AppRoutes.DRAWER.HomeDrawer);
            }
          } else {
            handlePinFailed();
          }
        }
      }
    }
  };

  return (
    <>
      <PinCodeView
        hideCloseButton={hideCloseButton}
        ref={ref => (screenRef = ref)}
        informationText={pinData.informationText}
        setPinCode={handlePinCode}
        showForgotButton={!pinCodeParams.isNew}
        username={loginInfo.name}
        handleForgotButton={() => {
          setConfirmation(true);
        }}
        isReset={false}
        pinCodeParams={undefined}
        applicationPinCode={undefined}
        encUnlockPin={undefined}
        unlocking={progressDialog}
        isBiometricEnabled={false}
      />

      {/* {progressDialog ? <ProgressDialog
            visible={progressDialog} setVisible={setProgressDialog} /> : null} */}

      <ConfirmationDialog
        visible={confirmation}
        setVisible={setConfirmation}
        title="Confirmation"
        body={'Do you really want to clear all stored credentials?'}
        handlePrimaryClick={() => {
          handleLogout(true);
        }}
        primaryText="Yes"
      />
    </>
  );
};

export default PinCodeContainer;
