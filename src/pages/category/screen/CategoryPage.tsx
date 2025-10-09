import {VStack} from '@react-native-material/core';
import React, {useEffect} from 'react';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {CategoryTabNavigator} from '..';

interface Props {
  navigation: any;
  route: any;
}

const CategoryPage = (props: Props) => {
  const {navigation, route} = props;

  const {category} = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: `#${category}`,
    });
  }, []);

  return (
    <MainWrapper>
      <VStack fill ph={4}>
        <CategoryTabNavigator {...props} />
      </VStack>
    </MainWrapper>
  );
};

export {CategoryPage};
