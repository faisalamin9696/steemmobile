import {VStack} from '@react-native-material/core';
import {useQuery} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {FlatList, RefreshControl, View} from 'react-native';
import {getAccountHistory} from '../../../steem/SteemApis';
import LottieError from '../../../components/basicComponents/LottieError';
import {TransferHistoryItem} from '..';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import {Text} from 'react-native-paper';
import {useAppSelector} from '../../../constants/AppFunctions';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

const TransferHistoryPage = ({route}) => {
  const {data, isAccount} = route.params ?? {};
  const loginInfo = useAppSelector(state => state.loginReducer.value);

  const name = isAccount ? loginInfo.name : data.name;

  const historyKey = `TransferHistory-${name}`;

  const {
    data: historyData,
    refetch,
    isLoading,
    error,
    isFetched,
  } = useQuery({
    queryKey: [historyKey],
    queryFn: () => getAccountHistory(name),
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  return (
    <VStack fill>
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
          data={historyData}
          renderItem={({item, index}) => (
            <TransferHistoryItem key={index} op={item} context={data.name} />
          )}
          overScrollMode="never"
          onEndReachedThreshold={1}
          keyExtractor={(item, index) =>
            `${index}-${item.trans_index}-${item.time}`
          }
          ItemSeparatorComponent={() => <View style={{marginTop: 5}} />}
          contentContainerStyle={{paddingBottom: 40}}
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
          removeClippedSubviews
          maxToRenderPerBatch={15}
          initialNumToRender={15}
          scrollEventThrottle={16}
        />
      )}
    </VStack>
  );
};

export {TransferHistoryPage};
