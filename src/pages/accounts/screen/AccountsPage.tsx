import {HStack, VStack} from '@react-native-material/core';
import {getAllCredentials, getCredentials} from '../../../utils/realm';
import {Badge, Button, Card, Text} from 'react-native-paper';
import {AppRoutes} from '../../../constants/AppRoutes';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {FlatList, RefreshControl, View} from 'react-native';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import ModalHeader from '../../../components/basicComponents/ModalHeader';
import {AppConstants} from '../../../constants/AppConstants';
import {useAppSelector} from '../../../constants/AppFunctions';
import {AppColors} from '../../../constants/AppColors';
import {saveLoginInfo} from '../../../utils/handlers';
import {useDispatch} from 'react-redux';
import {AccountItem} from '../container/AccountItem';
import {getKeyType} from '../../../steem/CondenserApis';
import {useEffect, useLayoutEffect, useState} from 'react';
import {SharedWebCredentials} from 'react-native-keychain';
import {savePostHandler} from '../../../redux/reducers/PostReducer';
import {saveCommentHandler} from '../../../redux/reducers/CommentReducer';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

const AccountsPage = ({navigation}) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const dispatch = useDispatch();
  const accountsKey = 'user-accounts';
  const queryClient = useQueryClient();
  const [keyData, setKeyData] = useState<any>('');
  const [accounts, setAccounts] = useState<false | SharedWebCredentials>();
  const [loading, setLoading] = useState(true);

  // wait and load the accounts
  useLayoutEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const settings = useAppSelector(state => state.settingsReducer.value);

  const handleOnSwitched = async (data: AccountExt) => {
    saveLoginInfo(dispatch, data);
    queryClient.resetQueries();
    dispatch(savePostHandler(undefined));
    dispatch(saveCommentHandler(undefined));
    AppConstants.SHOW_TOAST('Account switched', '', 'success');
    navigation.pop();
  };

  const handleOnRemoved = (name: string) => {
    if (accounts) {
      setAccounts({
        ...accounts,
        password: JSON.stringify(
          JSON.parse(accounts.password)?.filter(
            item => Object.keys(item)[0] !== name,
          ),
        ),
      });
    }
    AppConstants.SHOW_TOAST('Removed', '', 'success');
  };

  const handleOnAdd = () => {
    if (loginInfo.login && !settings.pinEnabled) {
      AppConstants.SHOW_TOAST(
        'Weak security',
        'Set a PIN code to continue',
        'info',
      );
      return;
    }
    navigation.navigate(AppRoutes.PAGES.LoginPage);
  };
  const {
    refetch,
    isSuccess,
    data: queryData,
    isFetched,
  } = useQuery({
    enabled: !loading,
    queryKey: [accountsKey],
    queryFn: getAllCredentials,
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);
  useEffect(() => {
    if (isSuccess) setAccounts(queryData);
  }, [isSuccess, isFetched, queryData]);

  useEffect(() => {
    getCredentials().then(credentials => {
      if (credentials) {
        const kData = getKeyType(loginInfo, credentials.password);
        setKeyData(kData);
      }
    });
  }, [loginInfo, isRefetchingByUser]);

  const defaultItem = () => {
    return (
      <Card mode="contained">
        <Card.Content style={{paddingVertical: 6, paddingHorizontal: 6}}>
          <HStack items="center" spacing={10}>
            <View>
              <BadgeAvatar name={loginInfo.name} />
            </View>
            <HStack fill items="center" spacing={4}>
              <Text>{loginInfo.name}</Text>
              {keyData ? <Badge>{keyData?.type.substring(0, 1)}</Badge> : null}
            </HStack>

            <HStack spacing={10} pe={6} items="center">
              <Button
                mode="elevated"
                compact
                labelStyle={{marginHorizontal: 8, marginVertical: 2}}>
                Default
              </Button>
            </HStack>
          </HStack>
        </Card.Content>
      </Card>
    );
  };

  return (
    <MainWrapper>
      <VStack fill style={{paddingHorizontal: 20, paddingTop: 20}}>
        <ModalHeader
          title="Accounts"
          onClose={() => {
            navigation.pop();
          }}
        />

        <VStack
          fill
          spacing={6}
          mt={10}
          pb={20}
          style={{justifyContent: 'space-between'}}>
          <View>
            {defaultItem()}

            <View
              style={{
                backgroundColor: AppColors.LIGHT_GRAY,
                height: 1,
                width: '90%',
                alignSelf: 'center',
                opacity: 0.8,
                marginVertical: 4,
              }}
            />
          </View>

          {loading ? (
            <VStack fill items="center">
              <LottieLoading loading={loading} />
            </VStack>
          ) : (
            accounts &&
            accounts.password && (
              <FlatList
                data={
                  JSON.parse(accounts?.password)?.filter(
                    item => Object.keys(item)[0] !== loginInfo.name,
                  ) ?? []
                }
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetchingByUser || loading}
                    onRefresh={refetchByUser}
                  />
                }
                renderItem={({item}) => (
                  <AccountItem
                    item={item}
                    navigation={navigation}
                    onRemoved={handleOnRemoved}
                    onSwitchSuccess={handleOnSwitched}
                  />
                )}
              />
            )
          )}

          <Button
            style={{alignSelf: 'center'}}
            mode="contained"
            onPress={handleOnAdd}>
            Add Account
          </Button>
        </VStack>
      </VStack>
    </MainWrapper>
  );
};

export {AccountsPage};
