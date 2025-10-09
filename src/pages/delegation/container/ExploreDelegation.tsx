import {StyleSheet, View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {MD2Colors, Text} from 'react-native-paper';
import {AppColors} from '../../../constants/AppColors';
import {AppStyles} from '../../../constants/AppStyles';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {ExpiringDelegation, IncomingDelegations, OutgoingDelegations} from '..';

const ExploreDelegation = ({route}) => {
  const {account, exploreType} = route?.params;

  const Tab = createMaterialTopTabNavigator();

  const _renderLabel = (focused, children) => {
    if (focused) {
      return (
        <View style={AppStyles.tabFocused}>
          <Text style={{color: 'white', fontSize: 12}}>{children}</Text>
        </View>
      );
    } else
      return (
        <View style={AppStyles.tabUnFocused}>
          <Text style={{color: AppColors.DARK_GRAY, fontSize: 12}}>
            {children}
          </Text>
        </View>
      );
  };

  return (
    <MainWrapper style={{flex: 1}}>
      <Tab.Navigator
        initialRouteName={exploreType ?? 'INCOMING'}
        style={{marginTop: 15}}
        sceneContainerStyle={{backgroundColor: 'transparent'}}
        backBehavior="history"
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
          lazyPreloadDistance: 0,
          tabBarLabelStyle: {fontSize: 12},
          tabBarStyle: [styles.tabBarStyle, {height: 25}],
          tabBarItemStyle: [styles.tabBarItemStyle, {marginTop: -12}],
          tabBarPressOpacity: 0.9,
          tabBarPressColor: 'transparent',
          tabBarBounces: true,
          tabBarContentContainerStyle: {backgroundColor: MD2Colors.transparent},
          tabBarIndicatorStyle: {
            backgroundColor: 'transparent',
          },
          tabBarIndicator: () => {
            return <></>;
          },
          tabBarLabel: props => _renderLabel(props.focused, props.children),
        }}>
        <Tab.Screen
          name="INCOMING"
          initialParams={{account: account}}
          component={IncomingDelegations}
        />
        <Tab.Screen
          name="OUTGOING"
          initialParams={{account: account}}
          component={OutgoingDelegations}
        />
        <Tab.Screen
          name="EXPIRING"
          initialParams={{account: account}}
          component={ExpiringDelegation}
        />
      </Tab.Navigator>
    </MainWrapper>
  );
};

export {ExploreDelegation};

const styles = StyleSheet.create({
  tabBarStyle: {
    height: 30,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  tabBarItemStyle: {
    marginTop: -6,
    elevation: 0,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
});
