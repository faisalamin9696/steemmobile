
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import { AppStyles } from '../../../constants/AppStyles';
import { useMemo } from 'react';
import { CategoryTabPage } from '..';

interface Props {
    navigation: any;
    route: any;
}
const CategoryTabNavigator = (props: Props) => {
    const { route } = props;
    const Tab = createMaterialTopTabNavigator();
    const _renderLabel = (focused, children) => {
        if (focused) {
            return (
                <View
                    style={[AppStyles.tabFocused]}>
                    <Text style={{ color: 'white', fontSize: 12 }}>
                        {children}</Text></View>
            );
        } else
            return (
                <View style={AppStyles.tabUnFocused}>
                    <Text style={{ color: AppColors.DARK_GRAY, fontSize: 12 }}>
                        {children}</Text></View>
            );
    }


    return (useMemo(() => {
        return <Tab.Navigator screenOptions={{
            swipeEnabled: true,
            lazy: true, lazyPreloadDistance: 0,
            tabBarLabelStyle: { fontSize: 12 },
            tabBarStyle: styles.tabBarStyle,
            tabBarItemStyle: styles.tabBarItemStyle,
            tabBarPressOpacity: 0.9,
            tabBarPressColor: 'transparent',
            tabBarBounces: true,
            tabBarContentContainerStyle: { backgroundColor: 'transparent' },
            tabBarIndicatorContainerStyle: { backgroundColor: 'transparent' },
            tabBarIndicatorStyle: { backgroundColor: 'transparent' },

            tabBarIndicator: () => {
                return <></>
            }, tabBarLabel: props => _renderLabel(props.focused, props.children)


        }}>
            <Tab.Screen initialParams={{
                feed_api: 'getActivePostsByTagTrending',
                type: 'category', category: route?.params?.category,
                community: route?.params?.community
            }}
                name="Trending"
                component={CategoryTabPage} />

            <Tab.Screen initialParams={{
                feed_api: 'getPostsByTagCreated', type: 'category',
                category: route?.params?.category, community: route?.params?.community
            }}
                name="New"
                component={CategoryTabPage} />

            <Tab.Screen initialParams={{
                feed_api: 'getActivePostsByTagHot', type: 'category',
                category: route?.params?.category, community: route?.params?.community
            }}
                name="Hot"
                component={CategoryTabPage} />

        </Tab.Navigator>
    }, []))
}

export { CategoryTabNavigator };

const styles = StyleSheet.create({
    tabBarStyle: {
        height: 30,
        elevation: 0,
        backgroundColor: 'transparent',
    },
    tabBarItemStyle: {
        marginTop: -6,
        elevation: 0, alignItems: 'stretch',
        backgroundColor: 'transparent',

    },
})