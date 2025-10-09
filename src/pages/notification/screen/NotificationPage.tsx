import React, {useEffect, useState} from 'react';
import {Button, MD2Colors} from 'react-native-paper';
import {FlatList, LayoutAnimation, RefreshControl} from 'react-native';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {markSteemNotifications} from '../../../steem/CondenserApis';
import {HStack, VStack} from '@react-native-material/core';
import {useAppSelector} from '../../../constants/AppFunctions';
import {ScrollingTabHandler} from '../../../components/ScrollingTabHandler';
import {useSharedValue} from 'react-native-reanimated';
import {getCredentials} from '../../../utils/realm';
import {AppConstants} from '../../../constants/AppConstants';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import LoginButton from '../../../components/basicComponents/LoginButton';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import LottieError from '../../../components/basicComponents/LottieError';
import {AppRoutes} from '../../../constants/AppRoutes';
import {isAccountCommunity} from '../../../utils/CommunityValidation';
import {empty_comment} from '../../../utils/placeholders';
import RoundSegmentedButtons from '../../../components/segmented/RoundSegmentedButtons';
import {getNotifications} from '../../../steem/SteemApis';
import NotificationItem from '../container/NotificationItem';
import {getAppVersionString} from '../../../utils/utils';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

interface Props {
  navigation: any;
  route: any;
}

