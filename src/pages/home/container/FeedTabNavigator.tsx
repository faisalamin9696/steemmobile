import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useContext, useEffect, useMemo, useState} from 'react';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import {AppStrings} from '../../../constants/AppStrings';
import RoundTopTabBar from '../../../components/basicComponents/RoundTopTabBar';
import {FeedTabPage} from '..';
import {StyleSheet} from 'react-native';
import {AnimatedFAB} from 'react-native-paper';
import {AppRoutes} from '../../../constants/AppRoutes';
import {MaterialDarkTheme} from '../../../utils/theme';
import {useAppSelector} from '../../../constants/AppFunctions';
import {useDispatch} from 'react-redux';
import {getItemFromStorage} from '../../../utils/realm';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {getAccountExt, loadSteemGlobals} from '../../../steem/SteemApis';
import {AppConstants} from '../../../constants/AppConstants';
import {saveLoginInfo} from '../../../utils/handlers';
import {saveSteemGlobals} from '../../../redux/reducers/SteemGlobalReducer';
import moment from 'moment';
import {VStack} from '@react-native-material/core';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {saveProfileHandler} from '../../../redux/reducers/ProfileReducer';
// import PromotedPostsCarousel from './PromotedPostsCarousel';
// import {View} from 'react-native-animatable';

const FeedTabNavigator = ({navigation, route}) => {
  const Tab = createMaterialTopTabNavigator();
  const {isThemeDark} = useContext(PreferencesContext);
  const isExtended = route?.params?.isExtended ?? true;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const [dialog, setDialog] = useState(false);
  const dispatch = useDispatch();
  const accountData: AccountExt | undefined = getItemFromStorage(
    AppStrings.CURRENT_USER_SCHEMA,
  );
  const {
    isSuccess: isSuccess2,
    data: data2,
    isError,
  } = useQuery({
    queryKey: [`userData-${accountData?.name}`],
    enabled: accountData !== undefined && accountData.login === true,
    queryFn: () => getAccountExt(accountData?.name!, 'null'),
    retry: true,
    retryDelay: 10000,
    refetchInterval: AppConstants.ACCOUNT_REFETCH_INTERVAL,
  });

  useEffect(() => {
    if (isSuccess2) {
      saveLoginInfo(dispatch, {...data2, last_fetch: moment().unix()});
      dispatch(saveProfileHandler({...data2, last_fetch: moment().unix()}));
    }

    if (isError) {
      if (accountData) {
        saveLoginInfo(dispatch, {...loginInfo, ...accountData});
      }
    }
  }, [isSuccess2, isError, data2]);

  const {isSuccess, data} = useQuery({
    queryKey: ['steemGlobals'],
    queryFn: loadSteemGlobals,
    retry: true,
    retryDelay: 8000,
    refetchInterval: AppConstants.GLOBAL_REFETCH_INTERVAL,
  });

  useEffect(() => {
    if (isSuccess) {
      dispatch(saveSteemGlobals(data));
      if (
        !dialog &&
        moment(data.head_block_time * 1000).subtract(1, 'minutes') > moment()
      ) {
        setDialog(true);
      }
    }
  }, [isSuccess]);

  return (
    <MainWrapper>
      <VStack fill>
        {/* <View style={{height: 65}}>
          <PromotedPostsCarousel navigation={navigation} route={route} />
        </View> */}
        <VStack ph={4} fill>
          <RoundTopTabBar initialRoute="Trending">
            <Tab.Screen
              initialParams={{
                feed_api: AppStrings.FEED_APIS.TRENDING_FEED.API,
                type: AppStrings.FEED_APIS.NEW_FEED.TYPE,
                route: route,
              }}
              name="Trending"
              component={FeedTabPage}
            />
            <Tab.Screen
              initialParams={{
                feed_api: AppStrings.FEED_APIS.NEW_FEED.API,
                type: AppStrings.FEED_APIS.NEW_FEED.TYPE,
                route: route,
              }}
              name="New"
              component={FeedTabPage}
            />
            <Tab.Screen
              initialParams={{
                feed_api: AppStrings.FEED_APIS.HOT_FEED.API,
                type: AppStrings.FEED_APIS.NEW_FEED.TYPE,
                route: route,
              }}
              name="Hot"
              component={FeedTabPage}
            />

            <Tab.Screen
              initialParams={{
                feed_api: AppStrings.FEED_APIS.PAYOUT_FEED.API,
                type: AppStrings.FEED_APIS.NEW_FEED.TYPE,
                route: route,
              }}
              name="Payout"
              component={FeedTabPage}
            />
          </RoundTopTabBar>

          {useMemo(() => {
            return (
              <>
                <AnimatedFAB
                  icon={'plus'}
                  label={'Create Post'}
                  extended={isExtended}
                  onPress={() => {
                    navigation.navigate(AppRoutes.PAGES.PostingStack);
                  }}
                  visible={true}
                  animateFrom={'right'}
                  iconMode={'dynamic'}
                  style={[
                    styles.fabStyle,
                    {
                      backgroundColor: isThemeDark
                        ? MaterialDarkTheme.colors.primary
                        : undefined,
                    },
                  ]}
                />
              </>
            );
          }, [isExtended, isThemeDark])}
        </VStack>
      </VStack>
    </MainWrapper>
  );
};

export {FeedTabNavigator};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  fabStyle: {
    bottom: 16,
    right: 16,
    position: 'absolute',
  },
});
