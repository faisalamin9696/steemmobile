import {HStack, VStack} from '@react-native-material/core';
import {useContext, useEffect, useRef, useState} from 'react';
import {
  Button,
  Card,
  IconButton,
  MD2Colors,
  Snackbar,
} from 'react-native-paper';
import PreviewModal from '../../../components/basicComponents/PreviewModal';
import {closeActionSheet, getUniqueItems} from '../../../utils/utils';
import ImagePickerButton from '../../../components/basicComponents/ImagePickerButton';
import {AppStrings} from '../../../constants/AppStrings';
import {useAppSelector} from '../../../constants/AppFunctions';
import {
  createPatch,
  extractMetadata,
  generateReplyPermlink,
  makeJsonMetadata,
  makeJsonMetadataReply,
  validateCommentBody,
} from '../../../utils/editor';
import {
  getCommentDraft,
  getCredentials,
  removeItemFromStorage,
  saveCommentDraft,
} from '../../../utils/realm';
import {publishContent} from '../../../steem/CondenserApis';
import {AppConstants} from '../../../constants/AppConstants';
import moment from 'moment';
import getWindowDimensions from '../../../utils/getWindowDimensions';
import {
  ActivityIndicator,
  LayoutAnimation,
  NativeSyntheticEvent,
  StyleProp,
  TextInput,
  TextInputFocusEventData,
  View,
  ViewStyle,
} from 'react-native';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {AppRoutes} from '../../../constants/AppRoutes';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import Icon, {Icons} from '../../../components/Icons';
import SnippetsModal from '../../../components/basicComponents/SinppetsModal';
import UsersListModal from '../../../components/basicComponents/UsersListModal';
import {useDispatch} from 'react-redux';
import {saveCommentHandler} from '../../../redux/reducers/CommentReducer';
import {saveRepliesHandler} from '../../../redux/reducers/RepliesReducer';

const {width} = getWindowDimensions();