const NotificationPage = (props: Props) => {
  const {navigation, route} = props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const lastContentOffset = useSharedValue(0);
  const parent = navigation?.getParent();
  const [marking, setMarking] = useState(false);
  const notificationKey = `notifications-${loginInfo.name ?? ''}`;
  const notificationKeyBottomTab = `notifications-${
    loginInfo.name ?? ''
  }-bottomTab-${getAppVersionString()}`;
  const [unread, setUnread] = useState(0);

  const queryClient = useQueryClient();
  const [segmentValue, setSegmentValue] = useState('');
  const [rows, setRows] = useState<Notification[]>();
  const steemGlobals = useAppSelector(state => state.steemGlobalReducer.value);

  const {
    data: notificationData,
    error,
    refetch,
    status,
    isFetched,
    isSuccess,
  } = useQuery({
    enabled: !!loginInfo.name,
    queryKey: [notificationKey],
    retry: 3,
    retryDelay: 10000,
    queryFn: () =>
      getNotifications(
        loginInfo.name,
        loginInfo.notification ?? AppConstants.DEFAULT_NOTIFICATION_SETTINGS,
      ),
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (status === 'success') {
      if (notificationData) {
        const oldData = queryClient.getQueryData([notificationKeyBottomTab]);
        queryClient.setQueryData(
          [notificationKeyBottomTab],
          (countUnread(notificationData) < 50
            ? countUnread(notificationData)
            : oldData) ?? countUnread(notificationData),
        );

        setUnread(countUnread(notificationData));
        sortNotificationsBy(notificationData, segmentValue);
      }
    }
  }, [status]);

  const handleScroll = event => {
    ScrollingTabHandler(lastContentOffset, parent, event);
  };

  const sortNotificationsBy = (data: Notification[], sortBy: string) => {
    const filtered = data?.filter(item => item.type.includes(sortBy));
    setRows(filtered);
    return filtered;
  };

  const countUnread = (data: Notification[]): number => {
    return data?.filter(item => item.is_read === 0).length || 0;
  };

  const markList = async () => {
    if (notificationData) {
      await Promise.all(notificationData.map(item => (item.is_read = 1)));
      return notificationData;
    }
  };

  const mutation = useMutation({
    mutationKey: [`${notificationKey}-offset-${loginInfo.name ?? ''}`],
    gcTime: 0,
    mutationFn: markList,
    onSuccess(data) {
      if (data) {
        sortNotificationsBy(data, segmentValue);
        queryClient.setQueryData([notificationKeyBottomTab], 0);
        queryClient.setQueryData([notificationKey], data);
      }
      AppConstants.SHOW_TOAST('Marked as read', '', 'success');
      setUnread(0);
    },
    onSettled(data, error) {
      setMarking(false);
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  useEffect(() => {
    if (notificationData) sortNotificationsBy(notificationData, segmentValue);
  }, [segmentValue, notificationData]);

  const loadMoreMutation = useMutation({
    mutationFn: (offset: number) =>
      getNotifications(
        loginInfo.name,
        loginInfo.notification ?? AppConstants.DEFAULT_NOTIFICATION_SETTINGS,
        offset,
      ),
    onSuccess: data => {
      queryClient.setQueryData(
        [notificationKey],
        [...notificationData!, ...data!],
      );
      sortNotificationsBy([...notificationData!, ...data!], segmentValue);
    },
  });

  const handleEndReached = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (status !== 'pending' && notificationData) {
      if (loginInfo?.login) {
        const offset = notificationData?.length;
        loadMoreMutation.mutate(offset);
      }
    }
  };

  const handleMarkPress = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setMarking(true);
    const credentials = await getCredentials();
    if (!credentials) setMarking(false);
    if (credentials) {
      markSteemNotifications(loginInfo, credentials.password)
        .then(res => {
          if (res) {
            mutation.mutate();
          }
        })
        .catch(err => {
          AppConstants.SHOW_TOAST('Failed', String(err), 'error');

          setMarking(false);
        });
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const handleItemClick = (item: Notification) => {
    switch (item.type) {
      case 'new_community':
      case 'set_role':
      case 'set_props':
      case 'set_label':
      case 'subscribe':
      case 'follow':
      case 'reply':
      // Handle other cases...
      default:
        if (!item.permlink) {
          navigation.push(AppRoutes.PAGES.ProfilePage, {account: item.account});
        } else {
          const is_community = isAccountCommunity(item.permlink);
          if (is_community) {
            const KEY = `${item.author}/${item.account}`;
            navigation.push(AppRoutes.PAGES.CommunityPage, {
              category: item.account,
              FILTER: undefined,
              KEY,
            });
          } else {
            navigation.push(AppRoutes.PAGES.CommentDetailPage, {
              type: 'comment',
              comment: empty_comment(item.author, item.permlink),
              feed_api: 'getPostWithReplies',
            });
          }
        }
        break;
    }
  };

  return (
    <MainWrapper>
      {!loginInfo.login ? (
        <LoginButton navigation={navigation} />
      ) : (
        <VStack fill ph={4}>
          {status === 'pending' ? (
            <LottieLoading loading={true} />
          ) : error ? (
            <LottieError
              error={error?.['message'] || ''}
              loading={true}
              onTryAgain={refetchByUser}
            />
          ) : (
            notificationData && (
              <>
                {unread >= 1 && (
                  <HStack center spacing={4}>
                    <Button
                      labelStyle={{fontSize: 14, marginVertical: 2}}
                      disabled={marking}
                      loading={marking}
                      compact
                      style={{alignSelf: 'center', margin: 5}}
                      onPress={handleMarkPress}>
                      Mark all as read
                    </Button>
                  </HStack>
                )}
                <RoundSegmentedButtons
                  density="high"
                  value={segmentValue}
                  onValueChange={setSegmentValue}
                  style={{
                    borderColor: MD2Colors.red400,
                    paddingHorizontal: 10,
                    marginTop: 8,
                  }}
                  buttons={[
                    {value: '', label: 'ALL', style: {borderWidth: 0.2}},
                    {
                      value: 'reply',
                      label: 'REPLIES',
                      style: {borderWidth: 0.2},
                    },
                    {
                      value: 'mention',
                      label: 'MENTIONS',
                      style: {borderWidth: 0.2},
                    },
                  ]}
                />

                <FlatList
                  style={{marginTop: 8}}
                  ListEmptyComponent={() => (
                    <LottieError
                      buttonText="Refresh"
                      loading
                      onTryAgain={refetchByUser}
                    />
                  )}
                  keyExtractor={(item, index) =>
                    `${index}-${item.id}/${item.time}`
                  }
                  contentContainerStyle={{paddingBottom: 80}}
                  onScroll={handleScroll}
                  data={rows}
                  ListFooterComponent={() =>
                    rows && rows.length > 0 ? (
                      <Button
                        loading={loadMoreMutation.isPending}
                        disabled={loadMoreMutation.isPending}
                        mode="contained"
                        style={{
                          alignSelf: 'center',
                          marginVertical: 4,
                        }}
                        labelStyle={{marginVertical: 4, fontSize: 12}}
                        compact
                        onPress={handleEndReached}>
                        Load More
                      </Button>
                    ) : null
                  }
                  renderItem={({item, index}) => (
                    <NotificationItem
                      item={item}
                      index={index}
                      steemprops={steemGlobals}
                      handleItemClick={handleItemClick}
                      navigation={navigation}
                    />
                  )}
                  onEndReachedThreshold={1}
                  overScrollMode="never"
                  removeClippedSubviews
                  maxToRenderPerBatch={7}
                  initialNumToRender={7}
                  scrollEventThrottle={16}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefetchingByUser}
                      onRefresh={refetchByUser}
                    />
                  }
                />
              </>
            )
          )}
        </VStack>
      )}
    </MainWrapper>
  );
};

export {NotificationPage};
