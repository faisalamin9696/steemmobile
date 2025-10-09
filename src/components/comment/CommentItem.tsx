import React, {useState} from 'react';
import {Card, Text} from 'react-native-paper';
import {getPostThumbnail} from '../../utils/ImageApis';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {HStack, VStack} from '@react-native-material/core';
import {AppRoutes} from '../../constants/AppRoutes';
import {getPostBodySummary} from '../../utils/e-render/src/post-body-summary';
import {CommentFooter, CommentHeader} from '.';
import {hasNsfwTag} from '../../utils/StateFunctions';
import ConfirmationModal from '../basicComponents/ConfirmationModal';
import {useAppSelector} from '../../constants/AppFunctions';
import {useDispatch} from 'react-redux';
import {savePostHandler} from '../../redux/reducers/PostReducer';
import BadgeAvatar from '../basicComponents/BadgeAvatar';
import getWindowDimensions from '../../utils/getWindowDimensions';

interface Props {
  navigation: any;
  route: any;
  comment: Feed | Post;
  isBlog?: boolean;
  isCommunity?: boolean;
  isReply?: boolean;
  isSearch?: boolean;
  isPromotion?: boolean;
  settings: Setting;
  rewardAnchorPosition?: 'top' | 'bottom' | undefined;
}
const PAGE_WIDTH = getWindowDimensions().width;

