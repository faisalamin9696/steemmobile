import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useMemo} from 'react';
import {AppStrings} from '../../../constants/AppStrings';
import RoundTopTabBar from '../../../components/basicComponents/RoundTopTabBar';
import {AccountCommunityTabPage} from './AccountCommunityTabPage';
import {AccountTabPage} from './AccountTabPage';

interface Props {
  navigation: any;
  route: any;
  isAccount?: boolean;
}
const AccountTabNavigator = (props: Props) => {
  const {isAccount} = props;
  const Tab = createMaterialTopTabNavigator();

  return useMemo(() => {
    return (
      <RoundTopTabBar initialRoute="Posts">
        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.PROFILE_BLOGS_FEED.API,
            isAccount: isAccount,
            type: AppStrings.FEED_APIS.PROFILE_BLOGS_FEED.TYPE,
          }}
          name="Blogs"
          component={AccountTabPage}
        />

        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.ACCOUNT_FRIENDS_FEED.API,
            type: AppStrings.FEED_APIS.ACCOUNT_FRIENDS_FEED.TYPE,
            isAccount: isAccount,
          }}
          name="Friends"
          component={AccountTabPage}
        />

        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.ACCOUNT_POSTS_FEED.API,
            type: AppStrings.FEED_APIS.ACCOUNT_POSTS_FEED.TYPE,
            isAccount: isAccount,
          }}
          name="Posts"
          component={AccountTabPage}
        />

        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.ACCOUNT_COMMENTS_FEED.API,
            type: AppStrings.FEED_APIS.ACCOUNT_COMMENTS_FEED.TYPE,
            isAccount: isAccount,
          }}
          name="Comments"
          component={AccountTabPage}
        />

        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.ACCOUNT_REPLIES_FEED.API,
            type: AppStrings.FEED_APIS.ACCOUNT_REPLIES_FEED.TYPE,
            isAccount: isAccount,
          }}
          name="Replies"
          component={AccountTabPage}
        />

        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.ACCOUNT_COMMUNITIES_FEED.API,
            type: AppStrings.FEED_APIS.ACCOUNT_COMMUNITIES_FEED.TYPE,
            isAccount: isAccount,
          }}
          name="Communities"
          component={AccountCommunityTabPage}
        />
      </RoundTopTabBar>
    );
  }, []);
};

export {AccountTabNavigator};
