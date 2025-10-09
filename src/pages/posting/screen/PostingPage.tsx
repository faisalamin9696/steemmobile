import {AppBar, HStack, VStack} from '@react-native-material/core';
import {
  PureComponent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  TouchableOpacity,
  TextInput as TextInputRN,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Dialog,
  IconButton,
  MD2Colors,
  Text,
  TextInput,
} from 'react-native-paper';
import CardTextInput from '../../../components/basicComponents/CardTextInput';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import TagsFlatList from '../../../components/basicComponents/TagsFlatList';
import {AppColors} from '../../../constants/AppColors';
import {AppConstants} from '../../../constants/AppConstants';
import {getResizedAvatar} from '../../../utils/ImageApis';
import {
  DetectPromotionText,
  getAppVersionString,
  MakeQueryKey,
  closeActionSheet,
  countWords,
  validateTags,
} from '../../../utils/utils';
import CommunitiesModal from '../../../components/basicComponents/CommunitiesModal';
import {Snackbar} from 'react-native-paper';
import PreviewModal from '../../../components/basicComponents/PreviewModal';
import {useAppSelector} from '../../../constants/AppFunctions';
import {AppStrings} from '../../../constants/AppStrings';
import {
  createPatch,
  extractMetadata,
  generatePermlink,
  makeJsonMetadata,
  makeJsonMetadataForUpdate,
  makeOptions,
  validateCommentBody,
} from '../../../utils/editor';
import {getSimplePost} from '../../../steem/SteemApis';
import {BeneType} from '../../../components/basicComponents/BenefModal';
import {publishContent} from '../../../steem/CondenserApis';
import {
  getCredentials,
  getPostDraft,
  savePostDraft,
} from '../../../utils/realm';
import ConfirmationDialog from '../../../components/basicComponents/ConfirmationDialog';
import {
  RewardType,
  rewardTypes,
} from '../../../components/basicComponents/RewardModal';
import {parsePostMeta} from '../../../utils/user';
import VersionNumber from 'react-native-version-number';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {empty_draft} from '../../../utils/placeholders';
import {isAccountCommunity} from '../../../utils/CommunityValidation';
import {PostingBottomTray} from '..';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import moment from 'moment';
import {useDispatch} from 'react-redux';
import {savePostHandler} from '../../../redux/reducers/PostReducer';
import {MaterialDarkTheme, MaterialLightTheme} from '../../../utils/theme';

