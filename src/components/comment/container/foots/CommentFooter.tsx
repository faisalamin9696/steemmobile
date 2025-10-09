import {useEffect, useState} from 'react';
import {
  NativeSyntheticEvent,
  TextInputFocusEventData,
  View,
} from 'react-native';
import {useAppSelector} from '../../../../constants/AppFunctions';
import VotingModal from '../../../basicComponents/VotingModal';
import {
  getCredentials,
  getItemFromStorage,
  removeItemFromStorage,
  setItemToStorage,
} from '../../../../utils/realm';
import {AppConstants} from '../../../../constants/AppConstants';
import {
  deleteComment,
  mutePost,
  voteComment,
} from '../../../../steem/CondenserApis';
import {useDispatch} from 'react-redux';
import {saveLoginInfo} from '../../../../utils/handlers';
import {getVoteData} from '../../../../steem/SteemApis';
import {useMutation} from '@tanstack/react-query';
import {calculatePowerUsage} from '../../../../utils/steemUtils';
import {AppRoutes} from '../../../../constants/AppRoutes';
import {CommentFoot} from './container/CoommentFoot';
import {saveRepliesHandler} from '../../../../redux/reducers/RepliesReducer';
import {ReplyFoot} from '../..';
import {saveCommentHandler} from '../../../../redux/reducers/CommentReducer';
import {saveLoginHandler} from '../../../../redux/reducers/LoginReducer';
import {delay} from '../../../../utils/editor';

interface Props {
  rootComment: Post | Feed;
  navigation: any;
  route: any;
  comment: Feed | Post;
  isReply?: boolean;
  handleReplyClick?: (isOpen?: boolean) => void;
  handleEditClick?: () => void;
  handleMuteClick?: () => void;
  handleDeleteClick?: (comment: Post) => void;
  handleUpvoteClick?: () => void;
  handleDownvoteClick?: () => void;
  handleResteemClick?: () => void;
  handleCommentClick?: () => void;
  onNewComment?: (newComment, isEdit?: boolean) => void;
  onNewVote?: (newChanges: Post) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  isPostLoading?: boolean;
  isAccount?: boolean;
  handleOnUpdate?: (newComment: Post | Feed) => void;
  rewardAnchorPosition?: 'top' | 'bottom' | undefined;
}

