import {FlatList, RefreshControl, View} from 'react-native';
import {Text} from 'react-native-paper';
import {getOutgoingDelegations} from '../../../steem/SteemApis';
import {useAppSelector} from '../../../constants/AppFunctions';
import {useQuery} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import Toast from 'react-native-toast-message';
import LottieError from '../../../components/basicComponents/LottieError';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import {OutgoingItem} from '..';
import {toastConfig} from '../../../utils/toastConfig';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

const OutgoingDelegations = ({navigation, route}) => {
  const {account} = route?.params;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const isSelf = account.name === loginInfo.name;
  const accountData: AccountExt = isSelf ? loginInfo : account;
  const steemGlobals = useAppSelector(state => state.steemGlobalReducer.value);
  const outgoingKey = `Delagation-${accountData.name}-Outgoing`;
  const {data, isLoading, error, refetch, isFetched} = useQuery({
    queryKey: [outgoingKey],
    queryFn: () => getOutgoingDelegations(accountData.name),
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  // confirm the transacion

  return (
    <View style={{flex: 1}}>
      {isLoading ? (
        <LottieLoading loading={true} />
      ) : error ? (
        <Text style={{alignSelf: 'center'}}>
          <LottieError
            error={error?.['message'] || ''}
            loading={error !== undefined}
            onTryAgain={refetch}
          />
        </Text>
      ) : (
        <FlatList
          contentContainerStyle={{paddingBottom: 40}}
          keyboardShouldPersistTaps="always"
          data={data}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
            />
          }
          ListEmptyComponent={() => (
            <LottieError
              buttonText="Refresh"
              loading
              onTryAgain={refetchByUser}
            />
          )}
          renderItem={({item, index}) => (
            <OutgoingItem
              navigation={navigation}
              item={item}
              index={index}
              loginInfo={loginInfo}
              steemGlobals={steemGlobals}
              account={account}
            />
          )}
          ItemSeparatorComponent={() => <View style={{margin: 4}} />}
        />
      )}

      <Toast position="top" topOffset={80} config={toastConfig} />
    </View>
  );
};

export {OutgoingDelegations};
