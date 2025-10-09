import {HStack, VStack} from '@react-native-material/core';
import React, {PureComponent, useEffect, useState} from 'react';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {AccountHeader} from '../../account/container/AccountHeader';
import {FlatList, View} from 'react-native';
import {WalletHeader} from '../../wallet/container/WalletHeader';
import getWindowDimensions from '../../../utils/getWindowDimensions';
import {useAppSelector} from '../../../constants/AppFunctions';
import {useQuery} from '@tanstack/react-query';
import {getAccountExt, getClubStatus} from '../../../steem/SteemApis';
import {saveLoginInfo} from '../../../utils/handlers';
import {useDispatch} from 'react-redux';
import {empty_profile} from '../../../utils/placeholders';
import moment from 'moment';
import {AppConstants} from '../../../constants/AppConstants';
import {ProfileTabNavigator} from '..';
import {saveProfileHandler} from '../../../redux/reducers/ProfileReducer';

interface Props {
  navigation: any;
  route: any;
}
const {width} = getWindowDimensions();
const ProfilePage = (props: Props) => {
  const {route} = props;
  let {account} = route?.params || {account: ''};
  const dispatch = useDispatch();
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const [expanded, setExpanded] = useState(true);

  const accountKey = `userData-${account}`;
  const {
    data: accountData,
    isSuccess,
    isError,
    error,
  } = useQuery({
    queryKey: [accountKey],
    queryFn: () => getAccountExt(account, loginInfo.name || 'null'),
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isSuccess) {
      const isSelf = account === loginInfo?.name;
      if (isSelf) {
        saveLoginInfo(dispatch, {...accountData, last_fetch: moment().unix()});
      }
      dispatch(
        saveProfileHandler({...accountData, last_fetch: moment().unix()}),
      );
    }
    if (isError) AppConstants.SHOW_TOAST('Failed', String(error), 'error');
  }, [isSuccess, isError]);

  const clubKey = `${account}-CLUB`;

  const clubData = useQuery({
    enabled: account !== undefined,
    queryKey: [clubKey],
    queryFn: () => getClubStatus(account, AppConstants.CLUB_MONTHS),
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (clubData.isError)
      AppConstants.SHOW_TOAST('Failed', String(clubData.error), 'error');
  }, [clubData.isError]);

  class ListItem extends PureComponent<{item; index}> {
    render() {
      const {item, index} = this.props;

      return (
        <>
          {index === 0 ? (
            <HStack fill w={width - 10}>
              <AccountHeader
                {...props}
                data={accountData ?? empty_profile(account)}
                isAccount={false}
                onExpanded={value => {
                  if (value !== expanded) {
                    setExpanded(value);
                  }
                }}
                isExpanded={expanded}
                containerStyle={{flex: 1}}
              />
            </HStack>
          ) : (
            <HStack fill w={width - 10}>
              <WalletHeader
                {...props}
                data={accountData ?? empty_profile(account)}
                clubData={clubData.data}
                onExpanded={value => {
                  if (value !== expanded) {
                    setExpanded(value);
                  }
                }}
                isExpanded={expanded}
                containerStyle={{flex: 1}}
              />
            </HStack>
          )}
        </>
      );
    }
  }

  return (
    <MainWrapper>
      <VStack ph={4} fill>
        <View style={{}}>
          <FlatList
            pagingEnabled
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[1, 2]}
            initialScrollIndex={0}
            onScrollToIndexFailed={info => {}}
            ItemSeparatorComponent={() => <HStack w={4}></HStack>}
            renderItem={({item, index}) => (
              <ListItem item={item} index={index} />
            )}
          />
        </View>
        <ProfileTabNavigator
          // onTabChange={(isWallet) => {
          //     if (isFirst) {
          //         isFirst = false;
          //         scrollToIndex(1);
          //     }
          // }}
          {...props}
          data={accountData || empty_profile(account)}
        />
      </VStack>
    </MainWrapper>
  );
};

export {ProfilePage};
