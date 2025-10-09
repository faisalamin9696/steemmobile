import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Platform,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Feather from 'react-native-vector-icons/Feather';
import {
  Avatar,
  Button,
  Card,
  MD2Colors,
  Text,
  TextInput,
} from 'react-native-paper';
//// config
// import Config from 'react-native-config';
// blockchain api
import {validateUsername} from '../../../utils/user';
import AnimatedLottieView from 'lottie-react-native';
import {wifIsValid} from '../../../steem/CondenserApis';
import {AppColors} from '../../../constants/AppColors';
import {getAccountExt} from '../../../steem/SteemApis';
import {
  storeCredentials,
  setItemToStorage,
  getCredentials,
  addNewCredential,
} from '../../../utils/realm';
import {AppStrings} from '../../../constants/AppStrings';
import {AppConstants} from '../../../constants/AppConstants';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {HStack, VStack} from '@react-native-material/core';
import {PrivateKey} from '@steempro/dsteem';
import {KeyTypes} from '../../../constants/AppTypes';
import {saveLoginHandler} from '../../../redux/reducers/LoginReducer';
import {useDispatch} from 'react-redux';
import {useQueryClient} from '@tanstack/react-query';
import auth from '@react-native-firebase/auth';
import firestore, {firebase} from '@react-native-firebase/firestore';
import {useAppSelector} from '../../../constants/AppFunctions';
import {saveLoginInfo} from '../../../utils/handlers';
import {Decrypt, Encrypt, encryptKey} from '../../../utils/encrypt';
import {AppGlobals} from '../../../constants/AppGlobals';
import {AppRoutes} from '../../../constants/AppRoutes';
import {getFcmToken} from '../../../services/NotificationService';

