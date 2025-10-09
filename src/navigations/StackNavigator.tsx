import 'react-native-gesture-handler';
import React, {useContext} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AppRoutes} from '../constants/AppRoutes';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {IconButton, Text} from 'react-native-paper';
import {MaterialDarkTheme} from '../utils/theme';
import {PreferencesContext} from '../contexts/ThemeContext';
import {Icons} from '../components/Icons';
import {AppBarHeader, DrawerContent} from '.';
import PostingPage from '../pages/posting';
import BottomTabNavigator from './BottomTabNavigator';
import AboutPage from '../pages/about';
import CategoryPage from '../pages/category';
import ProfilePage from '../pages/profile';
import LoginPage from '../pages/authentication';
import CommunityPage from '../pages/community';
import SearchPage from '../pages/search';
import AppIntroPage from '../pages/welcome';
import VotersPage from '../pages/voters';
import EditAccountPage from '../pages/editAccount';
import ResteemsPage from '../pages/resteeem';
import CommentDetailPage from '../pages/comment';
import SettingsPage from '../pages/settings';
import ExploreCommunities from '../pages/communities';
import ExploreWitness from '../pages/witness';
import FollowersPage from '../pages/follows';
import {WebBrowser} from '../pages/webBrowser';
import CommunityReportPage from '../pages/community/container/CommunityReportPage';
import AccountsPage from '../pages/accounts';
import NewSnippetPage from '../pages/snippet';
import DelegationPage from '../pages/delegation/screen/DelegationPage';
import pinCodeScreen from '../pages/pinCode';

