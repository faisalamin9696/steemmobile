import {VStack} from '@react-native-material/core';
import {useEffect, useState} from 'react';
import ConfirmationModal from '../../../basicComponents/ConfirmationModal';
import {AppConstants} from '../../../../constants/AppConstants';
import {useAppSelector} from '../../../../constants/AppFunctions';
import {getCredentials} from '../../../../utils/realm';
import {reblogPost} from '../../../../steem/CondenserApis';
import {useMutation} from '@tanstack/react-query';
import {CommentHead} from './container/CommentHead';
import {ReplyHead} from '../..';
import {LayoutAnimation} from 'react-native';

interface Props {
  navigation: any;
  route: any;
  comment: Feed | Post;
  isDetail?: boolean;
  isReply?: boolean;
  isCommunity?: boolean;
  handleTranslate?: (body: string) => void;
  isSearch?: boolean;
  isAccount?: boolean;
  handleOnUpdate?: (newComment: Post | Feed) => void;
}

const CommentHeader = (props: Props) => {
  let {comment, isReply, route, handleOnUpdate} = props;

  comment = isReply ? (comment as Post) : (comment as Feed);
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const [reblogDialog, setReblogDialog] = useState(false);
  const [isAdLoaded, setAdLoaded] = useState(false);

  const resteemMutation = useMutation({
    mutationFn: (credentials: any) =>
      reblogPost(loginInfo, credentials.password, {
        author: comment.author,
        permlink: comment.permlink,
      }),
    onSuccess() {
      if (handleOnUpdate)
        handleOnUpdate({
          ...comment,
          observer_resteem: 1,
          resteem_count: comment.resteem_count + 1,
        });
      AppConstants.SHOW_TOAST('Reblogged', '', 'success');
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  const onResteemClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '');
      return;
    }
    if (comment.observer_resteem === 1) {
      AppConstants.SHOW_TOAST('Already reblogged');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const credentials = await getCredentials();
    if (credentials) {
      if (comment.observer_resteem !== 1) {
        // if (handleOnUpdate) {
        //     handleOnUpdate({ ...comment, observer_resteem: 1, resteem_count: comment.resteem_count + 1 });
        //     AppConstants.SHOW_TOAST('Reblogged', '', 'success');
        // }
        resteemMutation.mutate(credentials);
      }
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  return (
    <VStack>
      {isReply ? (
        <ReplyHead {...props} />
      ) : (
        <CommentHead
          {...props}
          handleResteem={() => {
            setReblogDialog(true);
          }}
        />
      )}

      {reblogDialog ? (
        <ConfirmationModal
          body="This post will be added to your blog and shared with your followers."
          visible={reblogDialog}
          primaryText="Reblog"
          setVisible={setReblogDialog}
          handlePrimaryClick={onResteemClick}
        />
      ) : null}
    </VStack>
  );
};

export {CommentHeader};
