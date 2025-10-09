import {VStack} from '@react-native-material/core';
import {useState} from 'react';
import {Button} from 'react-native-paper';
import {renderPostBody} from '../../../../utils/e-render/src';
import getWindowDimensions from '../../../../utils/getWindowDimensions';
import {PostHtmlRenderer} from '../../renderer/PostHtmlRenderer';
import {LayoutAnimation, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {extractMetadata} from '../../../../utils/editor';
import {TranslateText} from '../../../../utils/utils';
import {Reply} from '../..';
import {CommentFooter, CommentHeader} from '../../../../components/comment';
import {useAppSelector} from '../../../../constants/AppFunctions';

interface Props {
  navigation: any;
  route: any;
  postInteractionRef: any;
  handleReplyClick?: (isOpen?: boolean) => void;
  comment: Post;
  rootComment: Post | Feed;
}

const {width} = getWindowDimensions();

const ReplyForm = (props: Props) => {
  const {comment, rootComment, postInteractionRef} = props;
  const postReplies =
    useAppSelector(state => state.repliesReducer.values)[
      `${rootComment.author}/${rootComment.permlink}`
    ] ?? [];
  const [mapChild, setMapChild] = useState(
    comment.is_new ||
      (comment.children >= 1 && comment.depth - (rootComment?.depth ?? 0) <= 3),
  );
  const [translation, setTranslation] = useState({
    translated: false,
    body: comment?.body || '',
  });

  const getReplies = permlink => {
    return postReplies?.filter(item => item.parent_permlink === permlink);
  };

  const replies: Post[] = getReplies(comment.permlink);

  const handleTranslate = async text => {
    if (!translation.translated) {
      const long_string = comment?.body;
      TranslateText(long_string).then(res => {
        setTranslation({translated: true, body: res});
      });
    }
  };
  const onCommentUpdate = newChanges => {
    // dispatch(saveCommentHandler(newChanges));
    console.log('Comment update', newChanges.author, newChanges.permlink);
  };

  return (
    <VStack spacing={10}>
      <VStack spacing={5}>
        <VStack spacing={10}>
          <View>
            <CommentHeader
              isReply
              {...props}
              comment={comment}
              handleTranslate={handleTranslate}
            />
          </View>
          <View style={{opacity: comment?.is_muted ? 0.3 : 1}}>
            <PostHtmlRenderer
              textSelectable
              contentWidth={
                width - (60 * (comment.depth - rootComment.depth)) / 2
              }
              body={renderPostBody(
                translation.translated ? translation.body : comment.body,
                true,
                false,
              )}
              isComment={true}
              setSelectedImage={postInteractionRef?.current?.handleImagePress}
              setSelectedLink={postInteractionRef?.current?.handleLinkPress}
              handleVideoPress={postInteractionRef?.current?.handleVideoPress}
              handleOnPostPress={postInteractionRef?.current?.handleOnPostPress}
              handleOnUserPress={postInteractionRef?.current?.handleOnUserPress}
              handleTagPress={postInteractionRef?.current?.handleTagPress}
              handleYoutubePress={
                postInteractionRef.current?.handleYoutubePress
              }
              metadata={extractMetadata(comment.body) ?? ''}
            />
          </View>

          <View>
            <CommentFooter
              handleOnUpdate={onCommentUpdate}
              isReply
              {...props}
              comment={comment}
            />
          </View>
        </VStack>
        <View>
          {comment.children >= 1 && (
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);

                setMapChild(!mapChild);
              }}
              style={{
                alignItems: 'center',
                alignSelf: 'flex-start',
              }}>
              <Button
                mode="contained-tonal"
                labelStyle={{
                  marginHorizontal: 10,
                  marginVertical: 0,
                  fontSize: 10,
                  textAlign: 'left',
                }}>
                {mapChild
                  ? 'Hide replies'
                  : `Reveal replies (${comment.children})`}
              </Button>
            </TouchableOpacity>
          )}
        </View>
      </VStack>

      {mapChild &&
        replies?.map((item, index) => (
          <VStack
            ms={(5 * (comment.depth - rootComment.depth)) / 2}>
            <Reply {...props} comment={item} rootComment={rootComment} />
          </VStack>
        ))}
    </VStack>
  );
};

export {ReplyForm};
