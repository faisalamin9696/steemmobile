import * as Animatable from 'react-native-animatable';
import {StyleSheet} from 'react-native';
import {Card} from 'react-native-paper';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {CommentFooter} from '../../../../components/comment';
import {useDispatch} from 'react-redux';
import {savePostHandler} from '../../../../redux/reducers/PostReducer';

interface Props {
  comment: Post;
  navigation: any;
  route: any;
  handleCommentClick?: () => void;
  translateY: SharedValue<number>;
  feed_api: string;
  type: any;
  account: string | undefined;
  rootComment: Post;
  isPostLoading?: boolean;
}
const DetailsFooter = (props: Props) => {
  const {comment, handleCommentClick, translateY} = props;
  const dispatch = useDispatch();
  const footerAction = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(translateY.value, {
            duration: 500,
            easing: Easing.ease,
          }),
        },
      ],
    };
  });

  const onPostUpdate = (newComment: Feed | Post) => {
    dispatch(savePostHandler(newComment));
    // console.log('Post Updated', newComment.author, newComment.permlink);
  };

  return (
    <Animatable.View style={[styles.footer]} animation="fadeInUp">
      <Animated.View style={[footerAction, styles.footer]}>
        <Card
          mode="contained"
          theme={{roundness: 4}}
          style={[styles.footerCard]}>
          <CommentFooter
            {...props}
            rewardAnchorPosition="top"
            comment={comment}
            handleCommentClick={() => {
              if (handleCommentClick) handleCommentClick();
            }}
            handleOnUpdate={onPostUpdate}
          />
        </Card>
      </Animated.View>
    </Animatable.View>
  );
};

export {DetailsFooter};
const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    bottom: 10,
    left: 0,
    right: 0,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.8,
    // shadowRadius: 2,
    // elevation: 4,
    backgroundColor: 'transparent',
  },
  footerCard: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
});
