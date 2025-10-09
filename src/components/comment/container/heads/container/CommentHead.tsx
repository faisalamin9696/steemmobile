import React, {useState} from 'react';
import {AppRoutes} from '../../../../../constants/AppRoutes';
import {Card, MD2Colors, Text, Tooltip} from 'react-native-paper';
import {HStack} from '@react-native-material/core';
import BadgeAvatar from '../../../../basicComponents/BadgeAvatar';
import {View} from 'react-native';
import TimeAgoWrapper from '../../../../wrappers/TimeAgoWrapper';
import ContentEditedWrapper from '../../../../wrappers/ContentEditedWrapper';
import {CommentMenu} from '../../CommentMenu';
import {AuthorTitleCard} from '../../../../basicComponents/AuthorTitleCard';
import CommunityWrapper from '../../../../wrappers/CommunityWrapper';
import Icon, {Icons} from '../../../../Icons';
import SimplePreviewModal from '../../../../basicComponents/SimplePreviewModal';

interface Props {
  navigation: any;
  route: any;
  comment: Feed | Post;
  isDetail?: boolean;
  isReply?: boolean;
  isCommunity?: boolean;
  handleTranslate?: (body: string) => void;
  handleResteem?: (item: Post | Feed) => void;
  isSearch?: boolean;
}

const CommentHead = (props: Props) => {
  let {navigation, comment, isDetail, isCommunity, route} = props;
  const {account} = route?.params || {account: '', feed_api: '', type: ''};
  const [copyModal, setCopyModal] = useState({open: false, body: ''});

  const handleAvatarClick = () => {
    if (account !== comment?.author)
      navigation.push(AppRoutes.PAGES.ProfilePage, {account: comment?.author});
  };

  return (
    <Card.Title
      style={{paddingLeft: 0, minHeight: 0, paddingRight: 0}}
      leftStyle={{
        alignItems: 'center',
        marginLeft: 4,
        marginRight: 10,
      }}
      left={() => (
        <BadgeAvatar
          {...props}
          name={comment?.author}
          reputation={comment?.author_reputation || 25}
          handleAvatarClick={handleAvatarClick}
        />
      )}
      rightStyle={{position: 'absolute', right: -10, top: -5}}
      right={() => (
        <CommentMenu
          {...props}
          handleCopyText={body => {
            setCopyModal({body: body, open: true});
          }}
        />
      )}
      title={
        <HStack items="center" spacing={4}>
          <Text variant="labelMedium">{comment?.author}</Text>

          <Text
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              opacity: 0.75,
            }}
            variant={'labelSmall'}>
            {comment?.author_role || 'guest'}
          </Text>
          <View>
            <AuthorTitleCard title={comment?.author_title} />
          </View>
        </HStack>
      }
      titleStyle={{fontWeight: 'bold'}}
      titleVariant="bodyLarge"
      subtitleVariant="bodySmall"
      subtitleStyle={{marginTop: -5}}
      subtitle={
        <HStack spacing={4} items="center">
          {!isCommunity && (
            <View>
              <CommunityWrapper {...props} />
            </View>
          )}

          <View>
            <TimeAgoWrapper date={comment?.created * 1000} />
          </View>
          <HStack spacing={6}>
            <View>
              {isDetail && (
                <View>
                  <ContentEditedWrapper
                    createDate={comment?.created * 1000}
                    updateDate={comment?.last_update * 1000}
                  />
                </View>
              )}
            </View>
            {!comment.promoted && comment?.is_pinned ? (
              <Icon
                type={Icons.Entypo}
                name={'pin'}
                color={MD2Colors.red400}
                size={15}
                style={{marginStart: 4}}
              />
            ) : null}

            <View>
              {!isDetail && comment.promoted ? (
                <Tooltip title="Promoted">
                  <Text>{comment.promoted ? '🎉' : ''}</Text>
                </Tooltip>
              ) : null}
            </View>
          </HStack>

          <SimplePreviewModal
            visible={copyModal.open}
            setVisible={() => setCopyModal({body: copyModal.body, open: false})}
            body={copyModal.body}
          />
        </HStack>
      }
    />
  );
};

export {CommentHead};
