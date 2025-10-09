import {HStack, VStack} from '@react-native-material/core';
import {useEffect, useRef, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  NativeScrollEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {Button, Card, IconButton} from 'react-native-paper';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import {getComment, getPostReplies} from '../../../steem/SteemApis';
import getWindowDimensions from '../../../utils/getWindowDimensions';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {renderPostBody} from '../../../utils/e-render/src';
import {useAppSelector} from '../../../constants/AppFunctions';
import React from 'react';
import {Role} from '../../../utils/community';
import {allowDelete} from '../../../utils/StateFunctions';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import LottieError from '../../../components/basicComponents/LottieError';
import {extractMetadata} from '../../../utils/editor';
import {AppRoutes} from '../../../constants/AppRoutes';
import {AppConstants} from '../../../constants/AppConstants';
import {delay} from '../../../utils/editor';
import {mutePost, pinPost} from '../../../steem/CondenserApis';
import {getCredentials} from '../../../utils/realm';
import {deleteComment} from '../../../steem/CondenserApis';
import {MakeQueryKey} from '../../../utils/utils';
import PostBodyView from '../renderer/postBodyView';
import {isAccountCommunity} from '../../../utils/CommunityValidation';
import {CommentPosting} from '../../posting';
import {DetailsFooter, DetailsHeader, Replies} from '..';
import {parsePostMeta} from '../../../utils/user';
import ConfirmationModal from '../../../components/basicComponents/ConfirmationModal';
import TagsFlatList from '../../../components/basicComponents/TagsFlatList';
import {useDispatch} from 'react-redux';
import {saveRepliesHandler} from '../../../redux/reducers/RepliesReducer';
import {savePostHandler} from '../../../redux/reducers/PostReducer';

interface Props {
  navigation: any;
  route: any;
}
const WIDTH = getWindowDimensions().width;

const CommentDetailPage = (props: Props) => {
  const {navigation, route} = props;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton onPress={handleOnRefresh} icon={'refresh'} />
      ),
    });
  }, [navigation]);

  let {type, comment, feed_api, account} = route.params;

  const statePost: Post =
    useAppSelector(state => state.postReducer.values)[
      `${comment.author}/${comment.permlink}`
    ] ?? comment;
  const scrollViewRef = useRef<any>(null);
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const lastContentOffset = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const translateY = useSharedValue(0);
  const translateYfooter = useSharedValue(0);
  const [bodyLoad, setBodyLoad] = useState(false);
  let [replyFetched, setReplyFetched] = useState(false);
  const queryClient = useQueryClient();
  const isScrolling = useSharedValue(false);
  const [commentsView, setCommentsView] = useState({x: 0, y: 0});
  const username = loginInfo.name;
  const author = statePost?.author;
  const allowReply = Role.canComment(comment.community, comment.observer_role);
  const canEdit = username && username === author;
  const canDelete = username && username === author && allowDelete(statePost);
  const canReply = allowReply && statePost?.depth < 255;
  const canMute = username && Role.atLeast(statePost?.observer_role, 'mod');
  const canPin = username && Role.atLeast(statePost?.observer_role, 'mod');
  const [showComment, setShowComment] = useState(false);
  const commentKey = MakeQueryKey(
    feed_api,
    type,
    account,
    `${statePost.author + '-' + statePost.permlink}`,
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const dispatch = useDispatch();
  const mutationKey = [
    `repliesMutation-${`${statePost?.author}/${statePost?.permlink}`}`,
  ];
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //     return () => {
  //         if (!replyFetched) {
  //             dispatch(saveRepliesHandler({ comment: statePost, replies: [] }));

  //         }
  //     }
  // }, []);

  const fetchData = async () => {
    // delay for the footer animation
    await delay(800);
    const response = await getComment(comment, loginInfo.name || 'null');
    const updatedFeed = {
      ...response,
      // replies: response?.sort((a, b) => b.created - a.created).slice(0, response.length - 1),
    } as Post;

    return response;
  };

  const [translation, setTranslation] = useState({
    translated: false,
    title: statePost?.title ?? '',
    body: statePost?.body ?? '',
  });

  const {
    data: postData,
    error,
    refetch,
    isSuccess,
    isFetching,
  } = useQuery({
    queryKey: [commentKey],
    queryFn: fetchData,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isSuccess) {
      setReplyFetched(false);
      dispatch(savePostHandler({...postData}));
      dispatch(saveRepliesHandler({comment: postData, replies: []}));
      setTranslation({...translation, translated: false});
    }
  }, [isSuccess]);

  //   const allReplies =
  //     useAppSelector(state => state.repliesReducer.values)[
  //       `${statePost.author}/${statePost.permlink}`
  //     ] ?? [];

  const keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => {
    translateYfooter.value = headerHeight;
  });
  const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
    translateYfooter.value = 0;
    translateY.value = 0;
  });

  useEffect(() => {
    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const tags: string[] | undefined =
    parsePostMeta(statePost?.json_metadata ?? statePost?.json_metadata)?.tags ||
    undefined;

  const IS_TYPED: boolean | undefined = statePost
    ? statePost.depth >= 1
    : undefined;

  // on refrsh button clicked
  const handleOnRefresh = () => {
    setReplyFetched(false);
    translateY.value = 0;
    translateYfooter.value = 0;
    scrollViewRef.current?.scrollTo({x: 5, y: 5, animated: true});
    refetch();
  };

  const onEditClick = () => {
    navigation.push(AppRoutes.PAGES.PostingStack, {
      screen: AppRoutes.PAGES.PostingPage,
      params: {isEdit: true, comment: statePost, commentKey: commentKey},
    });
  };
  const onLayout = event => {
    const {height} = event.nativeEvent.layout;
    setHeaderHeight(height + 10);
  };

  const repliesMutation = useMutation({
    mutationKey,
    mutationFn: () =>
      getPostReplies(statePost.author, statePost.permlink, loginInfo.name),
    onSuccess(data) {
      setIsLoading(false);
      dispatch(
        saveRepliesHandler({
          comment: statePost,
          replies: data?.sort((a, b) => b.created - a.created),
        }),
      );
    },
  });

  const loadReplies = () => {
    if (IS_TYPED && !statePost?.['root_permlink']) {
      AppConstants.SHOW_TOAST(
        'Something went wrong',
        'refresh the post',
        'info',
      );
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setIsLoading(true);
    repliesMutation.mutate();
    // console.log(allReplies.concat(postData?.replies ?? []))
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: NativeScrollEvent) => {
      if (
        lastContentOffset.value > event.contentOffset.y &&
        isScrolling.value
      ) {
        translateY.value = 0;
        translateYfooter.value = 0;
      } else if (
        lastContentOffset.value < event.contentOffset.y &&
        isScrolling.value
      ) {
        translateY.value = headerHeight;
        translateYfooter.value = headerHeight;
      }
      lastContentOffset.value = event.contentOffset.y;
    },
    onBeginDrag: e => {
      isScrolling.value = true;
    },
    onEndDrag: e => {
      isScrolling.value = false;
    },
  });

  const onReplyClick = () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }
    setShowComment(!showComment);
  };

  const deleteMutation = useMutation({
    mutationFn: (credentials: any) =>
      deleteComment(loginInfo, credentials.password, {
        author: statePost!.author,
        permlink: statePost!.permlink,
      }),
    onSuccess() {
      dispatch(
        savePostHandler({...statePost, body: undefined, link_id: undefined}),
      );
      AppConstants.SHOW_TOAST('Deleted', '', 'success');
      navigation.pop();
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  const onDeleteClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }
    const credentials = await getCredentials();
    if (credentials) {
      deleteMutation.mutate(credentials);
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const muteMutation = useMutation({
    mutationFn: (credentials: any) =>
      mutePost(loginInfo, credentials.password, !statePost?.is_muted, {
        communityId: statePost!.category,
        account: statePost!.author,
        permlink: statePost!.permlink,
        notes: 'mute',
      }),
    onSuccess() {
      const mute_value = statePost?.is_muted ? 0 : 1;

      dispatch(savePostHandler({...statePost, is_muted: mute_value}));

      if (mute_value === 1) {
        AppConstants.SHOW_TOAST('Muted', '', 'success');
      } else {
        AppConstants.SHOW_TOAST('Unmuted', '', 'success');
      }
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  const onMuteClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }

    const credentials = await getCredentials();
    if (credentials) {
      muteMutation.mutate(credentials);
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const pinMutation = useMutation({
    mutationFn: (credentials: any) =>
      pinPost(loginInfo, credentials.password, !statePost?.is_pinned, {
        communityId: statePost!.category,
        account: statePost!.author,
        permlink: statePost!.permlink,
      }),
    onSuccess() {
      const pin_value = statePost?.is_pinned ? 0 : 1;
      dispatch(savePostHandler({...statePost, is_pinned: pin_value}));

      if (pin_value) {
        AppConstants.SHOW_TOAST('Pinned', '', 'success');
      } else {
        AppConstants.SHOW_TOAST('Unpinned', '', 'success');
      }
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  const onPinClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }

    const credentials = await getCredentials();
    if (credentials && statePost) {
      pinMutation.mutate(credentials);
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  function onLayoutCommentView(event) {
    const {x, y, height, width} = event.nativeEvent.layout;
    const newLayout = {
      height: height,
      width: width,
      left: x,
      top: y,
    };
    setCommentsView({x: newLayout.left, y: newLayout.top});
  }

  const _handleTagPress = (category: string, FILTER) => {
    if (category) {
      const name = isAccountCommunity(category)
        ? AppRoutes.PAGES.CommunityPage
        : AppRoutes.PAGES.CategoryPage;
      const KEY = `${FILTER}/${category}`;
      navigation.push(name, {
        category,
        FILTER,
        KEY,
      });
    }
  };

  return (
    <MainWrapper>
      <VStack ph={4} fill items="center">
        <DetailsHeader
          feed_api={feed_api}
          account={account}
          type={type}
          translateY={translateY}
          onLayout={onLayout}
          {...props}
          onTranslated={setTranslation}
          comment={statePost}
        />

        <KeyboardAvoidingView
          keyboardVerticalOffset={Platform.OS == 'ios' ? 64 : undefined}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}>
          <Animated.ScrollView
            automaticallyAdjustKeyboardInsets
            onScroll={scrollHandler}
            keyboardShouldPersistTaps={'always'}
            ref={scrollViewRef}
            style={{
              backgroundColor: 'transparent',
              flex: 1,
            }}
            scrollEventThrottle={16}
            overScrollMode="never"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              alignItems: 'center',
              paddingBottom: 80,
              paddingTop: headerHeight + 10,
            }}>
            {isFetching ? (
              <LottieLoading loading={true} />
            ) : error ? (
              <LottieError
                error={error?.['message']}
                loading={error !== undefined}
                onTryAgain={() => {
                  refetch();
                }}
              />
            ) : (
              <>
                {isSuccess ? (
                  <VStack spacing={10}>
                    <VStack
                      fill
                      spacing={10}
                      justify="center"
                      style={{
                        opacity: statePost?.is_muted ? 0.3 : 1,
                      }}>
                      <PostBodyView
                        {...props}
                        body={renderPostBody(
                          translation.translated
                            ? translation.body
                            : statePost?.body ?? '',
                          true,
                          false,
                        )}
                        metadata={extractMetadata(statePost?.body ?? '')}
                        onLoadEnd={() => {
                          setBodyLoad(true);
                        }}
                        width={WIDTH - 30}
                        textSelectable={true}
                      />
                      <HStack items="center" mv={10}>
                        {tags?.length && (
                          <TagsFlatList
                            isStatic
                            tags={tags}
                            width={WIDTH - 10}
                            handleItemPress={item => {
                              _handleTagPress(item, '');
                            }}
                          />
                        )}
                      </HStack>
                      <View>
                        {bodyLoad && statePost && isSuccess && (
                          <Card mode="contained" theme={{roundness: 2}}>
                            <Card.Content
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 6,
                              }}>
                              <HStack fill items="center" justify="between">
                                {canReply && (
                                  <Button
                                    onPress={onReplyClick}
                                    labelStyle={styles.buttonLabel}
                                    compact>
                                    {showComment ? 'Cancel' : 'Reply'}
                                  </Button>
                                )}
                                {canPin && (
                                  <Button
                                    onPress={onPinClick}
                                    labelStyle={styles.buttonLabel}
                                    compact
                                    disabled={pinMutation.isPending}
                                    loading={pinMutation.isPending}>
                                    {statePost?.is_pinned ? 'Unpin' : 'Pin'}
                                  </Button>
                                )}
                                {canMute && (
                                  <Button
                                    onPress={onMuteClick}
                                    labelStyle={styles.buttonLabel}
                                    compact
                                    disabled={muteMutation.isPending}
                                    loading={muteMutation.isPending}>
                                    {statePost?.is_muted ? 'Unmute' : 'Mute'}
                                  </Button>
                                )}
                                {canEdit && (
                                  <Button
                                    onPress={onEditClick}
                                    labelStyle={styles.buttonLabel}
                                    compact>
                                    Edit
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    onPress={() => {
                                      setDeleteConfirmation(true);
                                    }}
                                    labelStyle={styles.buttonLabel}
                                    compact
                                    disabled={deleteMutation.isPending}
                                    loading={deleteMutation.isPending}>
                                    Delete
                                  </Button>
                                )}
                              </HStack>
                            </Card.Content>
                          </Card>
                        )}
                      </View>

                      <View>
                        {statePost && showComment && (
                          <CommentPosting
                            isEdit={false}
                            rootComment={statePost}
                            handleOnComment={() => {
                              setShowComment(false);
                            }}
                            {...props}
                            comment={statePost}
                          />
                        )}
                      </View>

                      <VStack items="center" onLayout={onLayoutCommentView}>
                        <View style={{marginTop: 10}}>
                          <Replies {...props} comment={statePost} />
                        </View>
                      </VStack>
                    </VStack>
                  </VStack>
                ) : null}
              </>
            )}
          </Animated.ScrollView>
        </KeyboardAvoidingView>

        <DetailsFooter
          rootComment={statePost}
          feed_api={feed_api}
          type={type}
          account={account}
          {...props}
          comment={statePost}
          isPostLoading={isFetching}
          translateY={translateYfooter}
          handleCommentClick={() => {
            if (statePost && scrollViewRef && scrollViewRef.current) {
              scrollViewRef.current.scrollTo({
                y: commentsView.y,
                animated: true,
              });
            }
          }}
        />
      </VStack>

      {deleteConfirmation ? (
        <ConfirmationModal
          visible={deleteConfirmation}
          setVisible={setDeleteConfirmation}
          body="Do you really want to delete this post?"
          primaryText="Yes"
          handlePrimaryClick={onDeleteClick}
        />
      ) : null}
    </MainWrapper>
  );
};
export {CommentDetailPage};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    bottom: 10,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 4,
  },
  footerCard: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    marginHorizontal: 20,
  },
  text: {
    fontSize: 30,
  },
  buttonLabel: {
    marginHorizontal: 4,
    marginVertical: 2,
    fontSize: 14,
  },
});
