import MainWrapper from '../../../components/wrappers/MainWrapper';
import React, {useEffect} from 'react';
import {FollowsTabNavigator} from '..';

const FollowersPage = ({navigation, route}) => {
  const {account, isFollowing} = route.params;
  useEffect(() => {
    navigation.setOptions({
      title: account ?? 'Follows',
    });
  }, [navigation, account]);

  return (
    <MainWrapper>
      <FollowsTabNavigator
        account={account}
        isFollowing={isFollowing}
        navigation={navigation}
        route={route}
      />
    </MainWrapper>
  );
};

export {FollowersPage};
