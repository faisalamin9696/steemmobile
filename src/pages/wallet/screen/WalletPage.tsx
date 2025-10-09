import {VStack} from '@react-native-material/core';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {WalletHeader} from '../container/WalletHeader';
import {useAppSelector} from '../../../constants/AppFunctions';
import React from 'react';
import LoginButton from '../../../components/basicComponents/LoginButton';
import {useQuery} from '@tanstack/react-query';
import {getClubStatus} from '../../../steem/SteemApis';
import {AppConstants} from '../../../constants/AppConstants';
import {WalletInfoNavigator} from '..';

interface Props {
  navigation: any;
  route: any;
}

const WalletPage = (props: Props) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const clubKey = `${loginInfo.name}-CLUB`;
  const clubData = useQuery({
    enabled: loginInfo.login === true,
    queryKey: [clubKey],
    queryFn: () => getClubStatus(loginInfo.name, AppConstants.CLUB_MONTHS),
    gcTime: 10 * 60 * 1000,
  });

  return (
    <MainWrapper>
      {!loginInfo.login ? (
        <LoginButton {...props} />
      ) : (
        <VStack fill ph={4}>
          <WalletHeader {...props} data={loginInfo} clubData={clubData.data} />
          <WalletInfoNavigator isAccount {...props} data={loginInfo} />
        </VStack>
      )}
    </MainWrapper>
  );
};

export {WalletPage};
