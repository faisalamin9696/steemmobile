import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useMemo} from 'react';
import {AppStrings} from '../../../constants/AppStrings';
import RoundTopTabBar from '../../../components/basicComponents/RoundTopTabBar';
import {ProfileTabPage} from '..';
import {WalletInfo, WalletInfoNavigator} from '../../wallet';

interface Props {
  data: AccountExt;
  navigation: any;
  route: any;
  onTabChange?: (isWallet: boolean) => void;
}
const ProfileTabNavigator = (props: Props) => {
  const {data, onTabChange} = props;
  const Tab = createMaterialTopTabNavigator();

  return useMemo(() => {
    return (
      <RoundTopTabBar initialRoute="Blogs">
        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.PROFILE_BLOGS_FEED.API,
            account: data.name,
            type: AppStrings.FEED_APIS.PROFILE_BLOGS_FEED.TYPE,
          }}
          name="Blogs"
          component={ProfileTabPage}
        />

        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.PROFILE_POSTS_FEED.API,
            account: data.name,
            type: AppStrings.FEED_APIS.PROFILE_POSTS_FEED.TYPE,
          }}
          name="Posts"
          component={ProfileTabPage}
        />

        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.ACCOUNT_COMMENTS_FEED.API,
            account: data.name,
            type: AppStrings.FEED_APIS.ACCOUNT_COMMENTS_FEED.TYPE,
          }}
          name="Comments"
          component={ProfileTabPage}
        />

        <Tab.Screen
          initialParams={{
            feed_api: AppStrings.FEED_APIS.ACCOUNT_REPLIES_FEED.API,
            account: data.name,
            type: AppStrings.FEED_APIS.ACCOUNT_REPLIES_FEED.TYPE,
          }}
          name="Replies"
          component={ProfileTabPage}
        />

        <Tab.Screen
          name="Wallet"
          children={() => {
            onTabChange && onTabChange(true);
            return <WalletInfoNavigator {...props} />;
          }}
        />
      </RoundTopTabBar>
    );
  }, [data]);
};

export {ProfileTabNavigator};
