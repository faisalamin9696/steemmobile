import {VStack} from '@react-native-material/core';
import {
  FlatList,
  NativeSyntheticEvent,
  ScrollView,
  TextInputFocusEventData,
} from 'react-native';
import {useRef, useState} from 'react';
import React from 'react';
import {Button, MD2Colors} from 'react-native-paper';
import {PostHtmlInteractionHandler} from '../../renderer/PostHtmlInteractionHandler';
import RoundSegmentedButtons from '../../../../components/segmented/RoundSegmentedButtons';
import {delay} from '../../../../utils/editor';
import {Reply} from '../..';
import {useAppSelector} from '../../../../constants/AppFunctions';
import LottieError from '../../../../components/basicComponents/LottieError';
import {useMutation} from '@tanstack/react-query';
import {useDispatch} from 'react-redux';
import {saveRepliesHandler} from '../../../../redux/reducers/RepliesReducer';
import {getPostReplies} from '../../../../steem/SteemApis';

interface Props {
  navigation: any;
  route: any;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  handleReplyClick?: (isOpen?: boolean) => void;
  handleDeleteClick?: (comment: Post) => void;
  deleting?: boolean;
  comment: Post;
}

const Replies = (props: Props) => {
  let {navigation, comment, route} = props;
  const commentInfo: Post = (useAppSelector(
    state => state.commentReducer.values,
  )[`${comment.author}/${comment.permlink}`] ?? comment) as Post;

  const postReplies: Post[] =
    useAppSelector(state => state.repliesReducer.values)[
      `${commentInfo.author}/${commentInfo.permlink}`
    ] ?? [];
  const [loadMore, setLoadMore] = useState(false);
  const [limit, setLimit] = useState(15);
  const rootReplies = postReplies
    ?.slice(0, limit)
    ?.filter((item: Post) => item.depth === commentInfo.depth + 1);
  const postInteractionRef = useRef<any>();
  const [segmentValue, setSegmentValue] = useState<
    'created' | 'payout' | 'upvote_count'
  >('payout');
  const mutationKey = [
    `repliesMutation-${`${commentInfo?.author}/${commentInfo?.permlink}`}`,
  ];
  const [isLoading, setIsLoading] = useState(false);
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const dispatch = useDispatch();

  async function handleLoadMore() {
    setIsLoading(true);
    await delay(1500);
    setLimit(prev => prev + 20);
    setIsLoading(false);
  }

  const repliesMutation = useMutation({
    mutationKey,
    mutationFn: () =>
      getPostReplies(commentInfo.author, commentInfo.permlink, loginInfo.name),
    onSuccess(data) {
      setIsLoading(false);
      dispatch(
        saveRepliesHandler({
          comment: commentInfo,
          replies: data?.sort(
            (a, b) => b[segmentValue as string] - a[segmentValue as string],
          ),
        }),
      );
    },
  });

  function handleLoadComments() {
    setIsLoading(true);
    repliesMutation.mutate();
  }

  return (
    <VStack w={'100%'} items="center">
      {repliesMutation.isSuccess ? null : (
        <Button
          loading={isLoading || repliesMutation.isPending}
          disabled={repliesMutation.isPending}
          mode="contained-tonal"
          labelStyle={{marginHorizontal: 8, marginVertical: 4, fontSize: 14}}
          compact
          onPress={handleLoadComments}>
          Load Comments
        </Button>
      )}

      {repliesMutation.isSuccess && (
        <RoundSegmentedButtons
          density="high"
          value={segmentValue}
          onValueChange={(value: any) => {
            setSegmentValue(value);
            repliesMutation.mutate();
          }}
          style={{
            borderColor: MD2Colors.red400,
            paddingHorizontal: 10,
          }}
          buttons={[
            {value: 'payout', label: 'Trending', style: {borderWidth: 0.2}},
            {value: 'created', label: 'Time', style: {borderWidth: 0.2}},
            {value: 'upvote_count', label: 'Votes', style: {borderWidth: 0.2}},
          ]}
        />
      )}
      <ScrollView
        horizontal
        scrollEnabled={true}
        keyboardShouldPersistTaps="always">
        {repliesMutation.isSuccess && (
          <FlatList
            style={{marginTop: 8}}
            ListEmptyComponent={<LottieError empty style={{marginTop: 10}} />}
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            onEndReachedThreshold={0.1}
            data={rootReplies?.slice(0, limit)}
            renderItem={({item, index}) => (
              <VStack mb={10} key={index ?? item.link_id}>
                <Reply
                  {...props}
                  comment={item}
                  postInteractionRef={postInteractionRef}
                  rootComment={commentInfo}
                />
              </VStack>
            )}
            overScrollMode="never"
            ListFooterComponent={() =>
              (repliesMutation?.data?.length ?? 0) > limit ? (
                <VStack p={2} center>
                  <Button
                    loading={loadMore}
                    disabled={loadMore}
                    mode="contained"
                    labelStyle={{
                      marginHorizontal: 8,
                      marginVertical: 4,
                      fontSize: 12,
                    }}
                    compact
                    onPress={handleLoadMore}>
                    Load More
                  </Button>
                </VStack>
              ) : null
            }
            keyExtractor={(item, index) => item.link_id.toString()}
          />
        )}
        <PostHtmlInteractionHandler
          ref={postInteractionRef}
          navigation={navigation}
        />
      </ScrollView>
    </VStack>
  );
};

export {Replies};