interface Props {
  route: any;
  navigation: any;
}
const LoginPage = (props: Props) => {
  //// props
  const {navigation} = props;
  const [loading, setLoading] = useState(false);
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const settings = useAppSelector(state => state.settingsReducer.value);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    getCredentials().then(res => {
      if (res) {
        setIsNew(false);
      } else setIsNew(true);
    });
  }, []);

  // Old Data
  const [data, setData] = useState({
    username: '',
    password: '',
    check_textInputChange: false,
    secureTextEntry: true,
    isValidUser: true,
    isValidPassword: true,
  });

  const usernameInputChange = val => {
    if (validateUsername(val?.trim())) {
      setData({
        ...data,
        username: val.replace('@', '')?.toLowerCase()?.trim(),
        check_textInputChange: true,
        isValidUser: true,
      });
    } else {
      setData({
        ...data,
        username: val.replace('@', '')?.toLowerCase()?.trim(),
        check_textInputChange: false,
        isValidUser: false,
      });
    }
  };

  const handlePasswordChange = val => {
    if (val?.trim().length >= 50) {
      setData({
        ...data,
        password: val?.trim(),
        isValidPassword: true,
      });
    } else {
      setData({
        ...data,
        password: val?.trim(),
        isValidPassword: false,
      });
    }
  };

  const updateSecureTextEntry = () => {
    setData({
      ...data,
      secureTextEntry: !data.secureTextEntry,
    });
  };

  const handleValidUser = val => {
    if (val?.trim().length >= 3 && val?.trim().length <= 16) {
      setData({
        ...data,
        isValidUser: true,
      });
    } else {
      setData({
        ...data,
        isValidUser: false,
      });
    }
  };

  const handleNewAccount = async (
    username: string,
    password: string,
    keyType: string,
  ) => {
    if (username === loginInfo.name) {
      storeCredentials(
        username,
        settings.pinEnabled
          ? Encrypt(encryptKey(password, Decrypt(AppGlobals.PIN_CODE)))
          : Encrypt(password),
        keyType,
      )
        .then(state => {
          if (state) {
            saveLoginInfo(dispatch, {...loginInfo});
            AppConstants.SHOW_TOAST(
              'Updated',
              `${loginInfo.name} private key updated.`,
              'success',
            );
            setLoading(false);
            navigation.pop();
          }
        })
        .catch(e => {
          onLoginFailed(e);
        });
    } else {
      const storeResult = await addNewCredential(username, password);
      if (storeResult) {
        const accountsKey = 'user-accounts';
        queryClient.invalidateQueries({queryKey: [accountsKey]});
        AppConstants.SHOW_TOAST(
          'Account added',
          `with ${keyType} key`,
          'success',
        );
        setLoading(false);
        navigation.pop();
      } else {
        AppConstants.SHOW_TOAST('Failed', 'Something went wrong', 'error');
        return;
      }
    }
  };

  const onLoginSuccess = (
    account: AccountExt,
    username: string,
    password: string,
    keyType: string,
  ) => {
    try {
      auth()
        .signInAnonymously()
        .then(async res => {
          const token = await getFcmToken();
          if (res) {
            firestore()
              .collection('Users')
              .doc(username)
              .set(
                {
                  name: username,
                  userId: res.user.uid,
                  timestamp: Date.now(),
                  fcmToken: token ?? '',
                  lastRead: firebase.firestore.FieldValue.serverTimestamp(),
                },
                {merge: true},
              )
              .then(() => {
                console.log('User updated!');
              })
              .catch(err => {
                console.log('Error', err);
              });
          }
        });
    } catch (e) {
      console.log('FirebaseAuth Error', String(e));
    }

    if (isNew) {
      storeCredentials(
        username,
        settings.pinEnabled
          ? Encrypt(encryptKey(password, Decrypt(AppGlobals.PIN_CODE)))
          : Encrypt(password),
        keyType,
      ).then(state => {
        if (state) {
          account.login = true;
          account.communities = [];
          const resp = setItemToStorage(
            AppStrings.CURRENT_USER_SCHEMA,
            account,
          );
          if (resp) {
            setData({
              username: '',
              password: '',
              check_textInputChange: false,
              secureTextEntry: true,
              isValidUser: true,
              isValidPassword: true,
            });

            dispatch(saveLoginHandler(account));

            queryClient.resetQueries();

            // delay for animation
            setLoading(false);
            AppConstants.SHOW_TOAST(
              'Login successfully',
              `with ${keyType} key`,
              'success',
            );

            // start notification listener service
            // invalidate all feed queries

            navigation.navigate(AppRoutes.DRAWER.HomeDrawer);
          } else {
            onLoginFailed('Something went wrong');
          }
        } else {
          onLoginFailed();
          return;
        }
      });
    } else {
      handleNewAccount(username, password, keyType);
    }
  };

  const onLoginFailed = (message?: string) => {
    // Invalid Key
    AppConstants.SHOW_TOAST(
      'Login failed',
      message ?? 'Invalid Private Key, try again',
      'error',
    );
    setLoading(false);
  };

  const _processLogin = async (usrName: string, usrPass: string) => {
    if (!validateUsername(usrName)) {
      onLoginFailed('Invalid username');
      return;
    }

    if (!data.isValidUser || !data.isValidPassword) {
      onLoginFailed('Invalid username or password');
      return;
    }

    // console.log('Login In Process')
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);

    setLoading(true);

    getAccountExt(usrName)
      .then(result => {
        if (!result) {
          //Account does not exist
          onLoginFailed('Invalid account');
          setLoading(false);
          return;
        }

        // Account Exist
        // Account Data

        const publicKeys = {
          pubPostingKey: result.posting_key_auths[0][0],
          pubActiveKey: result.active_key_auths[0][0],
          pubOwnerKey: result.owner_key_auths[0][0],
          pubMemoKey: result.memo_key,
        };

        // Check if the password is Master or not Master not start with '5'
        if (usrPass[0] !== '5') {
          // It is a Master extracting the active key
          const privPostingKey = PrivateKey.fromLogin(
            usrName,
            usrPass,
            'active',
          ).toString();

          const isvalid = wifIsValid(privPostingKey, publicKeys.pubActiveKey);

          if (isvalid) {
            // saving the extracted Active key
            usrPass = privPostingKey;
            onLoginSuccess(result, usrName, usrPass, KeyTypes.ACTIVE);
            return;
          } else {
            // Invalid Key
            onLoginFailed();
            return;
          }
        } else {
          // Not Master Key but maybe Others
          let isValid = false;
          // Check if posting key?
          isValid = wifIsValid(usrPass, publicKeys.pubPostingKey);

          if (isValid) {
            onLoginSuccess(result, usrName, usrPass, KeyTypes.POSTING);
            return;
          }
          // Check if active key?
          isValid = wifIsValid(usrPass, publicKeys.pubActiveKey);
          if (isValid) {
            onLoginSuccess(result, usrName, usrPass, KeyTypes.ACTIVE);
            return;
          }
          // Check if Owner key?
          isValid = wifIsValid(usrPass, publicKeys.pubOwnerKey);
          if (isValid) {
            onLoginSuccess(result, usrName, usrPass, KeyTypes.OWNER);
            return;
          }
          // Check if Memo key?
          isValid = wifIsValid(usrPass, publicKeys.pubMemoKey);
          if (isValid) {
            onLoginSuccess(result, usrName, usrPass, KeyTypes.MEMO);
            return;
          }
          // Invalid Key Login Error
          onLoginFailed();
          return;
        }
      })
      .catch(error => {
        onLoginFailed();
      });
  };

  const animationComponent = useMemo(() => {
    return (
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignContent: 'center',
            alignSelf: 'center',
          }}>
          <AnimatedLottieView
            style={styles.lottieStyle}
            loop
            autoPlay
            source={require('../../../../assets/anim/hello_login_anim.json')}
          />
        </View>
      </Animatable.View>
    );
  }, []);

  return (
    <MainWrapper>
      <ScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{}}
        style={styles.container}>
        <KeyboardAvoidingView>
          {animationComponent}
          <Card mode="contained" style={styles.footer}>
            <Card.Content>
              <View style={[styles.footer]}>
                <Animatable.View animation="fadeInUp">
                  <VStack spacing={20}>
                    {useMemo(() => {
                      return (
                        <TextInput
                          left={<TextInput.Icon disabled icon={'account'} />}
                          right={
                            <TextInput.Icon
                              disabled
                              icon={() => (
                                <Avatar.Image
                                  style={{backgroundColor: 'white'}}
                                  size={25}
                                  source={{
                                    uri:
                                      data.username == '' &&
                                      validateUsername(data.username)
                                        ? AppStrings.ERROR_404
                                        : `https://steemitimages.com/u/${data.username}/avatar/small`,
                                  }}
                                />
                              )}
                            />
                          }
                          value={data.username}
                          autoCorrect={false}
                          label="Steemit username"
                          placeholder="Enter your username"
                          style={[styles.textInput, {}]}
                          autoCapitalize="none"
                          onChangeText={val => usernameInputChange(val)}
                          onEndEditing={e =>
                            handleValidUser(e.nativeEvent.text)
                          }
                        />
                      );
                    }, [data])}

                    {useMemo(() => {
                      return data.isValidUser ? null : (
                        <Animatable.View animation="fadeInLeft" duration={500}>
                          <Text style={styles.errorMsg}>
                            Username must be 3-16 characters long.
                          </Text>
                        </Animatable.View>
                      );
                    }, [data.isValidUser])}

                    {useMemo(() => {
                      return (
                        <TextInput
                          left={<TextInput.Icon disabled icon={'lock'} />}
                          value={data.password}
                          autoCorrect={false}
                          placeholder="Enter your private key"
                          label="Private posting key"
                          placeholderTextColor={AppColors.DARK_GRAY}
                          secureTextEntry={data.secureTextEntry ? true : false}
                          style={[styles.textInput, {}]}
                          autoCapitalize="none"
                          inputMode="text"
                          onChangeText={val => handlePasswordChange(val)}
                          right={
                            <TextInput.Icon
                              onPress={updateSecureTextEntry}
                              icon={() => (
                                <>
                                  {data.secureTextEntry ? (
                                    <Animatable.View animation="bounceIn">
                                      <Feather
                                        name="eye-off"
                                        color={AppColors.DARK_GRAY}
                                        size={20}
                                      />
                                    </Animatable.View>
                                  ) : (
                                    <Feather
                                      name="eye"
                                      color={AppColors.DARK_GRAY}
                                      size={20}
                                    />
                                  )}
                                </>
                              )}
                            />
                          }
                        />
                      );
                    }, [data])}

                    {useMemo(() => {
                      return data.isValidPassword ? null : (
                        <Animatable.View animation="fadeInLeft" duration={500}>
                          <Text style={styles.errorMsg}>
                            Key must be 50 or more characters long.
                          </Text>
                        </Animatable.View>
                      );
                    }, [data.isValidPassword])}

                    {useMemo(() => {
                      return (
                        <HStack
                          style={styles.button}
                          spacing={10}
                          justify="center">
                          <Button
                            style={{flex: 0.8}}
                            disabled={loading}
                            mode="contained"
                            uppercase
                            loading={loading}
                            labelStyle={{fontSize: 12}}
                            onPress={() =>
                              _processLogin(data.username, data.password)
                            }>
                            {isNew ? 'Login' : 'Add Account'}
                          </Button>

                          <Button
                            style={{flex: 0.2}}
                            mode="elevated"
                            uppercase
                            labelStyle={{fontSize: 12, marginHorizontal: 0}}
                            onPress={() =>
                              Linking.openURL(AppConstants.STEEMIT_SIGNUP)
                            }>
                            {'Sign up'}
                          </Button>
                        </HStack>
                      );
                    }, [loading, data, isNew])}
                  </VStack>
                </Animatable.View>
              </View>
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>
      </ScrollView>
    </MainWrapper>
  );
};

export {LoginPage};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    flex: 0.2,
  },
  footer: {
    borderRadius: 20,
    margin: 4,
    flex: 0.8,
    zIndex: 1,
    height: '100%',
    marginHorizontal: 10,
  },
  text_header: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 30,
  },
  text_footer: {
    color: '#fff',
    fontSize: 18,
  },
  action: {
    // flexDirection: 'row',
    marginTop: 10,
    // borderBottomWidth: 1,
    // borderBottomColor: '#f2f2f2',
    // paddingBottom: 5,
  },
  actionError: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FF0000',
    paddingBottom: 5,
  },
  textInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    paddingLeft: 10,
  },
  errorMsg: {
    color: MD2Colors.pink300,
    fontSize: 14,
  },
  button: {
    color: 'white',
    alignItems: 'center',
    marginTop: 20,
  },
  signIn: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  textSign: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lottieStyle: {
    height: 200,
    width: 200,
  },
});
