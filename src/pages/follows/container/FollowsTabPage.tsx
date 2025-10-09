import {HStack, VStack} from '@react-native-material/core';
import {FlatList, RefreshControl, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import React, {PureComponent, useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {getFollowers, getFollowings} from '../../../steem/SteemApis';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import LottieError from '../../../components/basicComponents/LottieError';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {parseUsername} from '../../../utils/user';
import {AppConstants} from '../../../constants/AppConstants';
import SearchBar from '../../../components/basicComponents/SearchBar';
import {abbreviateNumber} from '../../../utils/utils';
import { useRefreshByUser } from '../../../utils/useRefreshByUser';

class ListItem extends PureComponent<{navigation; item; index}> {
  render() {
    const {navigation, item, index} = this.props;
    return (
      <Card mode="contained">
        <Card.Content>
          <HStack spacing={6} items="center">
            <HStack>
              <BadgeAvatar navigation={navigation} name={item} />
            </HStack>
            <Text>{item}</Text>
          </HStack>
        </Card.Content>
      </Card>
    );
  }
}

let _onEndReachedCalledDuringMomentum = true;

const FollowsTabPage = ({navigation, route}) => {
  const {account, isFollowing, name} = route.params;
  const followKey = `${account}-${name}`;
  const [totalFollowers, setTotalFollowers] = useState(0);
  let [searchText, setSearchText] = useState('');
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<string[]>();

  useEffect(() => {
    navigation.setOptions({
      title: `${totalFollowers ? `${abbreviateNumber(totalFollowers)}` : ''} ${
        name ?? ''
      }`,
    });
  }, [name, navigation, totalFollowers]);

  const fetchData = async () => {
    let response;
    if (name === 'following') {
      response = getFollowings(account);
    } else {
      response = await getFollowers(account);
    }
    return response as string[];
  };

  const {
    refetch,
    isFetching,
    isLoading,
    data: followsData,
    error,
    isFetched,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: [followKey],
    queryFn: fetchData,
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (isSuccess) {
      const data = followsData.sort((a: string, b: string) =>
        a.localeCompare(b),
      );
      queryClient.setQueryData([followKey], data);
      setRows(data);
      setTotalFollowers(data?.length ?? 0);
    }
    if (isError) AppConstants.SHOW_TOAST('Failed', String(error), 'error');
  }, [isFetched, isSuccess, isError]);

  const filteredItems =
    followsData &&
    followsData.filter(
      item =>
        (item && item?.toLowerCase()?.includes(parseUsername(searchText))) ||
        (item && item?.toLowerCase()?.includes(parseUsername(searchText))),
    );

  const loadMore = async data => {
    let newStart = rows?.slice(data?.length ?? 0);
    const newRow = newStart?.slice(1, 15);
    return newRow;
  };

  const mutation = useMutation({
    mutationFn: loadMore,
    onMutate: data => {
      queryClient.setQueryData([followKey], (previousData: any) => [
        ...previousData,
        ...data!,
      ]);
    },
  });

  const handleEndReached = async () => {
    if (!isFetching && followsData) {
      _onEndReachedCalledDuringMomentum = true;
      let newStart = rows?.slice(followsData?.length ?? 0);
      const newRow = newStart?.slice(0, 15);
      mutation.mutate(newRow);
    }
  };

  return (
    <VStack fill style={{paddingHorizontal: 20}}>
      <VStack fill spacing={6} mt={8}>
        <View>
          <SearchBar
            placeholder="Search..."
            onChangeText={setSearchText}
            value={searchText}
          />
        </View>

        {/* <Text style={{ marginTop: 5 }}>Who should receive any rewards?</Text> */}
        {isLoading || !rows ? (
          <LottieLoading loading={true} />
        ) : error ? (
          <LottieError
            error={error?.['message']}
            loading={error !== undefined}
            onTryAgain={refetchByUser}
          />
        ) : (
          <>
            {filteredItems && (
              <FlatList
                overScrollMode="never"
                onEndReached={handleEndReached}
                onMomentumScrollBegin={() => {
                  _onEndReachedCalledDuringMomentum = false;
                }}
                data={filteredItems}
                onEndReachedThreshold={1}
                keyExtractor={(item, index) => `${index} - ${item}`}
                ItemSeparatorComponent={() => <View style={{marginTop: 5}} />}
                contentContainerStyle={{
                  paddingBottom: 40,
                  paddingHorizontal: 4,
                }}
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
                renderItem={({item, index}: any) => (
                  <ListItem navigation={navigation} item={item} index={index} />
                )}
                // ListFooterComponent={() => (followKey && rows &&
                //     followKey!.length >= rows!.length) ? null : <LottieLinearLoading loading={true} />}
                removeClippedSubviews
                maxToRenderPerBatch={15}
                initialNumToRender={15}
                scrollEventThrottle={16}
              />
            )}
          </>
        )}
      </VStack>
    </VStack>
  );
};

export {FollowsTabPage};
