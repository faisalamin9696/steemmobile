import {HStack, VStack} from '@react-native-material/core';
import React from 'react';
import {MD2Colors, Text} from 'react-native-paper';
import {StyleSheet} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import ModalHeader from '../../../components/basicComponents/ModalHeader';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {useAppSelector} from '../../../constants/AppFunctions';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {ExploreDelegation, NewDelegation} from '..';

const DelegationPage = ({navigation, route}) => {
  const {onlyExplore, account, exploreType} = route?.params || {};
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const Tab = createMaterialTopTabNavigator();
  const hideModal = () => navigation.pop();

  const _renderLabel = (focused, children) => {
    if (focused) {
      return (
        <Text
          style={{
            color: 'white',
            fontSize: 12,
            opacity: 1,
            alignSelf: 'center',
          }}>
          {children}
        </Text>
      );
    } else
      return (
        <Text
          style={{
            color: 'white',
            fontSize: 12,
            opacity: 0.6,
            alignSelf: 'center',
          }}>
          {children}
        </Text>
      );
  };

  return (
    <MainWrapper>
      <VStack fill style={{paddingHorizontal: 20, paddingTop: 20}}>
        <ModalHeader
          title="Delegation"
          onClose={hideModal}
          subTitle={
            <HStack mt={15} spacing={10} items="center">
              <Text style={{textAlign: 'justify', opacity: 0.8}}>
                {`Add, Remove, Edit Delegation.`}
              </Text>

              <BadgeAvatar
                name={account.name ?? loginInfo.name}
                avatarSize={20}
              />
            </HStack>
          }
        />

        <Tab.Navigator
          initialRouteName={onlyExplore ? 'EXPLORE' : 'NEW'}
          style={{borderRadius: 16, marginTop: 10}}
          backBehavior="history"
          screenOptions={{
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
            tabBarLabelStyle: {fontSize: 12, color: 'white'},
            tabBarStyle: [styles.tabBarStyle, {height: 25}],
            tabBarItemStyle: [styles.tabBarItemStyle, {marginTop: -12}],
            tabBarPressOpacity: 0.9,
            tabBarPressColor: 'transparent',
            tabBarBounces: true,

            tabBarContentContainerStyle: {backgroundColor: MD2Colors.red400},
            tabBarIndicatorStyle: {
              backgroundColor: 'transparent',
            },

            tabBarLabel: props => _renderLabel(props.focused, props.children),

            tabBarIndicator: () => {
              return <></>;
            },
          }}>
          <Tab.Screen
            name="NEW"
            initialParams={{account: account ?? loginInfo}}
            component={NewDelegation}
          />
          <Tab.Screen
            name="EXPLORE"
            initialParams={{account: account ?? loginInfo, exploreType}}
            component={ExploreDelegation}
          />
        </Tab.Navigator>
      </VStack>
    </MainWrapper>
  );
};

export default DelegationPage;

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
