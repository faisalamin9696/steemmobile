import React, {useLayoutEffect} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
// navigation

// ui context
import RNBootSplash from 'react-native-bootsplash';
import LottieView from 'lottie-react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import {MD2Colors, Text} from 'react-native-paper';
import {setItemToStorage} from '../../../utils/realm';
import {AppRoutes} from '../../../constants/AppRoutes';
import {VStack} from '@react-native-material/core';

const data = [
  {
    title: 'Welcome',
    text: 'Your Gateway to the Steem Blockchain',
    bg: MD2Colors.red400,
    lottie: require('../../../../assets/anim/hello_anim.json'),
  },
  {
    title: 'Web 3.0',
    text: 'Unleash the Power of Steem Blockchain',
    bg: MD2Colors.teal300,
    lottie: require('../../../../assets/anim/blockchain_anim.json'),
  },
  {
    title: 'Fast and Secure',
    text: 'Experience Fast and Secure Mobile App',
    bg: MD2Colors.blue300,
    lottie: require('../../../../assets/anim/secure_anim.json'),
  },
];

type Item = (typeof data)[0];

interface Props {
  navigation: any;
  route: any;
}
const AppIntroPage = (props: Props) => {
  const {navigation} = props;

  useLayoutEffect(() => {
    console.log(1122)
    RNBootSplash.isVisible().then(() => {
      RNBootSplash.hide({fade: true});
    });
  }, []);

  const _onDone = () => {
    setItemToStorage('app-intro', '1');
    navigation.replace(AppRoutes.DRAWER.HomeDrawer);
  };
  const _renderItem = ({item}: {item: Item}) => {
    return (
      <VStack
        items="center"
        fill
        justify="center"
        style={[
          {
            backgroundColor: item.bg,
          },
        ]}>
        <LottieView
          style={styles.lottieStyle}
          loop
          autoPlay
          source={item.lottie}
        />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>{item.text}</Text>
      </VStack>
    );
  };

  const _keyExtractor = (item: Item) => item.title;

  return (
    <View style={{flex: 1}}>
      <StatusBar hidden backgroundColor="transparent" translucent />
      <AppIntroSlider
        keyExtractor={_keyExtractor}
        renderItem={_renderItem}
        onDone={_onDone}
        data={data}
      />
    </View>
  );
};

export {AppIntroPage};
const styles = StyleSheet.create({
  image: {
    width: 150,
    height: 150,
  },
  text: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: 'white',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 15,
  },
  lottieStyle: {
    height: 200,
    width: 200,
    alignSelf: 'center',
  },
});
