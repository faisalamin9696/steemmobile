import {HStack, VStack} from '@react-native-material/core';
import {PureComponent, useEffect, useState} from 'react';
import {FlatList, RefreshControl, TouchableOpacity, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {AuthorTitleCard} from '../../../components/basicComponents/AuthorTitleCard';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {getRankedCommunities} from '../../../steem/SteemApis';
import {useAppSelector} from '../../../constants/AppFunctions';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import LottieError from '../../../components/basicComponents/LottieError';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import {abbreviateNumber} from '../../../utils/utils';
import {LottieLinearLoading} from '../../../components/basicComponents/LottieLinearLoading';
import {AppRoutes} from '../../../constants/AppRoutes';
import {parseUsername} from '../../../utils/user';
import TimeAgoWrapper from '../../../components/wrappers/TimeAgoWrapper';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {AppConstants} from '../../../constants/AppConstants';
import SearchBar from '../../../components/basicComponents/SearchBar';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

let _onEndReachedCalledDuringMomentum = true;

class CommunityItem extends PureComponent<{
  navigation: any;
  item: Community;
  index: number;
}> {
  render() {
    const {navigation, item, index} = this.props;

    const handleCommunityClick = (community: Community) => {
      const name = AppRoutes.PAGES.CommunityPage;
      navigation.push(name, {
        category: community.account,
        community: community.title,
      });
    };

    return (
      <TouchableOpacity
        onPress={() => {
          handleCommunityClick(item);
        }}>
        <Card mode="contained">
          <Card.Content style={{paddingVertical: 6, paddingHorizontal: 6}}>
            <VStack spacing={6}>
              <HStack items="center" spacing={10}>
                <View>
                  <BadgeAvatar
                    navigation={navigation}
                    name={item.account}
                    reputation={item.account_reputation}
                  />
                </View>
                <VStack spacing={4}>
                  <HStack items="center" spacing={4}>
                    <Text>{item.title || item.account} </Text>
                    <Text
                      style={{
                        fontSize: 8,
                        textTransform: 'uppercase',
                        opacity: 0.75,
                      }}
                      variant={'labelSmall'}>
                      {item.observer_role || 'guest'}
                    </Text>
                  </HStack>
                  <HStack items="center" spacing={4}>
                    <Text>Created •</Text>
                    <View>
                      <TimeAgoWrapper date={item.created * 1000} />
                    </View>
                    <View>
                      <AuthorTitleCard title={item.observer_title} />
                    </View>
                  </HStack>
                </VStack>
              </HStack>
              <VStack spacing={6}>
                <VStack style={{flex: 1}}>
                  <Text lineBreakMode="clip" numberOfLines={3}>
                    {item.about}
                  </Text>
                </VStack>
                <Card style={{alignSelf: 'flex-start'}}>
                  <Card.Content
                    style={{paddingHorizontal: 6, paddingVertical: 2}}>
                    <Text>
                      {abbreviateNumber(item.count_subs)} Subscribers •{' '}
                      {item.count_authors} Posters •{' '}
                      {abbreviateNumber(item.count_pending)} Posts
                    </Text>
                  </Card.Content>
                </Card>
              </VStack>
              {/* <Button uppercase onPress={() => handleNewPost(item)}
                            mode="elevated"
                            style={{ position: 'absolute', right: 0 }}
                            labelStyle={{ marginVertical: 0, fontSize: 10, marginHorizontal: 5 }}>New Post</Button> */}

              <View style={{position: 'absolute', right: 0, top: 0, bottom: 0}}>
                <AuthorTitleCard
                  cardStyle={{paddingHorizontal: 10}}
                  title={`🥇 • ${item.rank}`}
                />
              </View>
            </VStack>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }
}

const ExploreCommunities = ({navigation, route}) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const exploreCommunityKey = `communities-explored`;
  const [rows, setRows] = useState<Community[]>();
  const queryClient = useQueryClient();
  let [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    const response = await getRankedCommunities(loginInfo.name || 'null');
    return response as Community[];
  };

  const {refetch, isFetching, isLoading, data, error, isFetched, isError} =
    useQuery({
      queryKey: [exploreCommunityKey],
      queryFn: fetchData,
    });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (isError) AppConstants.SHOW_TOAST('Failed', String(error), 'error');
  }, [isFetched, isError, error]);

  const filteredItems =
    data &&
    data.filter(
      item =>
        (item.title &&
          item.title?.toLowerCase()?.includes(parseUsername(searchText))) ||
        (item.account &&
          item.account?.toLowerCase()?.includes(parseUsername(searchText))),
    );

  const loadMore = async data => {
    let newStart = rows?.slice(data?.length ?? 0);
    const newRow = newStart?.slice(1, 15);
    return newRow;
  };

  const mutation = useMutation({
    mutationFn: loadMore,
    onMutate: data => {
      queryClient.setQueryData([exploreCommunityKey], (previousData: any) => [
        ...previousData,
        ...data!,
      ]);
    },
  });

  const handleEndReached = async () => {
    if (!isFetching && data) {
      _onEndReachedCalledDuringMomentum = true;
      let newStart = rows?.slice(data?.length ?? 0);
      const newRow = newStart?.slice(0, 15);
      mutation.mutate(newRow);
    }
  };

  return (
    <MainWrapper>
      <VStack fill ph={4}>
        {isLoading ? (
          <LottieLoading loading={isLoading} />
        ) : error ? (
          <Text style={{alignSelf: 'center'}}>
            <LottieError
              error={error?.['message'] || ''}
              loading={error !== undefined}
              onTryAgain={refetch}
            />
          </Text>
        ) : (
          <VStack spacing={4} mt={4}>
            <View>
              <SearchBar
                placeholder="Search community..."
                onChangeText={setSearchText}
                value={searchText}
              />
            </View>
            {filteredItems && (
              <FlatList
                overScrollMode="never"
                onEndReached={handleEndReached}
                onMomentumScrollBegin={() => {
                  _onEndReachedCalledDuringMomentum = false;
                }}
                data={filteredItems}
                onEndReachedThreshold={1}
                keyExtractor={(item, index) =>
                  `${index}-${item.account}/${item.id}`
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
                renderItem={({item, index}: any) => (
                  <CommunityItem
                    navigation={navigation}
                    item={item}
                    index={index}
                  />
                )}
                ListFooterComponent={() =>
                  data && rows && data!.length >= rows!.length ? null : (
                    <LottieLinearLoading loading={true} />
                  )
                }
                removeClippedSubviews
                maxToRenderPerBatch={15}
                initialNumToRender={15}
                scrollEventThrottle={16}
              />
            )}
          </VStack>
        )}
      </VStack>
    </MainWrapper>
  );
};

export {ExploreCommunities};
