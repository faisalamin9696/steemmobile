import {Drawer, IconButton, Text, TouchableRipple} from 'react-native-paper';
import {useDispatch} from 'react-redux';
import {AppRoutes} from '../../constants/AppRoutes';
import * as Keychain from 'react-native-keychain';
import {useAppSelector} from '../../constants/AppFunctions';
import MainWrapper from '../../components/wrappers/MainWrapper';
import {HStack, VStack} from '@react-native-material/core';
import {useEffect, useState} from 'react';
import {saveLoginInfo} from '../../utils/handlers';
import ProgressDialog from '../../components/basicComponents/ProgressDialog';
import {AppConstants} from '../../constants/AppConstants';
import {Linking} from 'react-native';
import {getAppVersionString} from '../../utils/utils';
import ConfirmationModal from '../../components/basicComponents/ConfirmationModal';
import {getCredentials} from '../../utils/realm';
import auth from '@react-native-firebase/auth';
import {ScrollView} from 'react-native';
import messaging from '@react-native-firebase/messaging';

const DrawerContent = ({navigation}) => {
  const dispatch = useDispatch();
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const [progressDialog, setProgressDialog] = useState(false);
  // const [active, setActive] = useState('');
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [rulesDialog, setRulesDialog] = useState(false);
  const accountsKey = 'user-accounts';

  // Empty pass check
  const validatePass = async () => {
    const credentials = await getCredentials();
    if (credentials) {
      if (!credentials?.password) {
        navigation.toggleDrawer();
        setRulesDialog(true);
      }
    }
  };

  useEffect(() => {
    if (loginInfo.login) {
      validatePass();
    }
  }, []);

  const handleLogout = async (navigate?: boolean) => {
    setProgressDialog(true);
    await Keychain.resetInternetCredentials(accountsKey);
    Keychain.resetGenericPassword()
      .then(() => {
        messaging().deleteToken();
        auth().signOut();
        saveLoginInfo(dispatch, undefined, true);
        if (!navigate)
          AppConstants.SHOW_TOAST('Logout successfully', '', 'success');
        navigation.toggleDrawer();
        if (navigate) {
          navigation.navigate(AppRoutes.PAGES.LoginPage);
        }
      })
      .catch(() => {
        AppConstants.SHOW_TOAST('Failed', '', 'error');
      })
      .finally(() => {
        setProgressDialog(false);
      });
  };

  interface DrawerItemProps {
    label: string;
    icon: string;
    onPress?: () => void;
  }
  const DrawerItem = (props: DrawerItemProps) => (
    <TouchableRipple
      borderless
      style={{
        justifyContent: 'center',
        height: 34,
        marginLeft: 8,
        marginRight: 8,
        marginVertical: 0,
        marginTop: 6,
      }}
      onPress={props.onPress}>
      <HStack spacing={10} items="center">
        <IconButton size={20} icon={props.icon} />
        <Text variant="labelMedium">{props.label}</Text>
      </HStack>
    </TouchableRipple>
  );

  return (
    <MainWrapper style={{borderTopEndRadius: 15, borderBottomEndRadius: 15}}>
      <VStack fill>
        <ScrollView>
          <Drawer.Section title="">
            {!loginInfo.login && (
              <DrawerItem
                icon={'login'}
                label={'Login/Signup'}
                // active={active === 'first'}
                onPress={() => {
                  navigation.navigate(AppRoutes.PAGES.LoginPage);
                  navigation.toggleDrawer();
                }}
              />
            )}

            {loginInfo.login ? (
              <DrawerItem
                label="Manage Accounts"
                icon={'account-cog'}
                // active={active === 'second'}
                onPress={() => {
                  navigation.navigate(AppRoutes.PAGES.AccountsPage);
                  navigation.toggleDrawer();
                }}
              />
            ) : null}

            <DrawerItem
              label="Settings"
              icon={'cog'}
              // active={active === 'second'}
              onPress={() => {
                navigation.navigate(AppRoutes.PAGES.SettingsPage);
              }}
            />

            {loginInfo.login && (
              <DrawerItem
                icon={'logout'}
                label={'Logout'}
                onPress={() => {
                  setLogoutDialog(true);
                }}
              />
            )}
          </Drawer.Section>

          <Drawer.Section title="Explore">
            <DrawerItem
              label="Communities"
              icon={'home-group-plus'}
              onPress={() => {
                navigation.navigate(AppRoutes.PAGES.ExploreCommunitiesPage);
              }}
            />

            <DrawerItem
              label="Witness"
              icon={'vote'}
              onPress={() => {
                navigation.navigate(AppRoutes.PAGES.ExploreWitnessPage);
              }}
            />
          </Drawer.Section>

          <Drawer.Section title="Contact">
            <DrawerItem
              label="Discord"
              icon={'discord'}
              onPress={() => {
                Linking.openURL(AppConstants.DISCORD_LINK);
              }}
            />

            <DrawerItem
              label="Github"
              icon={'github'}
              onPress={() => {
                Linking.openURL(AppConstants.GITHUB_LINK);
              }}
            />

            <DrawerItem
              label="About"
              icon={'contacts'}
              // active={active === 'second'}
              onPress={() => {
                navigation.navigate(AppRoutes.PAGES.AboutPage);
              }}
            />
          </Drawer.Section>
        </ScrollView>
      </VStack>

      <Text style={{alignSelf: 'center', opacity: 0.4, padding: 10}}>
        {getAppVersionString()}
      </Text>
      {progressDialog ? (
        <ProgressDialog
          visible={progressDialog}
          setVisible={setProgressDialog}
        />
      ) : null}
      {logoutDialog ? (
        <ConfirmationModal
          title={'Confirmation'}
          visible={logoutDialog}
          body="Do you really want to logout?"
          setVisible={setLogoutDialog}
          handlePrimaryClick={handleLogout}
          primaryText="Logout"
        />
      ) : null}

      {rulesDialog ? (
        <ConfirmationModal
          cancelable={false}
          title={'Security rules updated!'}
          visible={rulesDialog}
          hideSecondary
          body="Login again to continue."
          setVisible={setRulesDialog}
          handlePrimaryClick={() => {
            handleLogout(true);
          }}
          primaryText="Continue"
        />
      ) : null}
    </MainWrapper>
  );
};

export {DrawerContent};
