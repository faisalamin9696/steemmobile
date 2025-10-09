import {HStack, VStack} from '@react-native-material/core';
import React, {PureComponent, useEffect, useState} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {Button, Card, MD2Colors, Text, Tooltip} from 'react-native-paper';
import {AppColors} from '../../../constants/AppColors';
import {useAppSelector} from '../../../constants/AppFunctions';
import {getAccountExt, getCommunity} from '../../../steem/SteemApis';
import {parseAccountMeta} from '../../../utils/user';
import {useMutation, useQueries, useQueryClient} from '@tanstack/react-query';
import {AppRoutes} from '../../../constants/AppRoutes';
import {empty_community} from '../../../utils/placeholders';
import {MakeQueryKey, abbreviateNumber} from '../../../utils/utils';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {getCredentials} from '../../../utils/realm';
import {AppConstants} from '../../../constants/AppConstants';
import {subscribeCommunity} from '../../../steem/CondenserApis';
import ViewBar from '../../../components/basicComponents/ViewBar';
import ExpandableView from '../../../components/basicComponents/ExpandableView';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {Icons} from '../../../components/Icons';
import {proxifyImageSrc} from '../../../utils/e-render/src';

interface Props {
  navigation?: any;
  route: any;
  containerStyle?: ViewStyle;
}
const cardHeight = 160;