const CommentFooter = (props: Props) => {
  let {
    navigation,
    route,
    comment,
    isReply,
    handleEditClick,
    handleUpvoteClick,
    handleDownvoteClick,
    handleCommentClick,
    rootComment,
    handleOnUpdate,
  } = props;

  const commentInfo =
    useAppSelector(state => state.commentReducer.values)[
      `${comment.author}/${comment.permlink}`
    ] ?? comment;
  // const { feed_api } = route?.params ?? { feed_api: null };
  const [muting, setMuting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const globalData = useAppSelector(state => state.steemGlobalReducer.value);
  const [votingModal, setVotingModal] = useState(false);
  const dispatch = useDispatch();
  const parsedComment = commentInfo as Post;
  const [showReward, setShowReward] = useState(false);

  // getting the query data
  const postReplies =
    useAppSelector(state => state.repliesReducer.values)[
      `${rootComment.author}/${rootComment.permlink}`
    ] ?? [];

  const deleteMutation = useMutation({
    mutationFn: (credentials: any) =>
      deleteComment(loginInfo, credentials.password, {
        author: commentInfo.author,
        permlink: commentInfo.permlink,
      }),
    onSuccess() {
      if (isReply && postReplies) {
        const filtered_replies = postReplies
          .filter(item => item.permlink !== commentInfo.permlink)
          .map(item =>
            item.permlink === parsedComment.parent_permlink
              ? {...item, children: item?.children - 1}
              : item,
          );

        dispatch(
          saveRepliesHandler({comment: rootComment, replies: filtered_replies}),
        );
      }
      if (handleOnUpdate) {
        handleOnUpdate({
          ...rootComment,
          children: rootComment.children - 1,
        });
      }

      AppConstants.SHOW_TOAST('Deleted', '', 'success');
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
    onSettled() {
      setDeleting(false);
    },
  });

  const muteMutation = useMutation({
    mutationFn: (credentials: any) =>
      mutePost(loginInfo, credentials.password, commentInfo?.is_muted, {
        communityId: commentInfo.category,
        account: commentInfo.author,
        permlink: commentInfo.permlink,
        notes: 'mute',
      }),
    onSuccess() {
      const mute_value = commentInfo?.is_muted ? 0 : 1;

      if (postReplies && isReply) {
        const filtered_replies = postReplies.map(item =>
          item.permlink === commentInfo.permlink
            ? {...item, is_muted: mute_value}
            : item,
        );

        dispatch(
          saveRepliesHandler({comment: rootComment, replies: filtered_replies}),
        );
      }
      if (handleOnUpdate) {
        handleOnUpdate({...commentInfo, is_muted: mute_value});
      }

      if (mute_value === 1) {
        AppConstants.SHOW_TOAST('Muted', '', 'success');
      } else {
        AppConstants.SHOW_TOAST('Unmuted', '', 'success');
      }
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
    onSettled() {
      setMuting(false);
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({key, weight}: {key: string; weight: number}) =>
      voteComment(commentInfo, loginInfo, key, weight),
    onSettled(data, error, variables, context) {
      const {weight} = variables;
      if (error) {
        AppConstants.SHOW_TOAST('Failed', String(error), 'error');
        dispatch(saveCommentHandler({...commentInfo, status: 'idle'}));
        return;
      }

      const downvote = weight < 0;
      const vData = getVoteData(loginInfo, globalData);
      const remove = weight === 0;
      const vote_value =
        (weight / 100) *
        (vData.current_vote *
          (downvote
            ? loginInfo.downvote_mana_percent
            : loginInfo.upvote_mana_percent) *
          0.01);

      const newChanges: Post | Feed = {
        ...commentInfo,
        observer_vote: remove ? 0 : 1,
        [downvote ? 'downvote_count' : 'upvote_count']: downvote
          ? commentInfo.downvote_count + 1
          : commentInfo.upvote_count + 1,
        observer_vote_percent: weight,
        payout: remove
          ? commentInfo.payout
          : commentInfo.payout + (downvote ? -vote_value : vote_value),
        observer_vote_rshares: remove ? 0 : commentInfo.observer_vote_rshares,
        status: 'idle',
      };

      dispatch(saveCommentHandler(newChanges));

      // update the login user data
      const downvote_per = downvote
        ? loginInfo.downvote_mana_percent - calculatePowerUsage(weight)
        : loginInfo.downvote_mana_percent;
      const upvote_per = !downvote
        ? loginInfo.upvote_mana_percent - calculatePowerUsage(weight)
        : loginInfo.upvote_mana_percent;
      dispatch(
        saveLoginHandler({
          ...loginInfo,
          upvote_mana_percent: upvote_per,
          downvote_mana_percent: downvote_per,
        }),
      );

      setItemToStorage('last_vote', weight);
    },
  });

  const onEditClick = (isReply?: boolean) => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }

    handleEditClick && handleEditClick();
  };

  const onDeleteClick = async (isReply?: boolean) => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }

    setDeleting(true);
    const credentials = await getCredentials();
    if (credentials) {
      deleteMutation.mutate(credentials);
    } else {
      setDeleting(false);
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const onMuteClick = async isReply => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }
    setMuting(true);

    const credentials = await getCredentials();
    if (credentials) {
      muteMutation.mutate(credentials);
    } else {
      setMuting(false);
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const onUpvoteClick = (isReply: boolean = false) => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }
    handleUpvoteClick && handleUpvoteClick();
    setVotingModal(true);
  };

  const onDownvoteClick = (isReply: boolean = false) => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }
    handleDownvoteClick && handleDownvoteClick();
    setVotingModal(true);
  };

  async function castVote(weight: number) {
    const downvote = weight < 0;
    dispatch(
      saveCommentHandler({
        ...commentInfo,
        status: downvote ? 'downvoting' : 'upvoting',
      }),
    );
    await delay(1000);

    try {
      const credentials = await getCredentials();
      if (credentials) {
        await voteMutation.mutateAsync({key: credentials.password, weight});
      } else {
        AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
      }
    } catch (e) {
      AppConstants.SHOW_TOAST('Failed', String(e), 'error');
    }
  }

  const onVotersClick = () => {
    navigation.navigate(AppRoutes.PAGES.VotersPage, {comment: commentInfo});
  };

  const onRewardClick = () => {
    setShowReward(!showReward);
  };

  return (
    <View>
      {isReply ? (
        <ReplyFoot
          {...props}
          comment={commentInfo}
          onVotersClick={onVotersClick}
          onUpvoteClick={onUpvoteClick}
          onDownvoteClick={onDownvoteClick}
          onMuteClick={onMuteClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          muteMutation={muting}
          deleteMutation={deleting}
          onRewardClick={onRewardClick}
        />
      ) : (
        <CommentFoot
          {...props}
          comment={commentInfo}
          onVotersClick={onVotersClick}
          onCommentClick={handleCommentClick}
          onRewardClick={onRewardClick}
          onUpvoteClick={onUpvoteClick}
          onDownvoteClick={onDownvoteClick}
        />
      )}
      {votingModal && (
        <VotingModal
          visible={votingModal}
          setVisible={setVotingModal}
          handleVote={weight => castVote(weight)}
        />
      )}
    </View>
  );
};

export {CommentFooter};
