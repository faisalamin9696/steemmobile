import {LayoutChangeEvent, TouchableOpacity, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {VStack} from '@react-native-material/core';
import getWindowDimensions from '../../../../utils/getWindowDimensions';
import {useState} from 'react';
import {TranslateText} from '../../../../utils/utils';
import {AppRoutes} from '../../../../constants/AppRoutes';
import {empty_comment} from '../../../../utils/placeholders';
import {CommentHeader} from '../../../../components/comment';

interface Props {
  comment: Post;
  navigation: any;
  route: any;
  translateY: SharedValue<number>;
  onLayout: (event: LayoutChangeEvent) => void;
  onTranslated?: (translation: {
    translated: boolean;
    title: string;
    body: string;
  }) => void;
  feed_api: string;
  type: any;
  account: string | undefined;
}
const WIDTH = getWindowDimensions().width;

const DetailsHeader = (props: Props) => {
  const {
    comment,
    navigation,
    translateY,
    onLayout,
    onTranslated,
    type,
    feed_api,
  } = props;
  const IS_TYPED: boolean | undefined = comment
    ? comment.depth >= 1
    : undefined;

  const [translation, setTranslation] = useState({
    translated: false,
    title: comment?.title ?? '',
    body: comment?.body ?? '',
  });

  const handleTranslate = async () => {
    if (!translation.translated) {
      const spliting_sign = '\n~~~~~\n';
      const new_title = (IS_TYPED ? comment?.root_title : comment?.title) || '';
      const new_body = (IS_TYPED ? comment?.body : comment?.body) || '';
      const long_string = new_title + spliting_sign + new_body;
      TranslateText(long_string).then(res => {
        const splitted = res?.split(spliting_sign);
        if (splitted) {
          setTranslation({
            translated: true,
            title: splitted[0],
            body: splitted[1]?.replace('< /a>', '</a>'),
          });
          if (onTranslated)
            onTranslated({
              translated: true,
              title: splitted[0],
              body: splitted[1]?.replace('< /a>', '</a>'),
            });
        }
      });
    }
  };

  const headerAction = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(-translateY.value, {
            duration: 500,
            easing: Easing.ease,
          }),
        },
      ],
    };
  });

  const handleFullContextClick = () => {
    navigation.push(AppRoutes.PAGES.CommentDetailPage, {
      type: type,
      comment: {...empty_comment(comment?.root_author, comment?.root_permlink)},
      feed_api: feed_api,
    });
  };
  const handleParentClick = () => {
    navigation.push(AppRoutes.PAGES.CommentDetailPage, {
      type: type,
      comment: {
        ...empty_comment(comment?.parent_author, comment?.parent_permlink),
      },
      feed_api: feed_api,
    });
  };

  return (
    <Animated.View
      style={[
        headerAction,
        {
          width: '100%',
          position: 'absolute',
          top: 10,
          zIndex: 1,
        },
      ]}
      onLayout={onLayout}>
      <Card theme={{roundness: 4}} mode="contained">
        <Card.Content style={{paddingVertical: 4, paddingHorizontal: 10}}>
          <VStack spacing={20}>
            {IS_TYPED ? (
              <VStack spacing={4}>
                <VStack>
                  <Text variant="bodySmall">{`You are viewing a single comment's thread from:`}</Text>
                  <Text selectable variant="titleMedium">{`RE: ${
                    translation.translated
                      ? translation.title
                      : comment.root_title || ''
                  }`}</Text>
                </VStack>

                <TouchableOpacity onPress={handleFullContextClick}>
                  <Text variant="labelSmall">• View the full context</Text>
                </TouchableOpacity>

                {comment?.parent_permlink !== comment?.root_permlink && (
                  <TouchableOpacity onPress={handleParentClick}>
                    <Text variant="labelSmall">• View the direct parent</Text>
                  </TouchableOpacity>
                )}
              </VStack>
            ) : null}

            <View>
              <CommentHeader
                {...props}
                comment={comment}
                isDetail
                handleTranslate={handleTranslate}
              />
            </View>
            {IS_TYPED ? null : (
              <Text
                selectable
                variant="titleMedium"
                style={{
                  fontWeight: '700',
                  width: WIDTH - 32,
                  marginTop: -10,
                  paddingBottom: 2,
                }}>
                {translation.translated
                  ? translation.title
                  : comment?.title || ''}
              </Text>
            )}
          </VStack>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

export {DetailsHeader};