const CommunityHeader = (props: Props) => {
  const {navigation, route, containerStyle} = props;
  const {feed_api, type, category, community} = route?.params;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const communityKey = MakeQueryKey(feed_api, type, category);
  const accountKey = `userData-${category}`;
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);

  const queries = [
    {
      queryKey: [communityKey],
      queryFn: () => getCommunity(category, loginInfo.name || 'null'),
      staleTime: Infinity,
    },
    {
      queryKey: [accountKey],
      queryFn: () => getAccountExt(category, loginInfo.name || 'null'),
      staleTime: Infinity,
    },
  ];
  const queryResults = useQueries({queries});

  // Access the data and loading state for each query
  const communityData =
    (queryResults[0].data as Community) || empty_community(category, community);
  const accountData = queryResults[1].data as AccountExt;
  const accountCommunityKey = `communities-${loginInfo.name}`;

  const parsed = parseAccountMeta(accountData?.posting_json_metadata ?? '{}');


  const subMutation = useMutation({
    mutationFn: (credentials: any) =>
      subscribeCommunity(loginInfo, credentials.password, {
        communityId: communityData?.account,
        subscribe: true,
      }),
    onSuccess(data, variables, context) {
      AppConstants.SHOW_TOAST('Subscribed', '', 'success');
    },
    onMutate(variables) {
      const oldData: Community | undefined = queryClient.getQueryData([
        communityKey,
      ]);
      queryClient.setQueryData([communityKey], {
        ...oldData,
        observer_subscribed: 1,
      });
      const oldFeed = queryClient.getQueryData<Community[]>([
        accountCommunityKey,
      ]);
      if (oldFeed)
        queryClient.setQueryData([accountCommunityKey], {
          ...oldData,
          observer_subscribed: 1,
        });
      return {oldData, oldFeed};
    },
    onError(error, variables, context: any) {
      const oldData = context?.oldData;
      const oldFeed = context?.oldFeed;
      if (oldData) {
        queryClient.setQueryData([communityKey], oldData);
        queryClient.setQueryData([accountCommunityKey], oldFeed);
      }
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  const unsubMutation = useMutation({
    mutationFn: (credentials: any) =>
      subscribeCommunity(loginInfo, credentials.password, {
        communityId: communityData?.account,
        subscribe: false,
      }),
    onSuccess(data, variables, context) {
      AppConstants.SHOW_TOAST('Unsubscribed', '', 'success');
    },
    onMutate(variables) {
      const oldData: Community | undefined = queryClient.getQueryData([
        communityKey,
      ]);
      queryClient.setQueryData([communityKey], {
        ...oldData,
        observer_subscribed: 0,
      });
      const oldFeed = queryClient.getQueryData<Community[]>([
        accountCommunityKey,
      ]);
      if (oldFeed)
        queryClient.setQueryData(
          [accountCommunityKey],
          oldFeed.filter(item => item.account !== communityData.account),
        );
    },
    onError(error, variables, context: any) {
      const oldData = context?.oldData;
      const oldFeed = context?.oldFeed;
      if (oldData) {
        queryClient.setQueryData([communityKey], oldData);
        queryClient.setQueryData([accountCommunityKey], oldFeed);
      }
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  const handleUnSubClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '', 'info');
      return;
    }
    const credentials = await getCredentials();
    if (credentials) {
      unsubMutation.mutate(credentials);
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const handleSubClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '', 'info');
      return;
    }
    const credentials = await getCredentials();
    if (credentials) {
      subMutation.mutate(credentials);
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };
  const handleOnInfoClick = () => {
    navigation.navigate(AppRoutes.PAGES.CommunityReportPage, {
      category: category,
    });
  };
  class CommunityInfoItem extends PureComponent<{
    title: string;
    body: string;
    abbr?: string;
  }> {
    render() {
      const {title, body, abbr} = this.props;
      return (
        <View style={{width: '100%'}}>
          <Card mode="elevated" theme={{roundness: 2}}>
            <Card.Content style={{paddingVertical: 1, paddingHorizontal: 0}}>
              <VStack spacing={2} center>
                <Text
                  variant="bodySmall"
                  style={[{opacity: 0.6, fontSize: 10}]}>
                  {title}
                </Text>
                <View>
                  <Tooltip title={body ?? ''}>
                    <Text variant="labelMedium">{abbr ?? body}</Text>
                  </Tooltip>
                </View>
              </VStack>
            </Card.Content>
          </Card>
        </View>
      );
    }
  }

  const handleNewPost = () => {
    navigation.push(AppRoutes.PAGES.PostingStack, {
      screen: AppRoutes.PAGES.PostingPage,
      params: {community: communityData},
    });
  };

  return (
    <VStack
      style={[
        styles.container,
        containerStyle,
        {height: expanded ? cardHeight : 60},
      ]}>
      <View
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
        }}>
        {accountData && parsed.coverImage ? (
          <Card.Cover
            theme={{roundness: 2}}
            style={{
              height: '100%',
              width: '100%',
              backgroundColor: AppColors.GLASS_COLOR,
              opacity: 0.9,
            }}
            source={{
              uri: proxifyImageSrc(parsed.coverImage, 640),
            }}
          />
        ) : null}

        <View
          style={{
            height: '100%',
            width: '100%',
            borderRadius: 4,
            backgroundColor: MD2Colors.black,
            opacity: 0.6,
            position: 'absolute',
          }}
        />
      </View>
      <ExpandableView visible={expanded} maxHeight={cardHeight}>
        <VStack
          p={expanded ? 8 : 4}
          spacing={10}
          position="absolute"
          fill
          style={{width: '100%'}}>
          <HStack spacing={10} items="center" style={{flex: 0.2}}>
            <View>
              <BadgeAvatar
                reputation={communityData?.account_reputation || 25}
                name={category}
                avatarSize={expanded ? 60 : 35}
                badgeRight={0}
              />
            </View>

            <VStack spacing={expanded ? 5 : 0} style={{flex: 1}}>
              <HStack items="center" spacing={4}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.communityText,
                    {fontSize: 14, fontWeight: '700'},
                  ]}
                  variant={'labelLarge'}>
                  {communityData?.title ?? community ?? ''}
                </Text>
                <TouchableOpacity onPress={handleOnInfoClick}>
                  <Icons.MaterialCommunityIcons
                    name="information-outline"
                    size={18}
                    color={'white'}
                  />
                </TouchableOpacity>
              </HStack>

              {!queryResults[0].isPending && communityData && (
                <VStack spacing={5}>
                  <Text
                    selectable
                    numberOfLines={expanded ? 2 : 1}
                    style={[
                      styles.communityText,
                      {fontSize: expanded ? 11 : 11},
                    ]}
                    variant="labelSmall">
                    {communityData?.about ?? ''}{' '}
                  </Text>

                  {expanded ? (
                    <HStack spacing={10} mt={2}>
                      <Button
                        uppercase
                        onPress={() => {
                          communityData?.observer_subscribed
                            ? handleUnSubClick()
                            : handleSubClick();
                        }}
                        loading={
                          subMutation.isPending || unsubMutation.isPending
                        }
                        mode="elevated"
                        style={{alignSelf: 'flex-start'}}
                        disabled={
                          subMutation.isPending || unsubMutation.isPending
                        }
                        labelStyle={{
                          marginVertical: 0,
                          fontSize: 10,
                          color: communityData?.observer_subscribed
                            ? MD2Colors.red400
                            : MD2Colors.teal400,
                        }}>
                        {communityData?.observer_subscribed === 1
                          ? 'Leave'
                          : 'Subscribe'}
                      </Button>
                      <View>
                        {communityData?.observer_subscribed === 1 ? (
                          <Button
                            disabled={unsubMutation.isPending}
                            uppercase
                            onPress={handleNewPost}
                            mode="elevated"
                            style={{alignSelf: 'flex-start'}}
                            labelStyle={{
                              marginVertical: 0,
                              fontSize: 10,
                              marginHorizontal: 5,
                            }}>
                            New Post
                          </Button>
                        ) : null}
                      </View>
                    </HStack>
                  ) : null}
                </VStack>
              )}
            </VStack>
          </HStack>

          {expanded && communityData && (
            <VStack items="start" justify="evenly">
              <HStack
                items="center"
                justify="evenly"
                spacing={10}
                style={{width: '100%'}}>
                <View style={{flex: 0.7}}>
                  <CommunityInfoItem
                    title="Rank"
                    body={communityData?.rank.toString()}
                  />
                </View>
                <View style={{flex: 1}}>
                  <CommunityInfoItem
                    title="Subscribers"
                    body={communityData?.count_subs?.toLocaleString('en-US')}
                    abbr={abbreviateNumber(communityData?.count_subs)}
                  />
                </View>
                <View style={{flex: 1.3}}>
                  <CommunityInfoItem
                    title="Pending rewards"
                    body={`$${communityData?.count_pending?.toLocaleString(
                      'en-US',
                    )}`}
                  />
                </View>
                <View style={{flex: 1}}>
                  <CommunityInfoItem
                    title="Active authors"
                    body={communityData?.count_authors.toString()}
                  />
                </View>
              </HStack>
            </VStack>
          )}
        </VStack>
      </ExpandableView>

      <ViewBar
        onPress={() => {
          setExpanded(!expanded);
        }}
      />
    </VStack>
  );
};

export {CommunityHeader};

const styles = StyleSheet.create({
  container: {
    elevation: 4,
    borderColor: 'white',
    borderRadius: 6,
    backgroundColor: MD2Colors.red300,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'column',
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    height: cardHeight,
  },
  communityText: {
    color: MD2Colors.white,
  },
});
