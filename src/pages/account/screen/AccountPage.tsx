import {VStack} from '@react-native-material/core';
import React from 'react';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {useAppSelector} from '../../../constants/AppFunctions';
import LoginButton from '../../../components/basicComponents/LoginButton';
import {AccountHeader, AccountTabNavigator} from '..';

interface Props {
  navigation: any;
  route: any;
}

const AccountPage = (props: Props) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);

  return (
    <MainWrapper>
      {!loginInfo.login ? (
        <LoginButton {...props} />
      ) : (
        <VStack fill ph={4}>
          <AccountHeader {...props} isAccount data={loginInfo} />
          <AccountTabNavigator {...props} isAccount />
        </VStack>
      )}
    </MainWrapper>
  );
};

export {AccountPage};
