import React, {memo, useContext, useMemo, useRef} from 'react';
import RenderHTML, {
  CustomRendererProps,
  Element,
  TNode,
} from 'react-native-render-html';
import {useHtmlIframeProps, iframeModel} from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';
import {ScrollView} from 'react-native-gesture-handler';
// import { prependChild, removeElement } from 'htmlparser2/node_modules/domutils';
import {LinkData, parseLinkData} from './linkDataParser';
import VideoThumb from './videoThumb';
import VideoPlayer from './videoPlayer/videoPlayerView';
import {AutoHeightImage} from '../../../utils/autoHeightImage';
import {Platform, StyleSheet} from 'react-native';
import {MD2Colors, MD2DarkTheme, MD2LightTheme} from 'react-native-paper';
import {PreferencesContext} from '../../../contexts/ThemeContext';

interface PostHtmlRendererProps {
  contentWidth: number;
  body: string;
  metadata: string;
  isComment?: boolean;
  onLoaded?: () => void;
  setSelectedImage: (imgUrl: string, postImageUrls: string[]) => void;
  setSelectedLink: (url: string) => void;
  handleOnPostPress: (permlink: string, authro: string) => void;
  handleOnUserPress: (username: string) => void;
  handleTagPress: (tag: string, filter?: string) => void;
  handleVideoPress: (videoUrl: string) => void;
  handleYoutubePress: (videoId: string, startTime: number) => void;
  textSelectable?: boolean;
}

