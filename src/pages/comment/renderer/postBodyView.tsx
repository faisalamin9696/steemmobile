import React, {Fragment, useState, useEffect, useContext, useRef} from 'react';
import {
  PermissionsAndroid,
  Platform,
  View,
  Text,
  Linking,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import ReactNativeBlobUtil from 'react-native-blob-util';
// Constants
import {writeToClipboard} from '../../../utils/clipboard';
import {AppConstants} from '../../../constants/AppConstants';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {AppStrings} from '../../../constants/AppStrings';
import {PostHtmlRenderer, styles} from './PostHtmlRenderer';
import getWindowDimensions from '../../../utils/getWindowDimensions';
import {Button, IconButton, MD2Colors} from 'react-native-paper';
import ActionSheet, {ActionSheetRef} from 'react-native-actions-sheet';
import {MaterialDarkTheme, MaterialLightTheme} from '../../../utils/theme';
import VideoPlayer from './videoPlayer/videoPlayerView';
import {VStack} from '@react-native-material/core';
import {AppRoutes} from '../../../constants/AppRoutes';
import {isAccountCommunity} from '../../../utils/CommunityValidation';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import {empty_comment} from '../../../utils/placeholders';
import {getResizedImage} from '../../../utils/ImageApis';
import { SafeAreaView } from 'react-native-safe-area-context';

const WIDTH = getWindowDimensions().width;

const PostBody = ({
  body,
  metadata,
  onLoadEnd,
  width,
  navigation,
  route,
  textSelectable = false,
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [postImages, setPostImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [html, setHtml] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<any>(null);
  const [videoStartTime, setVideoStartTime] = useState(0);
  const {isThemeDark} = useContext(PreferencesContext);
  const imageActionRef = useRef<ActionSheetRef>(null);
  const linkActionRef = useRef<ActionSheetRef>(null);
  const youtubeActionRef = useRef<ActionSheetRef>(null);

  useEffect(() => {
    if (body) {
      setHtml(body.replace(/<a/g, '<a target="_blank"'));
    }
  }, [body]);

  const loadInBrowser = (link: string) => {
    Linking.openURL(link).catch(err =>
      console.error("Couldn't load page", err),
    );
  };
  const _handleYoutubePress = (videoId, startTime) => {
    if (videoId) {
      setYoutubeVideoId(videoId);
      setVideoStartTime(startTime);
      youtubeActionRef.current?.show();
      // openActionSheet(AppStrings.YOUTUBE_PLAYER_SHEET_ID);
      // youtubePlayerRef.current.setModalVisible(true);
    }
  };

  const _handleVideoPress = embedUrl => {
    if (embedUrl) {
      setVideoUrl(embedUrl);
      setVideoStartTime(0);
      youtubeActionRef.current?.show();
      // openActionSheet(AppStrings.YOUTUBE_PLAYER_SHEET_ID);
    }
  };

  const handleImagePress = ind => {
    if (ind === 1) {
      // open gallery mode
      setIsImageModalOpen(true);
    }
    if (ind === 0) {
      // copy to clipboard
      writeToClipboard(selectedImage).then(() => {
        AppConstants.SHOW_TOAST('Copied', '', 'success');
      });
    }
    if (ind === 2) {
      _saveImage(selectedImage);
    }

    setSelectedImage(null);
  };

  const handleLinkPress = ind => {
    if (ind === 1) {
      if (selectedLink) {
        loadInBrowser(selectedLink);
      }
    }
    if (ind === 0) {
      writeToClipboard(selectedImage).then(() => {
        AppConstants.SHOW_TOAST('Copied', '', 'success');
      });
    }
    linkActionRef.current?.hide();

    // closeActionSheet(AppStrings.LINK_SHEET_ID);
    setSelectedLink(null);
  };

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

  const _handleOnPostPress = (permlink, author) => {
    if (permlink) {
      const anchoredPostRegex = /(.*?\#\@)(.*)\/(.*)/;
      const matchedLink = permlink.match(anchoredPostRegex);
      if (matchedLink) {
        author = matchedLink[2];
        permlink = matchedLink[3];
      }

      const queryIndex = permlink.lastIndexOf('?');
      if (queryIndex > -1) {
        permlink = permlink.substring(0, queryIndex);
      }

      navigation.push(AppRoutes.PAGES.CommentDetailPage, {
        type: 'profie',
        comment: empty_comment(author, permlink),
        feed_api: 'getAccounPost',
      });
    }
  };

  const _handleOnUserPress = (username: string) => {
    if (username) {
      if (isAccountCommunity(username)) {
        navigation.push(AppRoutes.PAGES.CommunityPage, {category: username});
      } else navigation.push(AppRoutes.PAGES.ProfilePage, {account: username});
    } else {
      AppConstants.SHOW_TOAST('Wrong link', '', 'error');
    }
  };

  const checkAndroidPermission = async () => {
    try {
      const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
      await PermissionsAndroid.request(permission);
      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  };

  const _downloadImage = async uri => {
    return ReactNativeBlobUtil.config({
      fileCache: true,
      appendExt: 'jpg',
    })
      .fetch('GET', uri)
      .then(res => {
        const {status} = res.info();

        if (status == 200) {
          return res.path();
        } else {
          Promise.reject();
        }
      })
      .catch(errorMessage => {
        Promise.reject(errorMessage);
      });
  };

  const _saveImage = async uri => {
    try {
      uri = getResizedImage(uri, 8000);
      if (Platform.OS === 'android') {
        await checkAndroidPermission();
        uri = `file://${await _downloadImage(uri)}`;
      }
      CameraRoll.saveAsset(uri)
        .then(() => {
          imageActionRef.current?.hide();
          // closeActionSheet(AppStrings.IMAGE_SHEET_ID);
          AppConstants.SHOW_TOAST('Image saved', '', 'success');
        })
        .catch(error => {
          AppConstants.SHOW_TOAST('Image save faied', String(error), 'error');
        });
    } catch (error) {
      AppConstants.SHOW_TOAST('Image save error', String(error), 'error');
    }
  };

  const _handleLoadEnd = () => {
    if (onLoadEnd) {
      onLoadEnd();
    }
  };

  const _handleSetSelectedLink = link => {
    setSelectedLink(link);
    linkActionRef.current?.show();
    // openActionSheet(AppStrings.LINK_SHEET_ID);
  };

  const _handleSetSelectedImage = (imageLink, postImgUrls) => {
    imageLink = getResizedImage(imageLink, 8000);

    if (postImages.length !== postImgUrls.length) {
      setPostImages(postImgUrls);
    }
    setSelectedImage(imageLink);
    console.log(imageActionRef.current);
    imageActionRef.current?.show();
    // openActionSheet(AppStrings.IMAGE_SHEET_ID);
  };

  const _renderImageViewerHeader = imageIndex => {
    return (
      <SafeAreaView
        style={{
          marginTop: Platform.select({ios: 0, android: 25}),
        }}>
        <View style={styles.imageViewerHeaderContainer}>
          <Text style={{color: 'white'}}>{`${imageIndex + 1}/${
            postImages.length
          }`}</Text>
          <IconButton
            icon={'close'}
            iconColor="white"
            style={styles.closeIconButton}
            size={20}
            onPress={() => setIsImageModalOpen(false)}
          />
        </View>
      </SafeAreaView>
    );
  };

  return (
    <Fragment>
      <ImageView
        images={postImages.map(url => ({uri: url}))}
        imageIndex={0}
        visible={isImageModalOpen}
        animationType="slide"
        swipeToCloseEnabled
        onRequestClose={() => setIsImageModalOpen(false)}
        HeaderComponent={imageIndex =>
          _renderImageViewerHeader(imageIndex.imageIndex)
        }
      />

      <ActionSheet
        ref={imageActionRef}
        statusBarTranslucent={false}
        gestureEnabled={true}
        drawUnderStatusBar={false}
        indicatorStyle={{backgroundColor: MD2Colors.grey300}}
        containerStyle={{
          paddingHorizontal: 12,
          backgroundColor: isThemeDark
            ? MaterialDarkTheme.colors.background
            : MaterialLightTheme.colors.background,
          minHeight: 250,
        }}
        springOffset={50}
        defaultOverlayOpacity={0.3}
        onClose={() => {
          setYoutubeVideoId(null);
          setVideoUrl(null);
        }}>
        <VStack spacing={10}>
          <Button
            mode="contained"
            onPress={() => {
              handleImagePress(0);
            }}>
            Copy Link
          </Button>

          <Button
            mode="contained"
            onPress={() => {
              handleImagePress(1);
            }}>
            Gallery View
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              handleImagePress(2);
            }}>
            Save Image
          </Button>
          <Button
            mode="text"
            onPress={() => {
              imageActionRef.current?.hide();
              // closeActionSheet(AppStrings.IMAGE_SHEET_ID)
            }}>
            Cancel
          </Button>
        </VStack>
      </ActionSheet>

      <ActionSheet
        ref={linkActionRef}
        statusBarTranslucent={false}
        gestureEnabled={true}
        drawUnderStatusBar={false}
        indicatorStyle={{backgroundColor: MD2Colors.grey300}}
        containerStyle={{
          paddingHorizontal: 12,
          backgroundColor: isThemeDark
            ? MaterialDarkTheme.colors.background
            : MaterialLightTheme.colors.background,
          minHeight: 200,
        }}
        springOffset={50}
        defaultOverlayOpacity={0.3}
        onClose={() => {
          setYoutubeVideoId(null);
          setVideoUrl(null);
        }}>
        <VStack spacing={10}>
          <Button
            mode="contained"
            onPress={() => {
              handleLinkPress(0);
            }}>
            Copy Link
          </Button>

          <Button
            mode="contained"
            onPress={() => {
              handleLinkPress(1);
            }}>
            Open External Link
          </Button>

          <Button
            mode="text"
            onPress={() => {
              linkActionRef.current?.hide();

              // closeActionSheet(AppStrings.LINK_SHEET_ID)
            }}>
            Cancel
          </Button>
        </VStack>
      </ActionSheet>

      <ActionSheet
        ref={youtubeActionRef}
        id={AppStrings.YOUTUBE_VIDEO_SHEET_ID}
        statusBarTranslucent={false}
        gestureEnabled={true}
        drawUnderStatusBar={false}
        indicatorStyle={{backgroundColor: MD2Colors.grey300}}
        containerStyle={{
          paddingHorizontal: 12,
          backgroundColor: isThemeDark
            ? MaterialDarkTheme.colors.background
            : MaterialLightTheme.colors.background,
          minHeight: 200,
        }}
        springOffset={50}
        defaultOverlayOpacity={0.3}
        onClose={() => {
          setYoutubeVideoId(null);
          setVideoUrl(null);
        }}>
        <VideoPlayer
          mode={youtubeVideoId ? 'youtube' : 'uri'}
          youtubeVideoId={youtubeVideoId}
          uri={videoUrl}
          startTime={videoStartTime}
        />
      </ActionSheet>
      <View style={{alignItems: 'center'}}>
        <PostHtmlRenderer
          body={html}
          metadata={metadata}
          contentWidth={width || WIDTH - 10}
          onLoaded={_handleLoadEnd}
          setSelectedImage={_handleSetSelectedImage}
          setSelectedLink={_handleSetSelectedLink}
          handleOnPostPress={_handleOnPostPress}
          handleOnUserPress={_handleOnUserPress}
          handleTagPress={_handleTagPress}
          handleVideoPress={_handleVideoPress}
          handleYoutubePress={_handleYoutubePress}
          textSelectable={textSelectable}
        />
      </View>
    </Fragment>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.body === nextProps.body) {
    return true;
  }
  return false;
};

export default React.memo(PostBody, areEqual);