const CommentItem = (props: Props) => {
  const {
    navigation,
    isBlog,
    route,
    isReply,
    isSearch,
    comment,
    isPromotion,
    settings,
    rewardAnchorPosition,
  } = props;
  const statePost: Feed | Post =
    useAppSelector(state => state.postReducer.values)[
      `${comment.author}/${comment.permlink}`
    ] ?? comment;
  const dispatch = useDispatch();

  const {type, feed_api, account, isAccount} = route?.params || {
    type: '',
    feed_api: '',
    account: '',
  };
  const [confirmation, setConfirmation] = useState(false);
  const isNsfw = hasNsfwTag(statePost ?? '');
  const thumbnail = getPostThumbnail(statePost.json_images);

  const handlePostClick = () => {
    // Check nsfw settings
    if (isNsfw && settings?.nsfw === '0') {
      setConfirmation(true);
      return;
    }
    navigation.push(AppRoutes.PAGES.CommentDetailPage, {
      account,
      type,
      comment: statePost,
      feed_api,
    });
  };

  const handleNsfwOpenClick = () => {
    navigation.push(AppRoutes.PAGES.CommentDetailPage, {
      account,
      type,
      comment: statePost,
      feed_api,
    });
  };

  const onPostUpdate = (newComment: Feed | Post) => {
    dispatch(savePostHandler(newComment));
  };

  const PromotionBlog = () => {
    return (
      <TouchableOpacity
        onPress={handlePostClick}
        style={{
          opacity: statePost?.is_muted ? 0.3 : 1,
          height: PAGE_WIDTH * 0.18,
        }}>
        <VStack center fill>
          <HStack
            style={[isBlog ? styles.blogsViewStyle : styles.feedViewStyle]}
            spacing={10}>
            <BadgeAvatar
              name={comment.author}
              reputation={comment.author_reputation}
            />

            <VStack
              style={{
                flex: 1,
                marginEnd: isBlog ? 10 : 0,
                marginTop: isBlog ? 0 : 5,
              }}
              spacing={4}>
              <Text numberOfLines={2} variant="titleMedium">
                {statePost?.title}
              </Text>
              <Text numberOfLines={1} variant="bodySmall">
                {getPostBodySummary(statePost?.body)}
              </Text>
            </VStack>
            {thumbnail ? (
              <Card.Cover
                blurRadius={isNsfw ? (settings?.nsfw === '1' ? 0 : 15) : 0}
                style={{
                  width: 100,
                  height: 60,
                  resizeMode: 'cover',
                  backgroundColor: 'transparent',
                }}
                theme={{roundness: 2}}
                source={{uri: thumbnail}}
              />
            ) : null}
          </HStack>
        </VStack>
      </TouchableOpacity>
    );
  };
  const BlogsCard = () => {
    return (
      <TouchableOpacity
        onPress={handlePostClick}
        style={{opacity: statePost?.is_muted ? 0.3 : 1}}>
        <VStack style={isBlog ? styles.blogsViewStyle : styles.feedViewStyle}>
          <VStack
            style={{
              flex: 1,
              marginEnd: isBlog ? 10 : 0,
              marginTop: isBlog ? 0 : 5,
            }}
            spacing={4}>
            <Text numberOfLines={1} variant="titleMedium">
              {statePost?.title}
            </Text>
            <Text
              numberOfLines={
                isBlog ? 1 : settings?.feedStyle === 'Flex' ? 3 : 1
              }
              variant="bodySmall">
              {getPostBodySummary(statePost?.body)}
            </Text>
          </VStack>
          {thumbnail ? (
            <Card.Cover
              blurRadius={isNsfw ? (settings?.nsfw === '1' ? 0 : 15) : 0}
              style={
                isBlog
                  ? styles.blogsCoverStyle
                  : settings?.feedStyle === 'Flex'
                  ? styles.flexCoverStyle
                  : styles.compactCoverStyle
              }
              theme={{roundness: 2}}
              source={{uri: thumbnail}}
            />
          ) : null}
        </VStack>
      </TouchableOpacity>
    );
  };

  const FeedCard = () => {
    return (
      <>
        <TouchableOpacity
          onPress={handlePostClick}
          style={{opacity: statePost?.is_muted ? 0.3 : 1}}>
          <VStack style={isBlog ? styles.blogsViewStyle : styles.feedViewStyle}>
            <VStack
              style={{
                flex: 1,
                marginEnd: isBlog ? 10 : 0,
                marginTop: isBlog ? 0 : 5,
              }}
              spacing={4}>
              <Text numberOfLines={1} variant="titleMedium">
                {statePost?.title}
              </Text>
              <Text
                numberOfLines={
                  isBlog ? 1 : settings?.feedStyle === 'Flex' ? 3 : 1
                }
                variant="bodySmall">
                {getPostBodySummary(statePost?.body)}
              </Text>
            </VStack>
          </VStack>
        </TouchableOpacity>

        {thumbnail && (
          <Card.Cover
            blurRadius={isNsfw ? (settings?.nsfw === '1' ? 0 : 15) : 0}
            style={
              isBlog
                ? styles.blogsCoverStyle
                : settings?.feedStyle === 'Flex'
                ? styles.flexCoverStyle
                : styles.compactCoverStyle
            }
            theme={{roundness: 2}}
            source={{uri: thumbnail}}
          />
        )}
      </>
    );
  };

  const CommentItemCard = () => {
    if (isPromotion) return <PromotionBlog />;
    else if (isBlog) return <BlogsCard />;
    else return <FeedCard />;
  };

  return statePost.link_id ? (
    <>
      <Card
        mode="contained"
        style={{opacity: isNsfw ? (settings?.nsfw === '1' ? 1 : 0.7) : 1}}
        theme={{roundness: 2}}>
        <Card.Content style={{paddingHorizontal: 6, paddingVertical: 4}}>
          <>
            {!isPromotion && (
              <CommentHeader
                handleOnUpdate={onPostUpdate}
                {...props}
                comment={statePost}
                isAccount={isAccount}
                isReply={isReply ?? false}
              />
            )}

            <CommentItemCard />

            {!isPromotion && !isSearch && (
              <CommentFooter
                rewardAnchorPosition={rewardAnchorPosition}
                handleOnUpdate={onPostUpdate}
                isAccount={isAccount}
                rootComment={statePost}
                {...props}
                comment={statePost}
                isReply={isReply ?? false}
              />
            )}
          </>
        </Card.Content>
      </Card>
      {confirmation && (
        <ConfirmationModal
          body="Do you really want to visit this NSFW content?"
          handlePrimaryClick={handleNsfwOpenClick}
          primaryText="Yes"
          secondaryText="No"
          visible={confirmation}
          setVisible={setConfirmation}
        />
      )}
    </>
  ) : (
    <></>
  );
};

export {CommentItem};

const styles = StyleSheet.create({
  feedViewStyle: {
    flexDirection: 'column-reverse',
  },
  blogsViewStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCoverStyle: {
    height: 130,
    marginTop: 10,
  },

  flexCoverStyle: {
    marginTop: 10,
    resizeMode: 'contain',
  },
  blogsCoverStyle: {
    height: 50,
    width: 80,
    marginEnd: 4,
  },
});