export const PostHtmlRenderer = memo(
  ({
    contentWidth,
    body,
    metadata,
    isComment,
    onLoaded,
    setSelectedImage,
    setSelectedLink,
    handleOnPostPress,
    handleOnUserPress,
    handleTagPress,
    handleVideoPress,
    handleYoutubePress,
    textSelectable,
  }: PostHtmlRendererProps) => {
    const postImgUrlsRef = useRef<string[]>([]);
    const {isThemeDark} = useContext(PreferencesContext);

    body = body
      .replace(/<center>/g, '<div class="text-center">')
      .replace(/<\/center>/g, '</div>')
      .replace(/<span(.*?)>/g, '')
      .replace(/<\/span>/g, '');

    const _minTableColWidth = contentWidth / 3 - 12;

    const _handleOnLinkPress = (data: LinkData) => {
      if (!data) {
        return;
      }

      const {
        type,
        href,
        author,
        permlink,
        tag,
        youtubeId,
        startTime,
        filter,
        videoHref,
        community,
      }: any = data;

      try {
        switch (type) {
          case '_external':
          case 'markdown-external-link':
            setSelectedLink(href);
            break;
          case 'markdown-author-link':
            if (handleOnUserPress) {
              handleOnUserPress(author);
            }
            break;
          case 'markdown-post-link':
            if (handleOnPostPress) {
              handleOnPostPress(permlink, author);
            }
            break;
          case 'markdown-tag-link':
            if (handleTagPress) {
              handleTagPress(tag, filter);
            }
            break;

          case 'markdown-video-link':
            if (handleVideoPress) {
              handleVideoPress(videoHref);
            }
            break;
          case 'markdown-video-link-youtube':
            if (handleYoutubePress) {
              handleYoutubePress(youtubeId, startTime);
            }

            break;

          // unused cases
          case 'markdown-witnesses-link':
            setSelectedLink(href);
            break;

          case 'markdown-proposal-link':
            setSelectedLink(href);
            break;

          case 'markdown-community-link':
            // tag press also handles community by default
            if (handleTagPress) {
              handleTagPress(community, filter);
            }
            break;

          default:
            break;
        }
      } catch (error) {}
    };

    const getMaxImageWidth = (tnode: TNode) => {
      // return full width if not parent exist
      if (!tnode.parent || tnode.parent.tagName === 'body') {
        return contentWidth;
      }

      // return divided width based on number td tags
      if (tnode.parent.tagName === 'td' || tnode.parent.tagName === 'th') {
        const cols: any = tnode?.parent?.parent?.children.length;
        return contentWidth / cols;
      }

      return getMaxImageWidth(tnode.parent);
    };

    const _onElement = (element: Element) => {
      if (element.tagName === 'img' && element.attribs.src) {
        const imgUrl = element.attribs.src;
        // console.log('img element detected', imgUrl);
        if (!postImgUrlsRef.current.includes(imgUrl)) {
          postImgUrlsRef.current.push(imgUrl);
        }
      }

      if (element.tagName === 'table') {
        // console.log('table detected');

        element.children.forEach((child: any) => {
          if (child.name === 'tr') {
            let headerIndex = -1;
            let colIndex = -1;

            child.children.forEach((gChild, index) => {
              // check if element of row in table is not a column while it's other siblings are columns
              if (gChild.type === 'tag') {
                if (gChild.name !== 'td' && headerIndex === -1) {
                  headerIndex = index;
                } else if (colIndex === -1) {
                  colIndex = index;
                }
              }
            });

            if (
              headerIndex !== -1 &&
              colIndex !== -1 &&
              headerIndex < colIndex
            ) {
              // console.log('time to do some switching', headerIndex, colIndex);
              const header = child.children[headerIndex];
              const headerRow = new Element('tr', {}, [header]);
            }
          }
        });
      }
    };

    const _anchorRenderer = ({
      InternalRenderer,
      tnode,
      ...props
    }: CustomRendererProps<TNode>) => {
      const parsedTnode = parseLinkData(tnode);
      const _onPress = () => {
        const data: any = parseLinkData(tnode);
        // console.log('Link Pressed:', data);

        _handleOnLinkPress(data);
      };

      // process video link
      if (tnode.classes?.indexOf('markdown-video-link') >= 0) {
        if (isComment) {
          const imgElement = tnode.children.find(child => {
            return child.classes.indexOf('video-thumbnail') > 0;
          });
          if (!imgElement) {
            return (
              <VideoThumb contentWidth={contentWidth} onPress={_onPress} />
            );
          }
        } else {
          return (
            <VideoPlayer
              mode={parsedTnode?.youtubeId ? 'youtube' : 'uri'}
              contentWidth={contentWidth}
              uri={parsedTnode?.videoHref}
              youtubeVideoId={parsedTnode?.youtubeId}
              startTime={parsedTnode?.startTime}
              disableAutoplay={true}
            />
          );
        }
      }

      if (tnode.children.length === 1 && tnode.children[0].tagName === 'img') {
        const maxImgWidth = getMaxImageWidth(tnode);
        return (
          <AutoHeightImage
            contentWidth={maxImgWidth}
            imgUrl={tnode.children[0].attributes.src}
            metadata={metadata}
            isAnchored={false}
            activeOpacity={1}
            onPress={_onPress}
          />
        );
      }

      return <InternalRenderer tnode={tnode} onPress={_onPress} {...props} />;
    };

    const _imageRenderer = ({tnode}: CustomRendererProps<TNode>) => {
      const imgUrl = tnode.attributes.src;
      const _onPress = () => {
        // console.log('Image Pressed:', imgUrl);
        setSelectedImage(imgUrl, postImgUrlsRef.current);
      };

      const isVideoThumb = tnode.classes?.indexOf('video-thumbnail') >= 0;
      const isAnchored = tnode.parent?.tagName === 'a';

      if (isVideoThumb) {
        return <VideoThumb contentWidth={contentWidth} uri={imgUrl} />;
      } else {
        const maxImgWidth = getMaxImageWidth(tnode);
        return (
          <AutoHeightImage
            contentWidth={maxImgWidth}
            imgUrl={imgUrl}
            metadata={metadata}
            isAnchored={isAnchored}
            onPress={_onPress}
          />
        );
      }
    };

    /**
     * the para renderer is designd to remove margins from para
     * if it's a direct child of li tag as the added margin causes
     * a weired misalignment of bullet and content
     * @returns Default Renderer
     */
    const _paraRenderer = ({
      TDefaultRenderer,
      ...props
    }: CustomRendererProps<TNode>) => {
      props.style =
        props?.tnode?.parent?.tagName === 'li' ? styles.pLi : styles.p;

      return <TDefaultRenderer {...props} />;
    };

    // based on number of columns a table have, sets scroll enabled or disable, also adjust table full width
    const _tableRenderer = ({
      InternalRenderer,
      ...props
    }: CustomRendererProps<TNode>) => {
      // const tableProps = useHtmlTableProps(props);

      let maxColumns = 0;
      props.tnode.children.forEach(
        child =>
          (maxColumns =
            child.children.length > maxColumns
              ? child.children.length
              : maxColumns),
      );

      const isScrollable = maxColumns > 3;
      const _tableWidth = isScrollable
        ? maxColumns * _minTableColWidth
        : contentWidth;
      props.style = {width: _tableWidth};

      return (
        <ScrollView horizontal={true} scrollEnabled={isScrollable}>
          <InternalRenderer {...props} />
        </ScrollView>
      );
    };

    // iframe renderer for rendering iframes in body
    const _iframeRenderer = function IframeRenderer(props) {
      const iframeProps: any = useHtmlIframeProps(props);

      if (isComment) {
        const _onPress = () => {
          // console.log('iframe thumb Pressed:', iframeProps);
          if (handleVideoPress) {
            handleVideoPress(iframeProps.source.uri);
          }
        };
        return <VideoThumb contentWidth={contentWidth} onPress={_onPress} />;
      } else {
        return (
          <VideoPlayer
            mode="uri"
            uri={iframeProps.source.uri}
            contentWidth={contentWidth}
          />
        );
      }
    };

    const tagsStyles = useMemo(
      () => ({
        a: styles.a,
        img: styles.img,
        table: {...styles.table},
        tr: {...styles.tr, width: contentWidth}, // center tag causes tr to have 0 width if not exclusivly set, contentWidth help avoid that
        th: {
          ...styles.th,
          minWidth: _minTableColWidth,
          backgroundColor: isThemeDark
            ? MD2DarkTheme.colors.background
            : MD2LightTheme.colors.background,
        },
        td: {
          ...styles.td,
          minWidth: _minTableColWidth,
          backgroundColor: isThemeDark
            ? MD2DarkTheme.colors.background
            : MD2LightTheme.colors.background,
        },
        div: {...styles.div, maxWidth: contentWidth}, // makes sure width covers the available horizontal space for view and not exceed the contentWidth if parent bound id not defined
        blockquote: styles.blockquote,
        code: {
          ...styles.code,
          backgroundColor: isThemeDark
            ? MD2DarkTheme.colors.background
            : MD2LightTheme.colors.background,
          color: isThemeDark
            ? MD2DarkTheme.colors.text
            : MD2LightTheme.colors.text,
        },
        li: styles.li,
        p: {...styles.p},
        h6: {...styles.h6},
      }),
      [contentWidth],
    );

    const baseStyle = useMemo(
      () => ({
        ...styles.baseStyle,
        color: isThemeDark ? 'white' : 'black',
        width: contentWidth,
      }),
      [contentWidth],
    );

    const classesStyles = useMemo(
      () => ({
        phishy: {...styles.phishy},
        'text-justify': styles.textJustify,
        'text-center': styles.textCenter,
      }),
      [],
    );

    const renderers: any = useMemo(
      () => ({
        img: _imageRenderer,
        a: _anchorRenderer,
        p: _paraRenderer,
        iframe: _iframeRenderer,
        table: _tableRenderer,
      }),
      [],
    );

    const domVisitors = useMemo(
      () => ({
        onElement: _onElement,
      }),
      [],
    );

    const customHTMLElementModels = useMemo(
      () => ({
        iframe: iframeModel,
      }),
      [],
    );

    const renderersProps = useMemo(
      () => ({
        iframe: {
          scalesPageToFit: true,
        },
      }),
      [],
    );

    return (
      <RenderHTML
        source={{html: body}}
        contentWidth={contentWidth}
        baseStyle={baseStyle}
        classesStyles={classesStyles}
        tagsStyles={tagsStyles}
        domVisitors={domVisitors}
        renderers={renderers}
        onHTMLLoaded={onLoaded && onLoaded}
        defaultTextProps={{
          selectable: true,
        }}
        customHTMLElementModels={customHTMLElementModels}
        renderersProps={renderersProps}
        WebView={WebView}
      />
    );
  },
  (next, prev) => next.body === prev.body,
);

