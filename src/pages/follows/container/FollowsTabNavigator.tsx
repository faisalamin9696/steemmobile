import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useMemo} from 'react';
import RoundTopTabBar from '../../../components/basicComponents/RoundTopTabBar';
import {FollowsTabPage} from '..';

interface Props {
  navigation: any;
  route: any;
  account: string;
  isFollowing: boolean;
}

const FollowsTabNavigator = (props: Props) => {
  const {account, isFollowing} = props;

  const Tab = createMaterialTopTabNavigator();

  return useMemo(() => {
    return (
      <RoundTopTabBar initialRoute={isFollowing ? 'following' : 'follower'}>
        <Tab.Screen
          initialParams={{
            account: account,
            isFollowing: isFollowing,
            name: 'followers',
          }}
          name="followers"
          component={FollowsTabPage}
        />

        <Tab.Screen
          initialParams={{
            account: account,
            isFollowing: isFollowing,
            name: 'following',
          }}
          name="following"
          component={FollowsTabPage}
        />
      </RoundTopTabBar>
    );
  }, []);
};

export {FollowsTabNavigator};
