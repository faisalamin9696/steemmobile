import {AppBar, HStack} from '@react-native-material/core';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Avatar, Card, IconButton, Text, Tooltip} from 'react-native-paper';
import {AppColors} from '../../constants/AppColors';
import {useAppSelector} from '../../constants/AppFunctions';
import {getResizedAvatar} from '../../utils/ImageApis';
import {MaterialDarkTheme, MaterialLightTheme} from '../../utils/theme';
import {useContext, useMemo} from 'react';
import {PreferencesContext} from '../../contexts/ThemeContext';
import {parseAccountMeta} from '../../utils/user';
import {Icons} from '../../components/Icons';
import {AppRoutes} from '../../constants/AppRoutes';

const AppBarHeader = ({navigation}) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const defaultLogo = require('../../../assets/img/default_icon.png');
  const logoImageUri = Image.resolveAssetSource(defaultLogo).uri;
  const {isThemeDark} = useContext(PreferencesContext);

  // const _renderStatusBar = async () => {
  //     await delay(800);
  //     const barStyle = settings.isThemeDark ? 'light-content' : 'dark-content';
  //     const barColor = settings.isThemeDark ? AppColors.APP_BACKGROUND : 'white';
  //     StatusBar.setBarStyle(barStyle);
  //     StatusBar.setBackgroundColor(barColor);

  // };
  // useEffect(() => {
  //     _renderStatusBar();
  // }, []);

  const handleOnSearchClick = () => {
    navigation.navigate(AppRoutes.PAGES.SearchPage);
  };
  const leadingComponents = useMemo(() => {
    return (
      <Card
        mode="contained"
        style={[styles.headerLeft]}
        className=" bg-red-300 dark:bg-gray-600">
        <View>
          <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
            <Avatar.Image
              style={{backgroundColor: AppColors.LIGHT_WHITE}}
              size={40}
              source={{uri: getResizedAvatar(loginInfo.name) || logoImageUri}}
            />
          </TouchableOpacity>
        </View>
      </Card>
    );
  }, [isThemeDark, loginInfo]);

  const appBarTitle = useMemo(() => {
    const parsed = parseAccountMeta(loginInfo?.posting_json_metadata ?? '{}');
    return (
      <Text variant="titleSmall" numberOfLines={1}>
        {loginInfo.login ? parsed.username || loginInfo.name : 'SteemMobile'}
      </Text>
    );
  }, [loginInfo]);

  const appBarSubTitle = useMemo(() => {
    return loginInfo.reputation ? (
      <HStack items="center">
        <Text numberOfLines={1} variant={'labelSmall'}>
          {`@${loginInfo.name}`}
        </Text>
        <View>
          <Tooltip title={loginInfo.reputation.toString()}>
            <Text variant={'labelSmall'} style={{opacity: 0.6}}>
              {' '}
              {`| ${loginInfo.reputation.toFixed(2)}`}
            </Text>
          </Tooltip>
        </View>
      </HStack>
    ) : null;
  }, [loginInfo]);

  return (
    <AppBar
      color={
        isThemeDark
          ? MaterialDarkTheme.colors.background
          : MaterialLightTheme.colors.background
      }
      title={appBarTitle}
      subtitle={appBarSubTitle}
      titleStyle={{fontSize: 14}}
      subtitleStyle={{fontSize: 10}}
      titleContentStyle={{marginStart: -10}}
      contentContainerStyle={{paddingStart: 0}}
      leading={leadingComponents}
      trailing={() => (
        <IconButton
          onPress={handleOnSearchClick}
          size={25}
          icon={() => (
            <Icons.AntDesign
              color={
                isThemeDark
                  ? MaterialLightTheme.colors.background
                  : MaterialDarkTheme.colors.background
              }
              size={20}
              name="search1"
            />
          )}
        />
      )}
    />
  );
};

export {AppBarHeader};

const styles = StyleSheet.create({
  headerLeft: {
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: 'center',
    alignContent: 'center',
    width: 65,
    alignItems: 'flex-end',
    paddingLeft: 8,
    paddingVertical: 4,
    paddingRight: 4,
  },
  title: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subTitle: {
    color: AppColors.PRIMARY_DARK_TEXT,
    fontSize: 12,
  },
  appBar: {
    shadowColor: '#fff',
    shadowOffset: {width: 1, height: 1},
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
});