interface Props {
  comment: Post;
  navigation: any;
  route: any;
  handleOnComment?: () => void;
  handleOnError?: (e) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  isEdit: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  rootComment: Post | Feed;
}
const CommentPosting = (props: Props) => {
  const {comment, navigation, handleOnComment, onFocus, isEdit, rootComment} =
    props;
  const inputRef = useRef<any>(null);
  const bodySelectionRef = useRef({start: 0, end: 0});
  const draft = getCommentDraft(comment.permlink);

  let [detailsInput, setDetailsInput] = useState(
    isEdit ? comment.body : draft ?? '',
  );
  const [showPreview, setShowPreview] = useState(false);
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const [posting, setPosting] = useState(false);
  const {isThemeDark} = useContext(PreferencesContext);
  const [snipModal, setSnipModal] = useState(false);
  const showSnipModal = () => setSnipModal(true);
  const hideSnipModal = () => setSnipModal(false);
  const [usersModal, setUsersModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const dispatch = useDispatch();
  const [isAdLoaded, setAdLoaded] = useState(false);

  const postReplies =
    useAppSelector(state => state.repliesReducer.values)[
      `${rootComment.author}/${rootComment.permlink}`
    ] ?? [];

  const [responseData, setResponseData] = useState({
    url: '',
    isPlaceholder: true,
    imgMd: '',
  });
  const [deleteSnack, setDeleteSnack] = useState(false);

  function handleDetailsChange(text) {
    setDetailsInput(text);
  }


  useEffect(() => {
    return () => {
      if (!isEdit) {
        if (!detailsInput)
          removeItemFromStorage(
            AppStrings.COMMENT_DRAFT + '_' + comment.permlink,
          );
        else saveCommentDraft(comment.permlink, detailsInput);
      }
    };
  }, [isEdit, detailsInput]);

  const handleGalleryResponse = (
    url: string,
    isPlaceholder: boolean,
    imgMd: any,
  ) => {
    setResponseData({url, isPlaceholder, imgMd});
  };
  function clearForm() {
    detailsInput = '';
    handleDetailsChange('');
    setPosting(false);
  }

  const _handleOnSelectionChange = async event => {
    bodySelectionRef.current = event.nativeEvent.selection;
  };

  function handleOnPublish(newChanges: Post) {
    const time = moment().unix();

    let newComment;

    if (isEdit) {
      // edit version
      newComment = {
        ...newChanges,
        ...comment,
        last_update: time,
        body: newChanges.body,
      };
    } else {
      newComment = newChanges;
    }
    if (isEdit) {
      dispatch(saveCommentHandler({...newComment}));
    } else {
      // update the redux state for the post
      dispatch(
        saveCommentHandler({
          ...rootComment,
          children: rootComment?.children + 1,
        }),
      );

      // update the redux state for the current comment
      dispatch(
        saveCommentHandler({...comment, children: comment?.children + 1}),
      );

      // update the redux state for the root post replies
      dispatch(
        saveRepliesHandler({
          comment: rootComment,
          replies: [newComment].concat(postReplies),
        }),
      );
    }
  }
  const handlePublish = async () => {
    if (!detailsInput) {
      AppConstants.SHOW_TOAST('Empty body', '', 'info');
      return;
    }

    const limit_check = validateCommentBody(detailsInput, false);
    if (limit_check !== true) {
      AppConstants.SHOW_TOAST('Failed', limit_check, 'info');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);

    setPosting(true);

    let permlink = generateReplyPermlink(comment.author);

    const postData: PostingContent = {
      author: loginInfo,
      title: '',
      body: detailsInput,
      parent_author: comment.author,
      parent_permlink: comment.permlink,
      json_metadata: makeJsonMetadataReply('steemmobile'),
      permlink: permlink,
    };

    // if (!DetectPromotionText(detailsInput))
    //     postData.body = postData.body + '\n\n' + AppStrings.PROMOTION_FOOTER;

    const cbody = detailsInput.replace(
      /[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g,
      '',
    );

    // check if post is edit
    if (isEdit) {
      const oldComment = comment;
      let newBody = cbody;
      // if (!DetectPromotionText(newBody))
      //     newBody = newBody + '\n\n' + AppStrings.PROMOTION_FOOTER;
      const patch = createPatch(oldComment?.body, newBody?.trim());
      if (
        patch &&
        patch.length < Buffer.from(oldComment?.body, 'utf-8').length
      ) {
        newBody = patch;
      }
      const meta = extractMetadata(detailsInput);
      const new_json_metadata = makeJsonMetadata(meta, []);
      postData.permlink = oldComment.permlink;
      postData.body = newBody;
      postData.json_metadata =
        new_json_metadata || JSON.parse(oldComment.json_metadata);
      postData.parent_author = oldComment.parent_author;
      postData.parent_permlink = oldComment.parent_permlink;
    }

    const time = moment().unix();
    // let newComment;
    // // if the update then use the old data
    // if (isEdit) {
    //     newComment = {
    //         ...postData,
    //         ...comment,
    //         last_update: time,
    //         body: detailsInput,
    //         is_new: 1
    //     }
    // } else {
    //     newComment = {
    //         link_id: time,
    //         created: time,
    //         last_update: time,

    //         ...postData,
    //         body: detailsInput,
    //         author: loginInfo.name,
    //         depth: comment.depth + 1,
    //         payout: 0,
    //         upvote_count: 0,
    //         observer_vote: 0,
    //         category: comment.category,
    //         author_reputation: loginInfo.reputation,
    //         author_role: comment.observer_role ?? '',
    //         author_title: comment.observer_title ?? '',
    //         observer_title: comment.observer_title ?? '',
    //         observer_role: comment.observer_role ?? '',
    //         root_author: rootComment.author,
    //         root_permlink: rootComment.permlink,
    //         root_title: comment.root_title,
    //         net_rshares: 0,
    //         children: 0,
    //         observer_vote_percent: 0,
    //         resteem_count: 0,
    //         observer_resteem: 0,
    //         replies: [],
    //         votes: [],
    //         downvote_count: 0,
    //         is_new: 1

    //     }
    // }
    // if (!newComment.body.includes(AppStrings.PROMOTION_FOOTER))
    //     newComment.body = newComment.body + '\n\n' + AppStrings.PROMOTION_FOOTER;
    // try {
    //     setTimeout(() => {
    //         clearForm();
    //         handleOnPublish(newComment);
    //         handleOnComment && handleOnComment();
    //     }, 2500);

    // } catch (e) {
    //     setPosting(false);
    //     console.error('Comment Error', e)
    // }

    // return

    // add promotional footer.
    const credentials = await getCredentials();
    if (credentials) {
      publishContent(postData, null, credentials.password)
        .then(result => {
          if (result) {
            let newComment;
            // if the update then use the old data
            if (isEdit) {
              newComment = {
                ...postData,
                ...comment,
                last_update: time,
                body: detailsInput,
                is_new: 1,
              };
            } else {
              newComment = {
                link_id: time,
                created: time,
                last_update: time,

                ...postData,
                body: detailsInput,
                author: loginInfo.name,
                depth: comment.depth + 1,
                payout: 0,
                upvote_count: 0,
                observer_vote: 0,
                category: comment.category,
                author_reputation: loginInfo.reputation,
                author_role: comment.observer_role ?? '',
                author_title: comment.observer_title ?? '',
                observer_title: comment.observer_title ?? '',
                observer_role: comment.observer_role ?? '',
                root_author: rootComment.author,
                root_permlink: rootComment.permlink,
                root_title: comment.root_title,
                net_rshares: 0,
                children: 0,
                observer_vote_percent: 0,
                resteem_count: 0,
                observer_resteem: 0,
                replies: [],
                votes: [],
                downvote_count: 0,
                cashout_time: moment().add(5, 'days').unix(),
                is_new: 1,
              };
            }

            clearForm();
            handleOnPublish(newComment);
            handleOnComment && handleOnComment();
            AppConstants.SHOW_TOAST(isEdit ? 'Updated' : 'Sent', '', 'success');
          } else {
            AppConstants.SHOW_TOAST('Failed', '', 'error');
          }
        })
        .catch(error => {
          AppConstants.SHOW_TOAST('Failed', String(error), 'error');
        })
        .finally(() => {
          setPosting(false);
        });
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
      setPosting(false);
    }
  };

  useEffect(() => {
    if (responseData.url) {
      if (responseData.isPlaceholder) {
        const _body =
          detailsInput.substring(0, bodySelectionRef.current['start']) +
          responseData.url +
          detailsInput.substring(
            bodySelectionRef.current['start'],
            detailsInput.length,
          );
        handleDetailsChange(_body);
      } else {
        if (responseData.imgMd) {
          const _body = detailsInput.replace(
            responseData.url,
            responseData.imgMd,
          );
          handleDetailsChange(_body);
        }
      }
    }
  }, [responseData]);

  const handleOpenSnippet = () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }
    showSnipModal();
  };

  const handleOpenUsers = () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }
    setUsersModal(!usersModal);
  };

  const users = getUniqueItems([comment.author, rootComment.author]).concat(
    getUniqueItems(
      extractMetadata(rootComment.body + ' ' + comment.body)?.users,
    )?.filter(item => item !== comment.author || item !== rootComment.author),
  );

  const handleDetailsUpdate = (change: string) => {
    const _body =
      detailsInput.substring(0, bodySelectionRef.current['start']) +
      change +
      detailsInput.substring(
        bodySelectionRef.current['start'],
        detailsInput.length,
      );
    handleDetailsChange(_body);
  };
  return (
    <VStack
      pb={50}
      style={[
        {
          width: comment.depth
            ? width - 10 - (40 * (comment.depth - rootComment.depth)) / 2
            : width - 10,
        },
      ]}>
      <Card style={{margin: 4}}>
        <Card.Content
          style={{
            paddingVertical: 0,
            paddingHorizontal: 0,
          }}>
          <VStack>
            <TextInput
              onFocus={onFocus}
              multiline={true}
              autoCorrect={false}
              value={detailsInput}
              onChangeText={handleDetailsChange}
              onSelectionChange={event => {
                _handleOnSelectionChange(event);
              }}
              placeholder="Write something..."
              selectionColor="#357ce6"
              style={{
                flex: 1,
                fontSize: 14,
                marginTop: 5,
                paddingTop: 10,
                paddingBottom: 10,
                paddingHorizontal: 16,
                textAlignVertical: 'top',
                maxHeight: 150,
                backgroundColor: MD2Colors.transparent,
                color: posting
                  ? MD2Colors.grey400
                  : isThemeDark
                  ? 'white'
                  : 'black',
                minHeight: 80,
              }}
              underlineColorAndroid={MD2Colors.transparent}
              ref={inputRef}
              keyboardAppearance={isThemeDark ? 'dark' : 'light'}
              editable={!posting}
              placeholderTextColor={MD2Colors.grey400}
            />

            <HStack items="center" pe={4} justify="between">
              <HStack items="center" spacing={0}>
                <IconButton
                  style={{marginVertical: 0}}
                  mode={'contained-tonal'}
                  onPress={() => setDeleteSnack(true)}
                  disabled={posting}
                  icon={() => (
                    <Icons.MaterialCommunityIcons
                      size={20}
                      name="delete"
                      color={MD2Colors.red400}
                    />
                  )}
                  size={15}
                  iconColor={MD2Colors.red400}
                />

                <ImagePickerButton
                  style={{marginVertical: 0}}
                  disabled={posting}
                  buttonMode={'contained-tonal'}
                  iconSize={15}
                  innerIconSize={20}
                  handleEndPicked={() => {
                    closeActionSheet(AppStrings.GALLERY_SHEET_ID);
                  }}
                  handleStartUploading={setUploadingImage}
                  handleEndUploading={setUploadingImage}
                  handleSuccessfulUpload={(url, isPlaceholder, imgMd) => {
                    handleGalleryResponse(url, isPlaceholder, imgMd);
                  }}
                />

                <IconButton
                  mode={'contained-tonal'}
                  icon={() => (
                    <Icon
                      size={20}
                      type={Icons.MaterialCommunityIcons}
                      name={'format-list-text'}
                      color={MD2Colors.blue600}
                      style={{}}
                    />
                  )}
                  size={15}
                  disabled={posting}
                  onPress={handleOpenSnippet}
                />
                <IconButton
                  mode={'contained-tonal'}
                  icon={() => (
                    <Icon
                      size={20}
                      type={Icons.MaterialCommunityIcons}
                      name={'at'}
                      color={MD2Colors.teal400}
                      style={{}}
                    />
                  )}
                  size={15}
                  disabled={posting}
                  onPress={handleOpenUsers}
                />

                <IconButton
                  style={{marginVertical: 0}}
                  mode={'contained-tonal'}
                  onPress={() => setShowPreview(true)}
                  icon={() => (
                    <Icons.MaterialCommunityIcons
                      size={20}
                      name="eye"
                      color={
                        isThemeDark ? MD2Colors.grey400 : MD2Colors.blueGrey800
                      }
                    />
                  )}
                  size={15}
                  disabled={posting}
                />
              </HStack>

              <HStack items="center" spacing={10}>
                <View>
                  {loginInfo.login ? (
                    <BadgeAvatar
                      handleAvatarClick={() => {
                        navigation.navigate(AppRoutes.PAGES.AccountsPage);
                      }}
                      disabled={posting}
                      avatarSize={25}
                      name={loginInfo.name}
                    />
                  ) : null}
                </View>

                {uploadingImage ? (
                  <IconButton
                    mode={'contained'}
                    icon={() => <ActivityIndicator size={15} />}
                    size={15}
                  />
                ) : (
                  <Button
                    contentStyle={{flexDirection: 'row-reverse'}}
                    mode="contained"
                    compact
                    labelStyle={{marginVertical: 2, fontSize: 14}}
                    icon={'send'}
                    loading={posting}
                    disabled={posting}
                    onPress={handlePublish}>
                    {isEdit ? 'Update' : 'Send'}
                  </Button>
                )}
              </HStack>
            </HStack>
          </VStack>

          <Snackbar
            visible={deleteSnack}
            onDismiss={() => setDeleteSnack(false)}
            duration={1500}
            action={{
              label: 'Clear All',
              onPress: () => {
                clearForm();
              },
            }}>
            Confirmation
          </Snackbar>
        </Card.Content>
      </Card>

      {snipModal ? (
        <SnippetsModal
          navigation={navigation}
          visible={snipModal}
          setVisible={hideSnipModal}
          onSelect={snip => {
            handleDetailsUpdate(snip.body);
          }}
        />
      ) : null}

      {showPreview ? (
        <PreviewModal
          visible={showPreview}
          setVisible={setShowPreview}
          title={''}
          body={detailsInput}
          tags={[]}
        />
      ) : null}

      {usersModal ? (
        <UsersListModal
          visible={usersModal}
          setVisible={setUsersModal}
          usersData={users}
          onSelect={username => {
            handleDetailsUpdate('@' + username);
          }}
        />
      ) : null}
    </VStack>
  );
};

export {CommentPosting};
