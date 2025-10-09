import React, {
  Fragment,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  PermissionsAndroid,
  Platform,
  View,
  Text,
  Linking,
} from 'react-native';
// Components
import {styles} from './PostHtmlRenderer';
import {AppConstants} from '../../../constants/AppConstants';
import {writeToClipboard} from '../../../utils/clipboard';
import {Button, IconButton, MD2Colors} from 'react-native-paper';
import ReactNativeBlobUtil from 'react-native-blob-util';
import ImageView from 'react-native-image-viewing';
import ActionSheet, {ActionSheetRef} from 'react-native-actions-sheet';
import VideoPlayer from './videoPlayer/videoPlayerView';
import {MaterialDarkTheme, MaterialLightTheme} from '../../../utils/theme';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {VStack} from '@react-native-material/core';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import {isAccountCommunity} from '../../../utils/CommunityValidation';
import {AppRoutes} from '../../../constants/AppRoutes';
import {empty_comment} from '../../../utils/placeholders';
import {getResizedImage} from '../../../utils/ImageApis';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  navigation: any;
}
export const PostHtmlInteractionHandler = forwardRef((props: Props, ref) => {
  const {navigation} = props;
  const [postImages, setPostImages] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<any>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<any>(null);
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const {isThemeDark} = useContext(PreferencesContext);
  const imageActionRef = useRef<ActionSheetRef>(null);
  const linkActionRef = useRef<ActionSheetRef>(null);
  const youtubeActionRef = useRef<ActionSheetRef>(null);

  const loadInBrowser = (link: string) => {
    Linking.openURL(link).catch(err =>
      console.error("Couldn't load page", err),
    );
  };

  useImperativeHandle(ref, () => ({
    handleImagePress: (url: string, postImgUrls: string[]) => {
      url = getResizedImage(url, 8000);
      setPostImages(postImgUrls);
      setSelectedImage(url);
      imageActionRef.current?.show();

      // openActionSheet(AppStrings.IMAGE_SHEET_ID + '1');
      // actionImage.current?.show();
    },
    handleLinkPress: (url: string) => {
      setSelectedLink(url);
      linkActionRef.current?.show();
      // openActionSheet(AppStrings.LINK_SHEET_ID + '1');
    },
    handleYoutubePress: (videoId, startTime) => {
      if (videoId) {
        setYoutubeVideoId(videoId);
        setVideoStartTime(startTime);
        // youtubePlayerRef.current.setModalVisible(true);
        youtubeActionRef.current?.show();
        // openActionSheet(AppStrings.YOUTUBE_VIDEO_SHEET_ID + '1')
      }
    },

    handleVideoPress: embedUrl => {
      if (embedUrl) {
        setVideoUrl(embedUrl);
        setVideoStartTime(0);
        // youtubePlayerRef.current.setModalVisible(true);
        youtubeActionRef.current?.show();
        // openActionSheet(AppStrings.YOUTUBE_VIDEO_SHEET_ID + '1')
      }
    },
    handleOnPostPress: (permlink, author) => {
      if (permlink) {
        // snippets checks if there is anchored post inside permlink and use that instead
        const anchoredPostRegex = /(.*?\#\@)(.*)\/(.*)/;
        const matchedLink = permlink.match(anchoredPostRegex);
        if (matchedLink) {
          author = matchedLink[2];
          permlink = matchedLink[3];
        }

        // check if permlink has trailing query param, remove that if is the case
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
    },

    handleOnUserPress: (username: string) => {
      if (username) {
        if (isAccountCommunity(username)) {
          navigation.push(AppRoutes.PAGES.CommunityPage, {category: username});
        } else
          navigation.push(AppRoutes.PAGES.ProfilePage, {account: username});
        // dispatch(showProfileModal(username));
      } else {
        AppConstants.SHOW_TOAST('Wrong link', '', 'error');
      }
    },
    handleTagPress: (category: string, FILTER) => {
      if (category) {
        const is_community = isAccountCommunity(category);
        const name = is_community
          ? AppRoutes.PAGES.CommunityPage
          : AppRoutes.PAGES.CategoryPage;
        const KEY = `${FILTER}/${category}`;
        navigation.push(name, {
          category,
          FILTER,
          KEY,
        });
      }
    },
  }));

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
          // closeActionSheet(AppStrings.IMAGE_SHEET_ID + '1');
          AppConstants.SHOW_TOAST('Image saved', '', 'success');
        })
        .catch(error => {
          AppConstants.SHOW_TOAST('Image save faied', String(error), 'error');
        });
    } catch (error) {
      AppConstants.SHOW_TOAST('Image save error', String(error), 'error');
    }
  };

  const _handleImageOptionPress = ind => {
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
      // save to local
      _saveImage(selectedImage);
    }

    setSelectedImage(null);
  };

  const _handleLinkOptionPress = ind => {
    if (ind === 1) {
      // open link
      if (selectedLink) {
        loadInBrowser(selectedLink);
        // navigation.navigate({
        //   name: AppRoutes.PAGES.BrowserPage,
        //   params: {
        //     url: selectedLink,
        //   },
        //   key: selectedLink,
        // });
      }
    }
    if (ind === 0) {
      // copy to clipboard
      writeToClipboard(selectedLink).then(() => {
        AppConstants.SHOW_TOAST('Copied', '', 'success');
      });
    }
    linkActionRef.current?.hide();
    // closeActionSheet(AppStrings.LINK_SHEET_ID);
    setSelectedLink(null);
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
      {isImageModalOpen ? (
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
      ) : null}

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
              _handleImageOptionPress(0);
            }}>
            Copy Link
          </Button>

          <Button
            mode="contained"
            onPress={() => {
              _handleImageOptionPress(1);
            }}>
            Gallery View
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              _handleImageOptionPress(2);
            }}>
            Save Image
          </Button>
          <Button
            mode="text"
            onPress={() => {
              imageActionRef.current?.hide();
              // closeActionSheet(AppStrings.IMAGE_SHEET_ID + '1')
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
              _handleLinkOptionPress(0);
            }}>
            Copy Link
          </Button>

          <Button
            mode="contained"
            onPress={() => {
              _handleLinkOptionPress(1);
            }}>
            Open External Link
          </Button>

          <Button
            mode="text"
            onPress={() => {
              linkActionRef.current?.hide();
              // closeActionSheet(AppStrings.LINK_SHEET_ID + '1')
            }}>
            Cancel
          </Button>
        </VStack>
      </ActionSheet>

      <ActionSheet
        ref={youtubeActionRef}
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
    </Fragment>
  );
});
