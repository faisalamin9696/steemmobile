import {VStack} from '@react-native-material/core';
import React, {useEffect} from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInputFocusEventData,
} from 'react-native';
import {MD2Colors} from 'react-native-paper';
import {ReplyForm} from '../..';
import {useAppSelector} from '../../../../constants/AppFunctions';
import {useDispatch} from 'react-redux';
import {saveCommentHandler} from '../../../../redux/reducers/CommentReducer';

interface Props {
  navigation: any;
  route: any;
  postInteractionRef: any;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  handleReplyClick?: (isOpen?: boolean) => void;
  comment: Post;
  rootComment: Post | Feed;
}

const Reply = (props: Props) => {
  const {comment} = props;
  const commentInfo: Post = (useAppSelector(
    state => state.commentReducer.values,
  )[`${comment.author}/${comment.permlink}`] ?? comment) as Post;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(saveCommentHandler(commentInfo));
  }, []);

  return (
    <VStack p={8} style={styles.leftBorder}>
      <ReplyForm {...props} {...props} comment={commentInfo} />
    </VStack>
  );
};

export {Reply};

const styles = StyleSheet.create({
  leftBorder: {
    borderLeftColor: MD2Colors.grey300,
    borderLeftWidth: 1,
  },
});
