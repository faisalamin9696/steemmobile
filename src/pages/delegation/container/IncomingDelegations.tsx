import {FlatList, RefreshControl, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {HStack, VStack} from '@react-native-material/core';
import {useQuery} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {getIncomingDelegations} from '../../../steem/SteemApis';
import {useAppSelector} from '../../../constants/AppFunctions';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import TimeAgoWrapper from '../../../components/wrappers/TimeAgoWrapper';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import LottieError from '../../../components/basicComponents/LottieError';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

interface DelegationProps {
  item: Delegation;
  index: number;
}

const IncomingDelegations = ({navigation, route}) => {
  const {account} = route?.params;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const accountData: AccountExt =
    account.name === loginInfo.name ? loginInfo : account;

  const steemGlobals = useAppSelector(state => state.steemGlobalReducer.value);

  const {data, isLoading, error, refetch, isFetched} = useQuery({
    queryKey: [`Delagation-${accountData.name}-Incoming`],
    queryFn: () => getIncomingDelegations(accountData.name),
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  const ListItem = (props: DelegationProps) => {
    const {item, index} = props;
    return (
      <Card mode="contained">
        <Card.Content style={{paddingHorizontal: 6, paddingVertical: 6}}>
          <HStack spacing={10} items="center">
            <View>
              <BadgeAvatar navigation={navigation} name={item.from} />
            </View>
            <VStack>
              <HStack items="center" spacing={10}>
                <Text variant="labelLarge">{item.from}</Text>
                <View>
                  <TimeAgoWrapper date={item.time * 1000} />
                </View>
              </HStack>
              <Text variant="labelSmall">
                {(item.vests * steemGlobals.steem_per_share)?.toFixed(3)} SP
              </Text>
            </VStack>
          </HStack>
        </Card.Content>
      </Card>
    );
  };

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
      ) : data ? (
        <FlatList
          contentContainerStyle={{paddingBottom: 40}}
          data={data}
          renderItem={({item, index}) => <ListItem item={item} index={index} />}
          ItemSeparatorComponent={() => <View style={{margin: 4}} />}
          ListEmptyComponent={() => (
            <LottieError
              buttonText="Refresh"
              loading
              onTryAgain={refetchByUser}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
            />
          }
        />
      ) : null}
    </View>
  );
};

export {IncomingDelegations};
