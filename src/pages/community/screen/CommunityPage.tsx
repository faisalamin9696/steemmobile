import {VStack} from '@react-native-material/core';
import React, {useEffect} from 'react';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {CommunityHeader, CommunityTabNavigator} from '..';
import {View} from 'react-native';

interface Props {
  navigation: any;
  route: any;
}

const CommunityPage = (props: Props) => {
  const {navigation, route} = props;

  const {category} = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: category,
    });
  }, []);

  return (
    <MainWrapper>
      <VStack fill ph={4}>
        <View>
          <CommunityHeader {...props} />
        </View>
        <VStack fill justify="start">
          <CommunityTabNavigator {...props} />
        </VStack>
      </VStack>
    </MainWrapper>
  );
};

export {CommunityPage};
