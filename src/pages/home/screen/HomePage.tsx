import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import React, {useEffect, useLayoutEffect} from 'react';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {MaterialDarkTheme, MaterialLightTheme} from '../../../utils/theme';
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import StackNavigator from '../../../navigations/StackNavigator';
import {
  Alert,
  Appearance,
  EventSubscription,
  Linking,
  StatusBar,
} from 'react-native';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import {
  getItemFromStorage,
  getSettings,
  setItemToStorage,
  setSettings,
} from '../../../utils/realm';
import {AppRoutes} from '../../../constants/AppRoutes';
import {deepLinkParser} from '../../../utils/deepLinkParser';
import {AppColors} from '../../../constants/AppColors';
import {AppGlobals} from '../../../constants/AppGlobals';
import {StackActions} from '@react-navigation/native';
import CheckUpdate from '../../../components/basicComponents/CheckUpdate';
import {initiNotificationListener} from '../../../services/NotificationService';
import BootSplash from 'react-native-bootsplash';
import {useAppSelector} from '../../../constants/AppFunctions';
import {useDispatch} from 'react-redux';

let navigationRef: any = null;
let linkingEventSub: EventSubscription | null = null;

const HomePage = () => {
  const settingInfo =
    useAppSelector(state => state.settingsReducer.value) ?? getSettings();
  const dispatch = useDispatch();
  const settings = getSettings();

  function toggleTheme() {
    setSettings(
      {...settingInfo, isThemeDark: !settingInfo.isThemeDark},
      dispatch,
    );
  }
  useEffect(() => {
    Appearance.setColorScheme(settingInfo.isThemeDark ? 'dark' : 'light');
  }, [settingInfo.isThemeDark]);

  const preferences = React.useMemo(
    () => ({
      toggleTheme,
      isThemeDark: settingInfo.isThemeDark,
    }),
    [settingInfo.isThemeDark],
  );

  // useLayoutEffect(() => {
  //   let timeout: NodeJS.Timeout;
  //   try {
  //     timeout = setTimeout(() => {
  //       StatusBar.setBackgroundColor(
  //         isThemeDark ? AppColors.APP_BACKGROUND : 'white',
  //       );
  //       StatusBar.setBarStyle(isThemeDark ? 'light-content' : 'dark-content');
  //     }, 150);
  //   } catch (e) {
  //     console.log('theme failed');
  //   }

  //   return () => {
  //     clearTimeout(timeout);
  //   };
  // }, []);

  const _handleAlert = (text = null, title = null) => {
    Alert.alert('Something went wrong', text || 'unknown error occurred');
  };

  // handling the deep-links
  useLayoutEffect(() => {
    linkingEventSub = Linking.addEventListener('url', _handleOpenURL);
    Linking.getInitialURL().then(url => {
      _handleOpenURL({url: url});
    });

    return () => linkingEventSub?.remove();
  }),
    [];

  const _handleOpenURL = async (event: {url: string | null}) => {
    const {url} = event;
    if (!event?.url) {
      return;
    }
    try {
      deepLinkParser(url).then(res => {
        const {name, params, key} = res || {};
        if (name && key) {
          if (navigationRef?.isReady()) {
            if (settings.pinEnabled && !AppGlobals.PIN_CODE) {
              navigationRef.navigate(AppRoutes.PAGES.PinCodePage, {
                hideCloseButton: true,
                target: name,
                targetProps: params,
              });
            } else {
              const pushAction = StackActions.push(name, {...params});
              navigationRef.dispatch(pushAction);
            }
          }
        }
      });
    } catch (err: any) {
      console.log('Error in DeepLink', err);
      _handleAlert(err?.message);
    }
  };

  // handling on ready event to check for app-intro screen flag app-intro !==1
  const _onReady = () => {
    BootSplash.hide();
    console.log('BootSplash has been hidden successfully');
  };

  const appIntro = getItemFromStorage('app-intro');

  const _initRoute =
    appIntro !== '1'
      ? 'IntroMain'
      : settings.pinEnabled
      ? AppRoutes.PAGES.PinCodePage
      : AppRoutes.DRAWER.HomeDrawer;

  // const _renderStatusBar = () => {
  //   const barStyle = settings.isThemeDark ? 'light-content' : 'dark-content';
  //   const barColor = settings.isThemeDark ? AppColors.APP_BACKGROUND : 'white';

  //   return (
  //     <>
  //       {Platform.OS === 'ios' ? (
  //         <StatusBar barStyle={barStyle} />
  //       ) : (
  //         <StatusBar barStyle={barStyle} backgroundColor={barColor} />
  //       )}
  //     </>
  //   );
  // };

  useEffect(() => {
    // initialize firebase notification listener
    initiNotificationListener(navigationRef);
    setItemToStorage('last_vote', 100);
  }, []);

  return (
    <>
      <PreferencesContext.Provider value={preferences}>
        <PaperProvider
          theme={
            settingInfo.isThemeDark ? MaterialDarkTheme : MaterialLightTheme
          }>
          <StatusBar
            barStyle={
              settingInfo.isThemeDark ? 'light-content' : 'dark-content'
            }
            backgroundColor={
              settingInfo.isThemeDark ? AppColors.APP_BACKGROUND : '#ffffff'
            }
          />

          <NavigationContainer
            ref={ref => {
              navigationRef = ref;
            }}
            onReady={_onReady}
            theme={
              settingInfo.isThemeDark
                ? {
                    ...DarkTheme,
                    colors: {
                      ...DarkTheme.colors,
                      background: MaterialDarkTheme.colors.background,
                    },
                  }
                : {
                    ...DefaultTheme,
                    colors: {
                      ...DefaultTheme.colors,
                      background: MaterialLightTheme.colors.background,
                    },
                  }
            }>
            <MainWrapper>
              <StackNavigator initRoute={_initRoute} />
              <CheckUpdate />
            </MainWrapper>
          </NavigationContainer>
        </PaperProvider>
      </PreferencesContext.Provider>
    </>
  );
};

export {HomePage};
