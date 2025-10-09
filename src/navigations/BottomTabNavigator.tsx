import { Text, View } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, BottomNavigation, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector } from '../constants/AppFunctions';
import { getAppVersionString } from '../utils/utils';
import { getUnreadNotifications } from '../steem/SteemApis';
import { useQuery } from '@tanstack/react-query';
import { AppConstants } from '../constants/AppConstants';
import { FeedTabNavigator } from '../pages/home';
import { AppRoutes } from '../constants/AppRoutes';
import { getResizedAvatar } from '../utils/ImageApis';
import { AppColors } from '../constants/AppColors';
import AccountPage from '../pages/account';
import WalletPage from '../pages/wallet';
import NotificationPage from '../pages/notification';

function HomeScreen({ navigation, route }) {
  return (
    <FeedTabNavigator navigation={navigation} route={route} />
  );
}

function SettingsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Settings!</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function BottomTabNavigatorTest() {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const notificationKey = `notifications-${loginInfo.name ?? ''
    }-bottomTab-${getAppVersionString()}`;

  const { data: notificationData } = useQuery({
    enabled: loginInfo.login === true,
    queryKey: [notificationKey],
    queryFn: () =>
      getUnreadNotifications(
        loginInfo.name,
        loginInfo.notification ?? AppConstants.DEFAULT_NOTIFICATION_SETTINGS,
      ),
    retryDelay: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });


  return (
    <Tab.Navigator
      screenOptions={{
        animation: 'shift',
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) {
              preventDefault();
            } else {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          }}
          renderIcon={({ route, focused, color }) =>
            descriptors[route.key].options.tabBarIcon?.({
              focused,
              color,
              size: 24,
            }) || null
          }
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options.title === 'string'
                  ? options.title
                  : route.name;

            return label;
          }}
        />
      )}>
      <Tab.Screen
        name="Home"
        component={FeedTabNavigator}

        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => {
            return (
              <Icon
                name={`home${!focused ? '-outline' : ''}`}
                size={24}
                color={color}
              />
            );
          },
        }}
      />
      <Tab.Screen
        name={AppRoutes.PAGES.NotificationPage}
        component={NotificationPage}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ focused, color }) => {
            return (
              <Icon
                name={`bell${!focused ? '-outline' : ''}`}
                size={24}
                color={color}
              />
            );
          },
          tabBarBadge:
            notificationData && notificationData >= 100
              ? '99+'
              : notificationData || undefined,
        }}
      />

      <Tab.Screen
        name={AppRoutes.PAGES.WalletPage}
        component={WalletPage}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ focused, color }) => {
            return (
              <Icon
                name={`wallet${!focused ? '-outline' : ''}`}
                size={24}
                color={color}
              />
            );
          },
        }}
      />

      <Tab.Screen
        name={AppRoutes.PAGES.AccountPage}
        component={AccountPage}
        options={{
          tabBarLabel: loginInfo?.login ? 'You' : 'Account',
          tabBarIcon: ({ focused, color }) => {
            return loginInfo?.login && loginInfo?.name ? (
              <Avatar.Image
                style={{ backgroundColor: AppColors.LIGHT_WHITE }}
                source={{ uri: getResizedAvatar(loginInfo.name) }}
                size={24}
              />
            ) : (
              <Icon
                name={`account${!focused ? '-outline' : ''}`}
                size={24}
                color={color}
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}