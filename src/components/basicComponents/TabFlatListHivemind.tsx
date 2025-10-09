import React, { useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AppConstants } from '../../constants/AppConstants';
import { Text } from 'react-native-paper';
import { LottieLoading } from './LottieLoading';
import LottieError from './LottieError';
import { MakeQueryKey } from '../../utils/utils';
import CommentItem from '../comment';
import { useDispatch } from 'react-redux';
import { savePostHandler } from '../../redux/reducers/PostReducer';
import { useAppSelector } from '../../constants/AppFunctions';
import { useRefreshByUser } from '../../utils/useRefreshByUser';
import { getActiveFeed } from '../../steem/steem';
import { CommentItemHivemind } from '../comment/CommentItemHIvemind';

interface Props {
  navigation: any;
  route: any;
  parentNav?: any;
  fetchData: (observer?: string) => Promise<Feed[]>;
  isBlog?: boolean;
  isCommunity?: boolean;
  handleOnScroll?: (e: any) => void;
  account?: string;
}
const TabFlatListHivemind = (props: Props) => {
  const { route, account } = props;
  const { feed_api, type } = route.params || {
    feed_api: '',
    type: '',
    account: undefined,
  };
  const feedKey = MakeQueryKey(feed_api, type, account);
  const dispatch = useDispatch();
  const settings = useAppSelector(state => state.settingsReducer.value);

  const { fetchNextPage, isPending, error, status, data, refetch } =
    useInfiniteQuery({
      queryKey: [feedKey],
      queryFn: ({ pageParam }) =>
        getActiveFeed(
          'trending',
          account,
          pageParam.start_author,
          pageParam.start_permlink,
        ),
      initialPageParam: {
        start_author: '',
        start_permlink: '',
      },
      getNextPageParam: (lastPage, allPages) => {
        const lastPost = lastPage[lastPage?.length - 1];
        return {
          start_author: lastPost.author,
          start_permlink: lastPost.permlink,
        };
      },
    });
  // const {
  //   refetch,
  //   isFetching,
  //   isLoading,
  //   data,
  //   error,
  //   isSuccess,
  //   isFetched,
  //   isError,
  // } = useQuery({
  //   queryKey: [feedKey],
  //   retry: 3,
  //   retryDelay: 10000,
  //   enabled: fetchData !== undefined,
  //   queryFn: () => fetchData(account || 'null'),
  //   staleTime: account ? 5 * 60 * 1000 : undefined,
  //   gcTime: account ? 3 * 60 * 1000 : undefined,
  // });

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch);

  useEffect(() => {
    if (error) {
      AppConstants.SHOW_TOAST('Failed', error?.message, 'error');
    }
  }, [error]);


  const renderEmptyComponent = () =>
    !data?.pages && (
      <LottieError
        buttonText="Refresh"
        loading
        onTryAgain={() => {
          refetchByUser();
        }}
      />
    );

  const onRetry = useCallback(() => {
    dispatch(savePostHandler(undefined));
    refetch();
  }, [dispatch, refetch]);



  const renderItemSeparator = () => <View style={{ marginTop: 5 }} />;

  const renderCommentItem = ({ item }) => (
    <CommentItemHivemind {...props} settings={settings} comment={item} />
  );

  if (isPending) {
    return <LottieLoading loading={true} />;
  } else if (error) {
    return (
      <Text style={{ alignSelf: 'center' }}>
        <LottieError
          error={error?.['message'] || ''}
          loading={error !== undefined}
          onTryAgain={onRetry}
        />
      </Text>
    );
  } else {

  }

  return (
    <FlatList
      onScroll={props.handleOnScroll}
      overScrollMode="never"
      onEndReached={() => { fetchNextPage(); }}
      ListEmptyComponent={renderEmptyComponent}
      onEndReachedThreshold={0.5}
      data={data?.pages?.flat() || []}
      ItemSeparatorComponent={renderItemSeparator}
      contentContainerStyle={{ paddingBottom: 80 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingByUser}
          onRefresh={refetchByUser}
        />
      }
      renderItem={renderCommentItem}
      removeClippedSubviews={true}
      scrollEventThrottle={16}
      initialNumToRender={7}
      maxToRenderPerBatch={7}
      maintainVisibleContentPosition={{
        autoscrollToTopThreshold: 16,
        minIndexForVisible: 5,
      }}
    />
  );
};

export default TabFlatListHivemind;
