import {useAppSelector} from '../../../constants/AppFunctions';
import {getAccountCommunities} from '../../../steem/SteemApis';
import {FlatList, RefreshControl, TouchableOpacity, View} from 'react-native';
import {PureComponent, useEffect, useState} from 'react';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import {Button, Card, Text} from 'react-native-paper';
import LottieError from '../../../components/basicComponents/LottieError';
import {HStack, VStack} from '@react-native-material/core';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {useQuery} from '@tanstack/react-query';
import {AppRoutes} from '../../../constants/AppRoutes';
import {AuthorTitleCard} from '../../../components/basicComponents/AuthorTitleCard';
import {AppConstants} from '../../../constants/AppConstants';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

interface Props {
  navigation: any;
  route: any;
}

const AccountCommunityTabPage = (props: Props) => {
  const {navigation, route} = props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const accountCommunityKey = `communities-${loginInfo.name}`;

  const fetchData = async () => {
    const response = await getAccountCommunities(
      loginInfo.name,
      loginInfo.name || 'null',
    );
    return response as Community[];
  };

  const {refetch, isLoading, data, error, isFetched, isError} = useQuery({
    queryKey: [accountCommunityKey],
    enabled: loginInfo.login === true && fetchData !== undefined,
    queryFn: fetchData,
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (isError) AppConstants.SHOW_TOAST('Failed', String(error), 'error');
  }, [isFetched, isError, error]);

  const handleNewPost = (item: Community) => {
    navigation.navigate(AppRoutes.PAGES.PostingStack, {
      screen: AppRoutes.PAGES.PostingPage,
      params: {community: item},
    });
  };

  const handleTagClick = (community: Community) => {
    const name = AppRoutes.PAGES.CommunityPage;
    navigation.push(name, {
      category: community.account,
      community: community.title,
    });
  };

  class CommunityItem extends PureComponent<{item: Community; index: number}> {
    render() {
      const {item, index} = this.props;

      return (
        <TouchableOpacity
          onPress={() => {
            handleTagClick(item);
          }}>
          <Card mode="contained">
            <Card.Content style={{paddingVertical: 6, paddingHorizontal: 6}}>
              <HStack items="center" spacing={10}>
                <View>
                  <BadgeAvatar
                    name={item.account}
                    reputation={item.account_reputation}
                  />
                </View>
                <VStack>
                  <HStack spacing={8} items="center">
                    <Text>{item.title}</Text>
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
                  <HStack spacing={8}>
                    {<Text>{item.account}</Text>}
                    <AuthorTitleCard title={item.observer_title} />
                  </HStack>
                </VStack>
                <Button
                  uppercase
                  onPress={() => handleNewPost(item)}
                  mode="elevated"
                  style={{position: 'absolute', right: 0}}
                  labelStyle={{
                    marginVertical: 0,
                    fontSize: 10,
                    marginHorizontal: 5,
                  }}>
                  New Post
                </Button>
              </HStack>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      );
    }
  }
  return isLoading ? (
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
    <FlatList
      overScrollMode="never"
      data={data}
      onEndReachedThreshold={1}
      keyExtractor={(item, index) => `${index}-${item.account}/${item.title}`}
      ItemSeparatorComponent={() => <View style={{marginTop: 5}} />}
      contentContainerStyle={{paddingBottom: 40, paddingHorizontal: 4}}
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
          onTryAgain={() => {
            refetchByUser();
          }}
        />
      )}
      renderItem={({item, index}: any) => (
        <CommunityItem item={item} index={index} />
      )}
      removeClippedSubviews
      maxToRenderPerBatch={15}
      initialNumToRender={15}
      scrollEventThrottle={16}
    />
  );
};

export {AccountCommunityTabPage};
