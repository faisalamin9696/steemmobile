import React, {useEffect, useState, useCallback} from 'react';
import {FlatList, RefreshControl, View} from 'react-native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {AppConstants} from '../../constants/AppConstants';
import {LottieLinearLoading} from './LottieLinearLoading';
import {Text} from 'react-native-paper';
import {LottieLoading} from './LottieLoading';
import LottieError from './LottieError';
import {MakeQueryKey} from '../../utils/utils';
import CommentItem from '../comment';
import {useDispatch} from 'react-redux';
import {savePostHandler} from '../../redux/reducers/PostReducer';
import {useAppSelector} from '../../constants/AppFunctions';
import {useRefreshByUser} from '../../utils/useRefreshByUser';

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
const TabFlatList = (props: Props) => {
  const {route, fetchData, handleOnScroll, account} = props;
  const {feed_api, type} = route.params || {
    feed_api: '',
    type: '',
    account: undefined,
  };
  const [rows, setRows] = useState<Feed[]>();
  const queryClient = useQueryClient();
  const feedKey = MakeQueryKey(feed_api, type, account);
  const dispatch = useDispatch();
  const settings = useAppSelector(state => state.settingsReducer.value);
  const {
    refetch,
    isFetching,
    isLoading,
    data,
    error,
    isSuccess,
    isFetched,
    isError,
  } = useQuery({
    queryKey: [feedKey],
    retry: 3,
    retryDelay: 10000,
    enabled: fetchData !== undefined,
    queryFn: () => fetchData(account || 'null'),
    staleTime: account ? 5 * 60 * 1000 : undefined,
    gcTime: account ? 3 * 60 * 1000 : undefined,
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (isError) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    }
    if (isSuccess) {
      queryClient.setQueryData([feedKey], data?.slice(0, 7));
      setRows(data);
    }
  }, [isSuccess, isFetched, isError]);

  const loadMore = useCallback(
    async data => {
      let newStart = rows?.slice(data?.length ?? 0);
      const newRow = newStart?.slice(1, 7);
      return newRow;
    },
    [rows],
  );

  const mutation = useMutation({
    mutationFn: loadMore,
    onMutate: data => {
      queryClient.setQueryData([feedKey], (previousData: any) => [
        ...previousData,
        ...data!,
      ]);
    },
  });

  const handleEndReached = useCallback(async () => {
    if (!isFetching && data) {
      let newStart = rows?.slice(data?.length ?? 0);
      const newRow = newStart?.slice(0, 7);
      mutation.mutate(newRow);
    }
  }, [isFetching, data, rows, mutation]);

  const onScroll = e => {
    if (handleOnScroll) {
      handleOnScroll(e);
    }
  };

  const renderEmptyComponent = () =>
    !data && (
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

  const renderFooterComponent = () =>
    data && rows ? (
      data!.length >= rows!.length ? null : (
        <LottieLinearLoading loading={true} />
      )
    ) : null;

  const keyExtractor = (item, index) =>
    `${index}-${item.author}/${item.permlink}`;

  const renderItemSeparator = () => <View style={{marginTop: 5}} />;

  const renderCommentItem = ({item}) => (
    <CommentItem {...props} settings={settings} comment={item} />
  );

  if (isLoading) {
    return <LottieLoading loading={true} />;
  } else if (error) {
    return (
      <Text style={{alignSelf: 'center'}}>
        <LottieError
          error={error?.['message'] || ''}
          loading={error !== undefined}
          onTryAgain={onRetry}
        />
      </Text>
    );
  } else {
    return (
      <FlatList
        onScroll={onScroll}
        overScrollMode="never"
        onEndReached={handleEndReached}
        ListEmptyComponent={renderEmptyComponent}
        onEndReachedThreshold={0.5}
        keyExtractor={keyExtractor}
        ListFooterComponent={renderFooterComponent}
        data={rows}
        ItemSeparatorComponent={renderItemSeparator}
        contentContainerStyle={{paddingBottom: 80}}
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
  }
};

export default TabFlatList;
