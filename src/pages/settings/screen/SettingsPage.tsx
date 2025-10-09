import {HStack, VStack} from '@react-native-material/core';
import {useContext, useEffect, useState} from 'react';
import {Button, Card, MD2Colors, MD3Colors, Text} from 'react-native-paper';
import {Switch} from 'react-native-paper';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import ProgressDialog from '../../../components/basicComponents/ProgressDialog';
import {setSettings} from '../../../utils/realm';
import {AppStrings} from '../../../constants/AppStrings';
import {checkClient} from '../../../steem/CondenserApis';
import DropdownItem from '../../../components/basicComponents/DropdownItem';
import {useDispatch} from 'react-redux';
import {delay} from '../../../utils/editor';
import {useAppSelector} from '../../../constants/AppFunctions';
import {AppRoutes} from '../../../constants/AppRoutes';
import {ScrollView} from 'react-native';
import NotificationSettings from './NotificationSettings';

interface settingsProps {
  title: string;
  children: React.ReactNode;
  mt?: number;
}

const SettingsCard = (props: settingsProps) => (
  <Card mode="contained" style={{marginTop: props.mt ?? 0}}>
    <Card.Content style={{paddingVertical: 12, paddingHorizontal: 10}}>
      <HStack justify="between" items="center">
        <Text>{props.title}</Text>
        {props.children}
      </HStack>
    </Card.Content>
  </Card>
);

const SettingsHeading = ({
  isDark,
  heading,
  mt,
}: {
  isDark?: boolean;
  heading: string;
  mt?: number;
}) => (
  <HStack fill items="center" style={{marginTop: mt ?? 0}}>
    <Text
      variant="labelSmall"
      style={{
        padding: 4,
        color: isDark ? MD2Colors.white : MD2Colors.black,
      }}>
      {heading}
    </Text>

    <HStack
      style={{
        height: 1,
        width: '100%',
        backgroundColor: MD2Colors.grey400,
      }}
    />
  </HStack>
);

const SettingsPage = ({navigation}) => {
  const settings = useAppSelector(state => state.settingsReducer.value);
  const {toggleTheme, isThemeDark} = useContext(PreferencesContext);
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const dispatch = useDispatch();
  const [progressDialog, setProgressDialog] = useState(false);
  const [darkValue, setDarkValue] = useState(isThemeDark);
  const [selectedRpc, setRpc] = useState(
    settings?.rpc || AppStrings.RPC_SERVERS[0],
  );

  const [isConsentAvailable, setIsConsentAvailable] = useState(false);

  const [selectedLn, setLn] = useState(
    settings?.languageTo || AppStrings.LANGUAGES[3],
  );
  const [feedStyle, setFeedStyle] = useState(settings?.feedStyle ?? 'Compact');
  const [nsfw, setNsfw] = useState(settings?.nsfw ?? '0');

  const rpcItems: any = AppStrings.RPC_SERVERS.map(name => ({
    item: name,
    value: name,
  }));

  const languageItems: any = AppStrings.LANGUAGES.map(item => ({
    item: item.title,
    value: item.code,
  }));

  const feedStyleItems = ['Flex', 'Compact'].map(item => ({
    item: item,
    value: item,
  }));

  const nsfwItems = [
    {item: 'Always hide', value: '0'},
    {item: 'Always show', value: '1'},
  ];

  const changeTheme = async () => {
    setProgressDialog(true);
    setDarkValue(!isThemeDark);
    await delay(200);
    setSettings({isThemeDark: !isThemeDark}, dispatch);
    toggleTheme();
    setProgressDialog(false);
  };

  const changeRPC = async (rpc: string) => {
    setProgressDialog(true);
    setRpc(rpc);
    await delay(200);
    if (rpc !== selectedRpc) setSettings({rpc: rpc}, dispatch);
    checkClient();
    setProgressDialog(false);
  };

  const changeLanguage = async items => {
    const {item, value} = items;
    setProgressDialog(true);
    setLn({title: item, code: value});
    await delay(200);
    if (items !== selectedLn)
      setSettings({languageTo: {title: item, code: value}}, dispatch);
    setProgressDialog(false);
  };

  const changeFeedStyle = async items => {
    const {item, value} = items;
    setProgressDialog(true);
    setFeedStyle(value);
    await delay(200);
    if (value !== feedStyle) setSettings({feedStyle: value}, dispatch);
    setProgressDialog(false);
  };

  const changeNsfw = async items => {
    const {item, value} = items;
    setProgressDialog(true);
    setNsfw(value);
    await delay(200);
    if (value !== nsfw) setSettings({nsfw: value}, dispatch);
    setProgressDialog(false);
  };

  const handlePinCode = async () => {
    if (!settings.pinEnabled)
      navigation.push(AppRoutes.PAGES.PinCodePage, {
        hideCloseButton: false,
        isNew: true,
      });
    else {
      navigation.push(AppRoutes.PAGES.PinCodePage, {
        hideCloseButton: false,
        isNew: false,
        isReset: true,
      });
    }
  };


  return (
    <MainWrapper>
      <VStack ph={4} mt={10}>
        <ScrollView contentContainerStyle={{paddingBottom: 40}}>
          <SettingsHeading isDark={isThemeDark} heading={'General'} />

          <SettingsCard mt={6} title={'Dark Theme'}>
            <Switch
              color={'red'}
              value={darkValue}
              onValueChange={changeTheme}
            />
          </SettingsCard>
          <>
            {loginInfo.login ? (
              <SettingsCard title={'PIN Code'} mt={10}>
                <Switch
                  color={'red'}
                  value={settings.pinEnabled}
                  onValueChange={handlePinCode}
                />
              </SettingsCard>
            ) : null}
          </>

          <SettingsCard title={'RPC Server'} mt={10}>
            <DropdownItem
              items={rpcItems}
              value={selectedRpc}
              onChange={item => changeRPC(item.value)}
            />
          </SettingsCard>

          <SettingsCard title={'NSFW'} mt={10}>
            <DropdownItem
              items={nsfwItems}
              value={nsfw === '1' ? 'Always show' : 'Always hide'}
              onChange={changeNsfw}
              dropdownStyle={{width: 120}}
            />
          </SettingsCard>

          <SettingsCard title={'Feed Style'} mt={10}>
            <DropdownItem
              items={feedStyleItems}
              value={feedStyle}
              onChange={changeFeedStyle}
              dropdownStyle={{width: 120}}
            />
          </SettingsCard>

          <SettingsCard title={'Target Language'} mt={10}>
            <DropdownItem
              items={languageItems}
              value={selectedLn.title}
              onChange={changeLanguage}
              dropdownStyle={{width: 120}}
            />
          </SettingsCard>


          {loginInfo.login ? (
            <>
              <SettingsHeading
                isDark={isThemeDark}
                mt={6}
                heading={'Notification'}
              />

              <NotificationSettings />
            </>
          ) : (
            <></>
          )}
        </ScrollView>
      </VStack>
      <ProgressDialog visible={progressDialog} setVisible={setProgressDialog} />
    </MainWrapper>
  );
};

export {SettingsPage};