export const styles = StyleSheet.create({
  baseStyle: {
    color: MD2Colors.grey500,
    fontFamily: 'Roboto',
    fontSize: 16,
    marginBottom: 4,
  },
  body: {
    color: MD2Colors.grey500,
  },
  div: {
    width: '100%',
  },
  p: {
    marginTop: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  h6: {
    fontSize: 14,
  },
  pLi: {
    marginTop: 0,
    marginBottom: 0,
  },
  a: {
    color: '#357ce6',
  },
  img: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: 'red',
  },
  th: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    backgroundColor: '#c1c5c7',
    fontSize: 14,
    padding: 10,
  },
  tr: {
    flexDirection: 'row',
    fontWeight: 'normal',
  },
  td: {
    flex: 1,
    borderWidth: 0.5,
    padding: 10,
    borderColor: '#FFFFFF',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  table: {
    width: '100%',
  },
  li: {
    marginBottom: 12,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderStyle: 'solid',
    marginLeft: 5,
    paddingLeft: 5,
    borderColor: '#c1c5c7',
  },
  code: {
    width: '100%',
    padding: 6,
    fontSize: 12,
    borderRadius: 3,
    backgroundColor: '#F4F4F4',
    fontFamily: 'RobotoMono-Regular',
    fontWeight: 'normal',
  },
  textCenter: {
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  phishy: {
    color: '#e63535',
  },
  textJustify: {
    // textAlign: 'justify',
    textAlign: Platform.select({
      ios: 'justify',
      android: 'auto',
    }), //justify with selectable on android causes ends of text getting clipped,
    letterSpacing: 0,
  },
  revealButton: {
    backgroundColor: '#c1c5c7',
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    minWidth: 40,
    maxWidth: 170,
  },
  revealText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  videoThumb: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c1c5c7',
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: MD2Colors.grey500,
  },
  closeIconButton: {
    position: 'absolute',
    right: 0,
  },
  imageViewerHeaderContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