interface Props {
  navigation: any;
  route: any;
}
const PostingPage = (props: Props) => {
  const {navigation, route} = props;
  let {
    isEdit: edit,
    community: communityRef,
    comment: edData,
    commentKey,
  } = route.params;
  const isEdit = edit as boolean;
  const editData = edData as Post;
  const inputRef = useRef<any>(null);
  const bodySelectionRef = useRef({start: 0, end: 0});
  let draft = getPostDraft();
  let [titleInput, setTitleInput] = useState<string>(
    isEdit ? editData.title : draft.title,
  );
  let [tagInput, setTagInput] = useState<string>('');
  let [detailsInput, setDetailsInput] = useState<string>(
    isEdit ? editData.body : draft.body,
  );
  const [community, setCommunity] = useState<Community | undefined>(
    isEdit
      ? editData?.community && {
          title: editData.community,
          account: editData.category,
        }
      : communityRef ?? draft.community ?? undefined,
  );
  const [payoutMethod, setPyoutMethod] = useState<RewardType>(
    draft.reward ?? rewardTypes[1],
  );
  const [bene, setBene] = useState<BeneType[]>(
    draft.beneficiaries ?? undefined,
  );

  const [communityInput, setCommunityInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>(
    isEdit
      ? isAccountCommunity(editData.category)
        ? parsePostMeta(editData?.json_metadata)?.tags?.filter(
            item => item !== editData.category,
          ) || ''
        : parsePostMeta(editData?.json_metadata)?.tags
      : draft.tags ?? [],
  );
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const feedKey = MakeQueryKey(
    AppStrings.FEED_APIS.ACCOUNT_POSTS_FEED.API,
    'account',
    loginInfo.name,
  );

  const [confirmation, setConfirmation] = useState({open: false, body: <></>});
  const queryClient = useQueryClient();
  const [responseData, setResponseData] = useState({
    url: '',
    isPlaceholder: true,
    imgMd: '',
  });
  const [words, setWords] = useState(
    isEdit ? countWords(editData.body) : countWords(draft.body) ?? 0,
  );
  const [deleteSnack, setDeleteSnack] = useState(false);
  const [clear, setClear] = useState(false);
  const [previewModal, setShowPreviewModal] = useState(false);
  const [communityModal, setShowCommunityModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const {isThemeDark} = useContext(PreferencesContext);
  const [uploadingImage, setUploadingImage] = useState(false);
  const dispatch = useDispatch();

  const showPreview = () => setShowPreviewModal(true);
  const hidePreview = () => setShowPreviewModal(false);

  const showCommunities = () => setShowCommunityModal(true);
  const hideCommunities = () => setShowCommunityModal(false);

  useEffect(() => {
    bodySelectionRef.current = {start: 0, end: 0};
  }, []);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      if (!isEdit) {
        savePostDraft({
          ...draft,
          community: community,
          title: titleInput,
          body: detailsInput,
          tags: tags,
          beneficiaries: bene,
          reward: payoutMethod,
        });
      }
    }, 500);

    return () => {
      clearTimeout(timeOut);
    };
  }, [isEdit, community, titleInput, detailsInput, tags, bene, payoutMethod]);

  const postingMutation = useMutation({
    mutationFn: (data: {postData; credentials; options}) =>
      publishContent(data.postData, data.options, data.credentials.password),
    onSuccess(data, variables) {
      if (isEdit) {
        dispatch(
          savePostHandler({
            ...editData,
            title: titleInput,
            body: detailsInput,
            json_metadata: JSON.stringify(variables.postData.json_metadata),
            last_update: moment().unix(),
          }),
        );
      } else {
        queryClient.invalidateQueries({queryKey: [feedKey]});
      }
      AppConstants.SHOW_TOAST(
        isEdit ? 'Updated successfuly' : 'Published successfuly',
        '',
        'success',
      );
      clearForm();
      navigation.pop();
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
    onSettled() {
      setPosting(false);
    },
  });

  class HeaderRight extends PureComponent {
    render() {
      return (
        <HStack center spacing={4}>
          <IconButton
            onPress={showPreview}
            iconColor={AppColors.FACEBOOK}
            icon={'eye'}
          />
          {/* <Button
                uppercase
                compact
                contentStyle={{ height: 25 }}
                labelStyle={{
                    marginHorizontal: 8, marginVertical: 0, height: 20,
                    alignItems: 'center',
                    textAlign: 'center', fontSize: 12
                }}
                mode={'contained-tonal'}
                onPress={() => console.log('Pressed')}>
                Schedule
            </Button> */}

          {uploadingImage ? (
            <IconButton
              mode={'contained'}
              icon={() => <ActivityIndicator size={15} />}
              size={15}
            />
          ) : (
            <Button
              uppercase
              compact
              disabled={uploadingImage || postingMutation.isPending || posting}
              loading={uploadingImage || postingMutation.isPending || posting}
              contentStyle={{height: 25}}
              labelStyle={{
                marginHorizontal: 8,
                marginVertical: 0,
                height: 20,
                alignItems: 'center',
                textAlign: 'center',
                fontSize: 12,
              }}
              mode={'contained'}
              onPress={() => handlePublish()}>
              {isEdit ? 'Update' : 'Post'}
            </Button>
          )}
        </HStack>
      );
    }
  }
  // Toolbar Items update
  // useMemo(() => {
  //     navigation.setOptions({
  //         headerTitle: () => <Text variant='bodySmall'
  //             style={{ color: AppColors.LIGHT_GRAY }} >
  //             Words {words}</Text>,
  //         headerRight: () => (
  //             <HeaderRight />

  //         ),
  //     });
  // }, [uploadingImage, navigation, words, tags, payoutMethod, bene, titleInput, detailsInput,
  //     postingMutation.isPending, posting, community, isEdit, editData]);

  // Clear form on clear press
  function clearForm() {
    setTitleInput('');
    setTagInput('');
    handleDetailsChange('');
    setTags([]);
    setCommunityInput('');
    setCommunity(undefined);
    setBene([]);
    setClear(true);
    savePostDraft({...empty_draft()});
    setPyoutMethod(rewardTypes[1]);
    setTimeout(() => {
      setClear(false);
    }, 500);
  }

  // tag validation in press add
  const handleAddTag = () => {
    if (tagInput?.trim() !== '') {
      if (!tags.includes(tagInput?.trim())) {
        const tagsArray = tagInput?.trim()?.split(' ');
        const validation = validateTags(tagsArray);
        if (validation) {
          AppConstants.SHOW_TOAST('Invalid tag', validation, 'error');
          return;
        }
        const filtered = tagsArray.filter(
          (item, index) => tagsArray.indexOf(item) === index && item !== '',
        );
        setTags([...tags, ...filtered]);
        setTagInput('');
      } else {
        AppConstants.SHOW_TOAST('Duplicate tag', '', 'info');
      }
    }
  };

  const handleDeleteTag = (item: string) => {
    if (tags.length >= 1) {
      const newTags = tags.filter(i => {
        return i !== item;
      });
      setTags(newTags);
    }
  };

  const handleDetailsChange = text => {
    setDetailsInput(text);

    const count = countWords(text);
    if (count !== words) {
      setWords(count);
    }
  };

  const handleTitleChange = (text: string) => {
    setTitleInput(text);
  };

  // uploading image event
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

  const handleGalleryResponse = (
    url: string,
    isPlaceholder: boolean,
    imgMd: any,
  ) => {
    setResponseData({url, isPlaceholder, imgMd});
  };

  const handlePublish = () => {
    titleInput = titleInput?.trim();
    detailsInput = detailsInput?.trim();
    if (!titleInput) {
      AppConstants.SHOW_TOAST(
        'Invalid title',
        'Title can not be empty',
        'info',
      );
      return;
    }
    if (!detailsInput) {
      AppConstants.SHOW_TOAST(
        'Invalid description',
        'Description can not be empty',
        'info',
      );
      return;
    }
    if (tags.length <= 0) {
      AppConstants.SHOW_TOAST(
        'Invalid tags',
        'Add a tag or select community',
        'info',
      );
      return;
    }
    if (tags.length > 8) {
      AppConstants.SHOW_TOAST(
        'Limit reached',
        'Please use only 8 tags',
        'info',
      );
      return;
    }

    const limit_check = validateCommentBody(detailsInput, true);
    if (limit_check !== true) {
      AppConstants.SHOW_TOAST('Failed', limit_check, 'info');
      return;
    }

    const benefItem = (item: BeneType, index: number) => {
      return (
        <VStack mb={10} key={index ?? item.account}>
          <HStack items="center" justify="around">
            <HStack fill spacing={10}>
              <Avatar.Image
                size={25}
                style={{backgroundColor: 'white'}}
                source={{uri: getResizedAvatar(item.account)}}
              />

              <Text>{item.account}</Text>
            </HStack>

            <HStack fill items="center" justify="end" spacing={10}>
              <Text>{item.weight / 100}%</Text>
            </HStack>
          </HStack>
        </VStack>
      );
    };

    if (isEdit) {
      setConfirmation({
        open: true,
        body: <></>,
      });
    } else {
      setConfirmation({
        open: true,
        body: (
          <VStack spacing={10}>
            <HStack items="center">
              <Text variant="titleSmall">Category: </Text>
              <Text variant="bodySmall">
                {community
                  ? community.account === loginInfo.name
                    ? tags[0]
                    : community.account
                  : tags[0]}
              </Text>
            </HStack>

            {isAccountCommunity(community?.account) && (
              <HStack items="center">
                <Text variant="titleSmall">Community: </Text>
                <Text variant="bodySmall">
                  {community
                    ? community.account === loginInfo.name
                      ? tags[0]
                      : community.title
                    : tags[0]}
                </Text>
              </HStack>
            )}

            <HStack items="center">
              <Text variant="titleSmall">Payout: </Text>
              <Text variant="bodySmall">{payoutMethod.title}</Text>
            </HStack>

            {bene && bene?.length >= 1 && (
              <HStack items="start">
                <Text variant="titleSmall">Beneficiaries: </Text>
                <Dialog.ScrollArea>
                  <ScrollView
                    style={{maxHeight: 80}}
                    contentContainerStyle={{paddingHorizontal: 4}}>
                    {bene?.map((item, index) => benefItem(item, index))}
                  </ScrollView>
                </Dialog.ScrollArea>
              </HStack>
            )}
          </VStack>
        ),
      });
    }
  };

  const postConfirmation = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);

    setPosting(true);
    try {
      const meta = extractMetadata(detailsInput);
      let permlink = generatePermlink(titleInput || '');

      // check duplication
      if (!isEdit) {
        let simplePost: Post | undefined;
        simplePost = await getSimplePost(loginInfo.name, permlink);
        // if duplicate
        if (simplePost && simplePost.permlink === permlink) {
          permlink = generatePermlink(titleInput || '', true);
        }
      }

      const author = loginInfo.name;
      let options = makeOptions({
        author,
        permlink,
        operationType: payoutMethod?.payout,
        beneficiaries: bene,
      });

      // if post in the community

      let parent_permlink = tags?.[0] || '';
      if (community && community.account !== loginInfo.name) {
        parent_permlink = community.account;
      }

      const _tags = tags.filter(tag => tag && tag !== ' ');
      const jsonMeta = makeJsonMetadata(meta, _tags);
      const parentPermlink = isEdit
        ? editData.category
        : parent_permlink || 'steemmobile';
      const cbody = detailsInput.replace(
        /[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g,
        '',
      );

      let postData: PostingContent = {
        author: loginInfo,
        title: titleInput?.trim(),
        body: cbody?.trim(),
        parent_author: '',
        parent_permlink: parentPermlink,
        json_metadata: jsonMeta,
        permlink: permlink,
      };

      if (!DetectPromotionText(detailsInput))
        postData.body = postData.body + '\n\n' + AppStrings.PROMOTION_FOOTER;

      // check if post is edit
      if (isEdit) {
        const oldComment = editData;
        let newBody = cbody;

        if (!DetectPromotionText(detailsInput))
          newBody = newBody + '\n\n' + AppStrings.PROMOTION_FOOTER;

        const patch = createPatch(oldComment?.body, newBody?.trim());
        if (
          patch &&
          patch.length < Buffer.from(oldComment?.body, 'utf-8').length
        ) {
          newBody = patch;
        }
        let newTitle = titleInput?.trim();
        // const patch2 = createPatch(oldComment?.title, newTitle.trim());
        // if (patch2 && patch2.length < Buffer.from(oldComment?.title, "utf-8").length) {
        //     newTitle = patch2;
        // }
        const new_json_metadata = makeJsonMetadataForUpdate(
          {
            ...JSON.parse(oldComment.json_metadata),
            app: getAppVersionString(),
            format: 'markdown+html',
          },
          extractMetadata(cbody),
          tags,
        );
        postData.permlink = oldComment.permlink;
        postData.body = newBody;
        postData.title = newTitle;
        postData.json_metadata =
          new_json_metadata || JSON.parse(oldComment.json_metadata);
        options = undefined;
      }

      const credentials = await getCredentials();
      if (credentials) {
        postingMutation.mutate({postData, options, credentials});
      } else {
        AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
      }
    } catch (e) {
      AppConstants.SHOW_TOAST('Failed', String(e), 'error');
      setPosting(false);
    }
  };

  const bottomTray = useMemo(() => {
    return (
      <VStack>
        <PostingBottomTray
          navigation={navigation}
          isEdit={isEdit}
          disableAll={postingMutation.isPending || posting}
          selection={bodySelectionRef.current}
          handleEndPicked={() => {
            closeActionSheet(AppStrings.GALLERY_SHEET_ID);
          }}
          handleOnClear={() => {
            setDeleteSnack(true);
          }}
          handleSuccessfulUpload={(url, isPlaceholder, imgMd) => {
            handleGalleryResponse(url, isPlaceholder, imgMd);
          }}
          handleEndUploading={setUploadingImage}
          handleStartUploading={setUploadingImage}
          setClear={clear}
          handleBeneChange={data => {
            setBene(data);
          }}
          handleRewardChange={reward => {
            setPyoutMethod(reward);
          }}
          handleSnippet={(text: string) => {
            const _body =
              detailsInput.substring(0, bodySelectionRef.current['start']) +
              text +
              detailsInput.substring(
                bodySelectionRef.current['start'],
                detailsInput.length,
              );
            handleDetailsChange(_body);
          }}
        />
      </VStack>
    );
  }, [
    detailsInput,
    bodySelectionRef.current,
    clear,
    isEdit,
    postingMutation.isPending,
    posting,
  ]);

  const _handleOnSelectionChange = async event => {
    bodySelectionRef.current = event.nativeEvent.selection;
  };

  return (
    <MainWrapper>
      <AppBar
        color={
          isThemeDark
            ? MaterialDarkTheme.colors.background
            : MaterialLightTheme.colors.background
        }
        title={
          <Text variant="bodySmall" style={{color: AppColors.LIGHT_GRAY}}>
            Words {words}
          </Text>
        }
        titleStyle={{fontSize: 14}}
        subtitleStyle={{fontSize: 10}}
        leading={
          <IconButton
            icon={'arrow-left'}
            onPress={() => {
              navigation.pop();
            }}
          />
        }
        trailing={<HeaderRight />}
        trailingContainerStyle={{paddingEnd: 10}}
      />
      <VStack fill p={4}>
        <TouchableOpacity
          onPress={() => {
            if (!loginInfo.login) {
              AppConstants.SHOW_TOAST('Login to continue');
              return;
            }
            showCommunities();
          }}
          disabled={isEdit || postingMutation.isPending || posting}>
          <Card
            theme={{roundness: 2}}
            mode="contained"
            style={{
              marginVertical: 2,
              opacity: isEdit ? 0.7 : 1,
            }}>
            <Card.Content style={{paddingHorizontal: 2, paddingVertical: 2}}>
              <TextInput
                editable={false}
                mode="flat"
                value={communityInput}
                onChangeText={setCommunityInput}
                placeholder={community?.title || 'Select Community'}
                style={[{fontWeight: 'normal', height: 35}]}
                right={
                  <TextInput.Icon
                    disabled
                    color={MD2Colors.grey600}
                    style={{alignSelf: 'center'}}
                    icon={'menu-down'}
                  />
                }
                left={
                  <TextInput.Icon
                    disabled
                    icon={() => (
                      <Avatar.Image
                        style={{backgroundColor: 'white'}}
                        size={25}
                        source={{
                          uri:
                            getResizedAvatar(
                              community?.account || loginInfo.name,
                            ) || AppStrings.ERROR_404,
                        }}
                      />
                    )}
                  />
                }
                underlineStyle={{opacity: 0}}
              />
            </Card.Content>
          </Card>
        </TouchableOpacity>

        <ScrollView
          keyboardShouldPersistTaps={'always'}
          keyboardDismissMode="none">
          <VStack>
            <CardTextInput
              cardStyle={{marginTop: 5}}
              value={titleInput}
              onChangeText={handleTitleChange}
              placeholder="Title"
              inputStyle={{fontWeight: 'bold'}}
              maxLength={255}
              disabled={postingMutation.isPending || posting}
            />

            <CardTextInput
              cardStyle={{marginTop: 5}}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Tags (separate with space)"
              onSelectionChange={event => {
                _handleOnSelectionChange(event);
              }}
              disabled={postingMutation.isPending || posting}
              autoCapitalize="none"
              inputRight={
                <TextInput.Icon
                  size={20}
                  style={{alignSelf: 'center', marginTop: 10}}
                  onPress={handleAddTag}
                  icon={'plus-circle'}
                />
              }
            />

            {tags?.length >= 1 ? (
              <TagsFlatList
                tags={tags}
                disableDelete={postingMutation.isPending || posting}
                onDragEnd={newTags => {
                  setTags(newTags);
                }}
                onDelete={handleDeleteTag}
              />
            ) : null}
            {useMemo(() => {
              return (
                <TextInputRN
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
                    paddingBottom: 32,
                    paddingHorizontal: 16,
                    textAlignVertical: 'top',
                    maxHeight: undefined,
                    backgroundColor: MD2Colors.transparent,
                    color:
                      posting || postingMutation.isPending
                        ? MD2Colors.grey400
                        : isThemeDark
                        ? 'white'
                        : 'black',
                  }}
                  underlineColorAndroid={MD2Colors.transparent}
                  ref={inputRef}
                  keyboardAppearance={isThemeDark ? 'dark' : 'light'}
                  editable={!postingMutation.isPending || !posting}
                  placeholderTextColor={MD2Colors.grey400}
                />
              );
            }, [
              detailsInput,
              isThemeDark,
              !postingMutation.isPending,
              posting,
            ])}
          </VStack>
        </ScrollView>
        {bottomTray}
      </VStack>

      {isEdit ? null : communityModal ? (
        <CommunitiesModal
          visible={communityModal}
          setVisible={hideCommunities}
          onSelect={item => {
            setCommunity(item);
          }}
        />
      ) : null}
      <Snackbar
        visible={deleteSnack}
        onDismiss={() => setDeleteSnack(false)}
        duration={1500}
        action={{
          label: 'Reset all',
          onPress: () => {
            clearForm();
          },
        }}>
        Confirmation
      </Snackbar>

      <PreviewModal
        visible={previewModal}
        setVisible={hidePreview}
        title={titleInput}
        tags={tags}
        body={detailsInput}
      />

      <ConfirmationDialog
        username={loginInfo.name}
        primaryText={isEdit ? 'Update' : 'Post'}
        body={confirmation.body}
        visible={confirmation.open}
        setVisible={() => setConfirmation({...confirmation, open: false})}
        handlePrimaryClick={postConfirmation}
      />
    </MainWrapper>
  );
};

export {PostingPage};
