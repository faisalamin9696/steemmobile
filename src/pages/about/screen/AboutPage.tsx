import MainWrapper from '../../../components/wrappers/MainWrapper';
import {Card, MD2Colors, Text} from 'react-native-paper';
import {VStack} from '@react-native-material/core';
import AboutItem from '../../../components/basicComponents/AboutItem';
import {NativeScrollEvent} from 'react-native';
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useState} from 'react';
import {getAppVersionString} from '../../../utils/utils';
import {AppConstants} from '../../../constants/AppConstants';

const AboutPage = ({navigation}) => {
  const translateY = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const isScrolling = useSharedValue(false);

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

  const onLayout = event => {
    const {height} = event.nativeEvent.layout;
    setHeaderHeight(height + 10);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: NativeScrollEvent) => {
      const currentScrollPosition = Math.floor(event?.contentOffset?.y) ?? 0;
      // setIsExtended(currentScrollPosition <= 0);
      translateY.value = currentScrollPosition > 0 ? headerHeight : 0;
    },
    onBeginDrag: e => {
      isScrolling.value = true;
    },
    onEndDrag: e => {
      isScrolling.value = false;
    },
  });

  return (
    <MainWrapper>
      <VStack fill ph={10} items="center">
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
          <Card
            theme={{roundness: 2}}
            mode="contained"
            style={{backgroundColor: MD2Colors.red300}}>
            <Card.Content>
              <VStack center spacing={6}>
                <Text variant="titleLarge" style={{color: 'white'}}>
                  About Us
                </Text>

                <Text
                  variant="bodySmall"
                  style={{textAlign: 'center', color: 'white'}}>
                  SteemMobile is the Steem blockchain's decentralized mobile and
                  web app solution. It will allow the end user to perform all
                  broadcast operations easily and securely with some additional
                  benefits.
                </Text>
              </VStack>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.FlatList
          style={{width: '100%'}}
          overScrollMode="never"
          contentContainerStyle={{
            paddingBottom: headerHeight,
            paddingTop: headerHeight + 10,
          }}
          onScroll={scrollHandler}
          keyExtractor={item => `${item.name}`}
          data={AppConstants.STEEMMOBILE_TEAM}
          renderItem={({item}) => {
            return <AboutItem navigation={navigation} item={item} />;
          }}
          ListFooterComponent={() => (
            <Text style={{alignSelf: 'center', opacity: 0.4, padding: 10}}>
              {getAppVersionString()}
            </Text>
          )}
        />
      </VStack>
    </MainWrapper>
  );
};
export {AboutPage};