const StackNavigator = ({initRoute}) => {
  const Stack = createNativeStackNavigator();
  const Drawer = createDrawerNavigator();
  const {isThemeDark} = useContext(PreferencesContext);

  const headerStyle = {
    headerStyle: {
      backgroundColor: isThemeDark
        ? MaterialDarkTheme.colors.background
        : 'white',
    },
    headerTintColor: isThemeDark ? 'white' : 'black',
  };
  const PostingStack = () => {
    return (
      <Stack.Navigator
        initialRouteName={AppRoutes.PAGES.PostingPage}
        screenOptions={{
          animation: 'slide_from_right',
          headerShown: false,
        }}>
        <Stack.Screen
          initialParams={{isEdit: false, comment: {}, feedKey: ''}}
          options={{
            animation: 'slide_from_right',
            headerRight: props => <IconButton icon={'refresh'} />,
            headerShown: false,
            headerTitle: props => (
              <Text {...props} variant="bodySmall">
                New Post
              </Text>
            ),
          }}
          name={AppRoutes.PAGES.PostingPage}
          component={PostingPage}
        />
      </Stack.Navigator>
    );
  };

  const DrawerNavigator = () => {
    return (
      <Drawer.Navigator
        drawerContent={props => <DrawerContent {...props} />}
        
        screenOptions={{
          headerShown: true,
          drawerStyle: {
            backgroundColor: 'transparent',
            width: 240,
          },

          header: props => {
            return <AppBarHeader {...props} />;
          },
        }}>
        <Stack.Screen
          name={AppRoutes.PAGES.LandingPage}
          component={BottomTabNavigator}
        />
      </Drawer.Navigator>
    );
  };

  const IntroNavigator = () => {
    return (
      <Drawer.Navigator
        screenOptions={{
          drawerStyle: {display: 'none', width: 0},
        }}>
        <Stack.Screen
          name={AppRoutes.PAGES.AppIntroPage}
          component={AppIntroPage}
          options={{
            header: props => {
              return <></>;
            },
          }}
        />
      </Drawer.Navigator>
    );
  };

  return (
    <Stack.Navigator
      initialRouteName={initRoute}
      screenOptions={{
        headerShown: false,
        ...headerStyle,
      }}>
      <Stack.Screen
        name={AppRoutes.DRAWER.HomeDrawer}
        component={DrawerNavigator}
      />

      <Stack.Screen
        options={{
          animation: 'slide_from_bottom',
          headerRight: props => <IconButton icon={'refresh'} />,
          headerShown: true,
          title: 'Post Details',
          headerTitle: props => (
            <Text variant="bodySmall">{props.children}</Text>
          ),
        }}
        name={AppRoutes.PAGES.CommentDetailPage}
        component={CommentDetailPage}
      />

      {/* <Stack.Screen
        options={{
          animation: 'none',
          headerRight: (props => <IconButton icon={'refresh'} />),
          headerShown: true, title: 'Post',
          headerTitle: (props) => <Text variant='bodySmall'>{props.children}</Text>

        }}
        name={AppRoutes.PAGES.ReplyDetailPage} component={ReplyThread}
      /> */}

      <Stack.Screen
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Profile',
          headerTitle: props => (
            <Text variant="bodySmall">{props.children}</Text>
          ),
        }}
        name={AppRoutes.PAGES.ProfilePage}
        component={ProfilePage}
      />

      <Stack.Screen
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              Login{' '}
            </Text>
          ),
          ...headerStyle,
        }}
        name={AppRoutes.PAGES.LoginPage}
        component={LoginPage}
      />

      <Stack.Screen
        options={{
          animation: 'slide_from_bottom',
        }}
        name={AppRoutes.PAGES.PostingStack}
        component={PostingStack}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.EditAccountPage}
        component={EditAccountPage}
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              Update Profile
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name={AppRoutes.PAGES.VotersPage}
        component={VotersPage}
        options={{
          animation: 'slide_from_bottom',
          headerShown: false,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              Voters
            </Text>
          ),
          headerLeft: props => (
            <Icons.MaterialCommunityIcons {...props} name="close" />
          ),
        }}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.DelegationPage}
        component={DelegationPage}
        options={{
          animation: 'slide_from_bottom',
          headerShown: false,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              Delegation
            </Text>
          ),
          headerLeft: props => (
            <Icons.MaterialCommunityIcons {...props} name="close" />
          ),
        }}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.NewSnippetPage}
        component={NewSnippetPage}
        options={{
          animation: 'slide_from_bottom',
          headerShown: true,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              New Snippet
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name={AppRoutes.PAGES.ResteemsPage}
        component={ResteemsPage}
        options={{
          animation: 'slide_from_bottom',
          headerShown: false,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              Reblogs
            </Text>
          ),
          headerLeft: props => (
            <Icons.MaterialCommunityIcons {...props} name="close" />
          ),
        }}
      />

      <Stack.Screen
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Settings',
          ...headerStyle,
          headerTitle: props => (
            <Text variant="bodySmall">{props.children}</Text>
          ),
        }}
        name={AppRoutes.PAGES.SettingsPage}
        component={SettingsPage}
      />

      <Stack.Screen
        options={{
          headerRight: props => <IconButton icon={'share'} />,
          headerShown: true,
          title: 'Browser',
          headerTitle: props => (
            <Text variant="bodySmall">{props.children}</Text>
          ),
        }}
        name={AppRoutes.PAGES.BrowserPage}
        component={WebBrowser}
      />

      <Stack.Screen
        options={{
          animation: 'slide_from_right',
          // headerRight: (props => <IconButton icon={'share'} />),
          headerShown: true,
          title: 'Community',
          headerTitle: props => (
            <Text variant="bodySmall">{props.children}</Text>
          ),
        }}
        name={AppRoutes.PAGES.CommunityPage}
        component={CommunityPage}
      />

      <Stack.Screen
        options={{
          animation: 'slide_from_right',
          // headerRight: (props => <IconButton icon={'share'} />),
          headerShown: true,
          title: 'Category',
          headerTitle: props => (
            <Text variant="bodySmall">{props.children}</Text>
          ),
        }}
        name={AppRoutes.PAGES.CategoryPage}
        component={CategoryPage}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.ExploreCommunitiesPage}
        component={ExploreCommunities}
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              Communities
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.ExploreWitnessPage}
        component={ExploreWitness}
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              Witness Voting
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.AboutPage}
        component={AboutPage}
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              {'About Us'}
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.SearchPage}
        component={SearchPage}
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              {props.children}
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.FollowersPage}
        component={FollowersPage}
        options={{
          animation: 'slide_from_bottom',
          title: 'Follows',
          headerShown: true,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              {props.children}
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.AccountsPage}
        component={AccountsPage}
        options={{
          animation: 'slide_from_bottom',
          title: 'Accounts',
          headerShown: false,
          headerTitle: props => (
            <Text {...props} variant="bodySmall">
              {props.children}
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name={AppRoutes.PAGES.CommunityReportPage}
        component={CommunityReportPage}
        options={{
          animation: 'slide_from_right',
          // headerRight: (props => <IconButton icon={'share'} />),
          headerShown: true,
          title: 'Community',
          headerTitle: props => (
            <Text variant="bodySmall">{props.children}</Text>
          ),
        }}
      />
      <Stack.Screen
        name={'IntroMain'}
        component={IntroNavigator}
        options={{
          headerTransparent: true,
        }}
      />

      <Stack.Screen
        initialParams={{hideCloseButton: true, isNew: false}}
        name={AppRoutes.PAGES.PinCodePage}
        component={pinCodeScreen}
        options={{
          animation: 'slide_from_right',
          headerTransparent: true,
        }}
      />
    </Stack.Navigator>
  );
};
export default StackNavigator;
