import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useMemo} from 'react';
import RoundTopTabBar from '../../../components/basicComponents/RoundTopTabBar';
import {WalletInfo} from './WalletInfo';
import TransferHistoryPage from '../../transferHistory';
import {useAppSelector} from '../../../constants/AppFunctions';

interface Props {
  navigation: any;
  route: any;
  data: AccountExt;
  isAccount?: boolean;
}
const WalletInfoNavigator = (props: Props) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const Tab = createMaterialTopTabNavigator();
  const {data, isAccount} = props;

  return useMemo(() => {
    return (
      <RoundTopTabBar>
        <Tab.Screen
          initialParams={{
            data: isAccount ? loginInfo : data,
            isAccount: isAccount,
          }}
          name="Balance"
          component={WalletInfo}
        />

        <Tab.Screen
          initialParams={{
            data: isAccount ? loginInfo : data,
            isAccount: isAccount,
          }}
          name="History"
          component={TransferHistoryPage}
        />
      </RoundTopTabBar>
    );
  }, [data, loginInfo]);
};

export {WalletInfoNavigator};
