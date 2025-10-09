import {Button, Card, Menu, Text, Tooltip} from 'react-native-paper';
import CurrencyView from '../../../components/basicComponents/CurrencyView';
import {
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {HStack, VStack} from '@react-native-material/core';
import React, {useContext, useEffect, useMemo, useState} from 'react';
import {useSharedValue} from 'react-native-reanimated';
import {useAppSelector} from '../../../constants/AppFunctions';
import {claimRewardBalance, vestToSteem} from '../../../steem/CondenserApis';
import {getCredentials} from '../../../utils/realm';
import {saveLoginInfo} from '../../../utils/handlers';
import {AppConstants} from '../../../constants/AppConstants';
import {ScrollingTabHandler} from '../../../components/ScrollingTabHandler';
import {useDispatch} from 'react-redux';
import TransferModal from '../../../components/basicComponents/TransferModal';
import PowerupModal from '../../../components/basicComponents/PowerupModal';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import {useMutation, useQuery} from '@tanstack/react-query';
import {abbreviateNumber} from '../../../utils/utils';
import {Icons} from '../../../components/Icons';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import {AppRoutes} from '../../../constants/AppRoutes';
import {
  getAccountExt,
  getExpiringDelegations,
  getTronInformation,
} from '../../../steem/SteemApis';
import {writeToClipboard} from '../../../utils/clipboard';
import {saveProfileHandler} from '../../../redux/reducers/ProfileReducer';
import moment from 'moment';
import {Platform} from 'react-native';
import {getTimeFromNow} from '../../../utils/time';
import {AppColors} from '../../../constants/AppColors';
import PowerDownModal from '../../../components/basicComponents/PowerDownModal';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const getRewardsString = (
  account: AccountExt,
  globals: SteemProps,
): string | undefined => {
  const reward_steem =
    account.rewards_steem > 0
      ? `${account.rewards_steem.toFixed(3)} STEEM`
      : null;
  const reward_sbd =
    account.rewards_sbd > 0 ? `${account.rewards_sbd.toFixed(3)} SBD` : null;
  const reward_sp =
    account.rewards_vests > 0
      ? `${vestToSteem(account.rewards_vests, globals.steem_per_share).toFixed(
          3,
        )} SP`
      : null;

  const rewards: string[] = [];
  if (reward_steem) rewards.push(reward_steem);
  if (reward_sbd) rewards.push(reward_sbd);
  if (reward_sp) rewards.push(reward_sp);

  let rewards_str: string | undefined;
  switch (rewards.length) {
    case 3:
      rewards_str = `${rewards[0]}, ${rewards[1]} and ${rewards[2]}`;
      break;
    case 2:
      rewards_str = `${rewards[0]} and ${rewards[1]}`;
      break;
    case 1:
      rewards_str = `${rewards[0]}`;
      break;
    default:
      rewards_str = undefined;
  }
  return rewards_str;
};

const WalletInfo = ({route, navigation}) => {
  let {data, isAccount} = route.params ?? {};
  const steemGlobals = useAppSelector(state => state.steemGlobalReducer.value);
  const loginInfo = useAppSelector(state => state.loginReducer.value);

  const profileInfo = isAccount
    ? loginInfo
    : useAppSelector(state => state.profileReducer.value)[data.name] ?? data;

  const [claimLoading, setClaimLoading] = useState(false);
  const [menuClick, setMenuClick] = useState(false);
  const [transferDialog, setTransferDialog] = useState({
    open: false,
    isSteem: true,
    isSaving: false,
  });
  const [powerDownModal, setPowerDownModal] = useState<{
    open: boolean;
    cancel?: boolean;
  }>({
    open: false,
  });

  const [powerupDialog, setPowerupDialog] = useState({
    open: false,
    isSaving: false,
    isSteem: true,
  });
  const lastContentOffset = useSharedValue(0);
  const parent = navigation?.getParent();
  const dispatch = useDispatch();
  let hideMenuButton = !isAccount;
  const incoming_sp = vestToSteem(
    profileInfo.vests_in,
    steemGlobals.steem_per_share,
  );
  const outgoing_sp = vestToSteem(
    profileInfo.vests_out,
    steemGlobals.steem_per_share,
  );
  const own_sp = vestToSteem(
    profileInfo.vests_own,
    steemGlobals.steem_per_share,
  );
  const [expiring, setExpiring] = useState(false);
  const expiringKey = `Delagation-${profileInfo.name}-expering`;
  const {isThemeDark} = useContext(PreferencesContext);
  const [trx, setTrx] = useState<SteemTron>();
  const accountKey = `userData-${profileInfo.name}`;

  const mutation = useMutation({
    mutationKey: [accountKey],
    mutationFn: () => getAccountExt(profileInfo?.name, 'null'),
    onSuccess(result) {
      if (isAccount)
        saveLoginInfo(dispatch, {...result, last_fetch: moment().unix()});
      else
        dispatch(saveProfileHandler({...result, last_fetch: moment().unix()}));
    },
    onError(err) {
      AppConstants.SHOW_TOAST('Failed', String(err), 'error');
    },
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(
    mutation.mutateAsync,
  );

  const getTronBalance = async (username): Promise<SteemTron | undefined> => {
    const trxInfo = await getTronInformation(username);
    if (trxInfo) {
      const trx_balance_str =
        trxInfo.trx_balance == 0
          ? '0.000'
          : Math.floor(trxInfo.trx_balance).toFixed(3);
      return {...trxInfo, trx_balance: parseFloat(trx_balance_str)};
    } else return undefined;
  };

  useEffect(() => {
    getTronBalance(profileInfo.name).then(res => {
      setTrx(res);
    });
  }, [profileInfo]);

  const {data: expiringData, isSuccess} = useQuery({
    queryKey: [expiringKey],
    queryFn: () => getExpiringDelegations(profileInfo.name),
  });

  useEffect(() => {
    if (isSuccess) {
      if (expiringData)
        if (expiringData.length >= 1) {
          setExpiring(true);
        } else {
          setExpiring(false);
        }
    }
  }, [isSuccess]);

  const menuClickHandler = () => {
    setMenuClick(true);
    setTimeout(() => {
      setMenuClick(false);
    }, 250);
  };

  const handleScroll = event => {
    ScrollingTabHandler(lastContentOffset, parent, event);
  };

  const handleRewardClaim = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setClaimLoading(true);
    const credentials = await getCredentials();
    if (credentials && profileInfo) {
      claimRewardBalance(
        profileInfo,
        credentials.password,
        profileInfo.rewards_steem.toFixed(3) + ' STEEM',
        profileInfo.rewards_sbd.toFixed(3) + ' SBD',
        profileInfo.rewards_vests.toFixed(6) + ' VESTS',
      )
        .then(result => {
          if (result) {
            if (isAccount)
              saveLoginInfo(dispatch, {
                ...profileInfo,
                rewards_sbd: 0,
                rewards_steem: 0,
                rewards_vests: 0,
                balance_steem:
                  profileInfo.balance_steem + profileInfo.rewards_steem,
                balance_sbd: profileInfo.balance_sbd + profileInfo.rewards_sbd,
                vests_own: profileInfo.vests_own + profileInfo.rewards_vests,
              });
            AppConstants.SHOW_TOAST('Claimed successfully', '', 'success');
          }
        })
        .catch(error => {
          AppConstants.SHOW_TOAST('Failed', String(error), 'error');
        })
        .finally(() => {
          setClaimLoading(false);
        });
    } else {
      setClaimLoading(false);
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  return (
    <VStack fill spacing={6}>
      <View>
        <LottieLoading loading={!profileInfo} />
      </View>

      {getRewardsString(profileInfo, steemGlobals) ? (
        <VStack mb={10} center spacing={4}>
          <VStack items="center" spacing={2}>
            <Text numberOfLines={2} variant="labelSmall">
              Unclaimed rewards
            </Text>
            <Text variant="labelLarge">
              {getRewardsString(profileInfo, steemGlobals)}
            </Text>
          </VStack>
          {isAccount && (
            <Button
              labelStyle={{fontSize: 14, marginVertical: 2}}
              disabled={claimLoading}
              loading={claimLoading}
              compact
              style={{alignSelf: 'center', margin: 5}}
              onPress={handleRewardClaim}>
              Claim reward
            </Button>
          )}
        </VStack>
      ) : null}

      {!!profileInfo.powerdown && (
        <VStack spacing={2} items="center" mt={4}>
          <HStack spacing={2} items="center">
            <Icons.MaterialCommunityIcons
              color={AppColors.ERROR}
              name="arrow-down-circle"
            />
            <Text variant="labelSmall">
              {vestToSteem(
                profileInfo.powerdown_done,
                steemGlobals.steem_per_share,
              )?.toLocaleString()}
              /
              {vestToSteem(
                profileInfo.powerdown,
                steemGlobals.steem_per_share,
              )?.toLocaleString()}{' '}
              STEEM
            </Text>
          </HStack>
          <Text variant="labelSmall">
            Next power down {getTimeFromNow(profileInfo.next_powerdown * 1000)}:
            ~
            {vestToSteem(
              profileInfo.powerdown_rate,
              steemGlobals.steem_per_share,
            )?.toLocaleString()}{' '}
            STEEM
          </Text>
        </VStack>
      )}

      {useMemo(() => {
        return (
          profileInfo && (
            <ScrollView
              keyboardShouldPersistTaps="always"
              onScroll={handleScroll}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetchingByUser}
                  onRefresh={refetchByUser}
                />
              }
              onMomentumScrollEnd={event => {
                if (event.nativeEvent.contentOffset.y <= 0) {
                  if (parent?.getState()?.routes[0]?.params?.value !== 1) {
                    parent?.setParams({value: 1});
                  }
                }
              }}
              contentContainerStyle={{paddingBottom: 80}}>
              <CurrencyView
                hideMenuButton={hideMenuButton}
                menuClick={menuClick}
                menuItems={
                  <>
                    <Menu.Item
                      onPress={() => {
                        setTransferDialog({
                          open: true,
                          isSteem: true,
                          isSaving: false,
                        });
                        menuClickHandler();
                      }}
                      titleStyle={{fontSize: 14}}
                      leadingIcon="transfer"
                      title={'Transfer'}
                    />

                    <Menu.Item
                      onPress={() => {
                        setPowerupDialog({
                          ...powerupDialog,
                          open: true,
                          isSaving: false,
                          isSteem: true,
                        });
                        menuClickHandler();
                      }}
                      titleStyle={{fontSize: 14}}
                      leadingIcon="solar-power"
                      title={'Power Up'}
                    />

                    <Menu.Item
                      onPress={() => {
                        setPowerupDialog({
                          ...powerupDialog,
                          open: true,
                          isSaving: true,
                          isSteem: true,
                        });
                        menuClickHandler();
                      }}
                      titleStyle={{fontSize: 14}}
                      leadingIcon="wallet-plus"
                      title={'Transfer to Savings'}
                    />
                  </>
                }
                currencytitle={'STEEM'}
                amount={
                  <View>
                    <Tooltip
                      title={profileInfo.balance_steem?.toLocaleString(
                        'en-US',
                      )}>
                      <Text>
                        {abbreviateNumber(profileInfo.balance_steem, 3)}
                      </Text>
                    </Tooltip>
                  </View>
                }
                expanableHeight={77}
                expanadedView={
                  <Text
                    style={{marginTop: 10, textAlign: 'justify'}}
                    variant="bodySmall">
                    Tradeable tokens that may be transferred anywhere at
                    anytime. Steem can be converted to STEEM POWER in a process
                    called powering up.
                  </Text>
                }
              />

              <CurrencyView
                hideMenuButton={hideMenuButton}
                menuClick={menuClick}
                menuItems={
                  <>
                    <Menu.Item
                      onPress={() => {
                        menuClickHandler();
                        navigation.push(AppRoutes.PAGES.DelegationPage, {
                          onlyExplore: false,
                          account: profileInfo,
                        });
                      }}
                      titleStyle={{fontSize: 12}}
                      leadingIcon="shield-sync"
                      title={'Delegate'}
                    />

                    <Menu.Item
                      onPress={() => {
                        setPowerDownModal({open: true});
                        menuClickHandler();
                      }}
                      titleStyle={{fontSize: 12}}
                      leadingIcon="database-arrow-down"
                      title={'Power Down'}
                    />

                    {!!profileInfo?.powerdown && (
                      <Menu.Item
                        onPress={() => {
                          setPowerDownModal({open: true, cancel: true});
                          menuClickHandler();
                        }}
                        titleStyle={{fontSize: 12}}
                        leadingIcon="database-minus"
                        title={'Cancel Power Down'}
                      />
                    )}
                  </>
                }
                mt={10}
                currencytitle={'STEEM POWER'}
                amount={
                  <VStack pv={8} items="end" spacing={4}>
                    <View>
                      <Tooltip title={own_sp?.toLocaleString('en-US')}>
                        <Text>{abbreviateNumber(own_sp, 3)}</Text>
                      </Tooltip>
                    </View>
                    <HStack items="center" spacing={6}>
                      <View>
                        {expiring ? (
                          <Tooltip title={'Expiring'}>
                            <TouchableOpacity
                              onPress={() => {
                                menuClickHandler();
                                navigation.push(
                                  AppRoutes.PAGES.DelegationPage,
                                  {
                                    onlyExplore: true,
                                    account: profileInfo,
                                    exploreType: 'EXPIRING',
                                  },
                                );
                              }}>
                              <Card>
                                <Card.Content
                                  style={{
                                    paddingVertical: 0,
                                    paddingHorizontal: 6,
                                  }}>
                                  <HStack items="center" spacing={4}>
                                    <View>
                                      <Icons.MaterialCommunityIcons
                                        name="clock-outline"
                                        size={16}
                                        color={isThemeDark ? 'white' : 'black'}
                                      />
                                    </View>

                                    <Text>- {expiringData?.length}</Text>
                                  </HStack>
                                </Card.Content>
                              </Card>
                            </TouchableOpacity>
                          </Tooltip>
                        ) : null}
                      </View>
                      <View>
                        {incoming_sp ? (
                          <Tooltip title={incoming_sp?.toLocaleString('en-US')}>
                            <TouchableOpacity
                              onPress={() => {
                                menuClickHandler();
                                navigation.push(
                                  AppRoutes.PAGES.DelegationPage,
                                  {
                                    onlyExplore: true,
                                    account: profileInfo,
                                    exploreType: 'INCOMING',
                                  },
                                );
                              }}>
                              <Card>
                                <Card.Content
                                  style={{
                                    paddingVertical: 0,
                                    paddingHorizontal: 6,
                                  }}>
                                  <View>
                                    <Text>
                                      + {abbreviateNumber(incoming_sp, 3)}
                                    </Text>
                                  </View>
                                </Card.Content>
                              </Card>
                            </TouchableOpacity>
                          </Tooltip>
                        ) : null}
                      </View>
                      <View>
                        {outgoing_sp ? (
                          <Tooltip title={outgoing_sp?.toLocaleString('en-US')}>
                            <TouchableOpacity
                              onPress={() => {
                                menuClickHandler();
                                navigation.push(
                                  AppRoutes.PAGES.DelegationPage,
                                  {
                                    onlyExplore: true,
                                    account: profileInfo,
                                    exploreType: 'OUTGOING',
                                  },
                                );
                              }}>
                              <Card>
                                <Card.Content
                                  style={{
                                    paddingVertical: 0,
                                    paddingHorizontal: 6,
                                  }}>
                                  <Text>
                                    - {abbreviateNumber(outgoing_sp, 3)}
                                  </Text>
                                </Card.Content>
                              </Card>
                            </TouchableOpacity>
                          </Tooltip>
                        ) : null}
                      </View>
                    </HStack>
                  </VStack>
                }
                expanableHeight={150}
                expanadedView={
                  <Text
                    style={{marginTop: 10, textAlign: 'justify'}}
                    variant="bodySmall">
                    Influence tokens which give you more control over post
                    payouts and allow you to earn on curation rewards. Part of $
                    {profileInfo.name}'s STEEM POWER is currently delegated.
                    Delegation is donated for influence or to help new users
                    perform actions on Steemit. Your delegation amount can
                    fluctuate.
                    {'\n\n'}STEEM POWER increases at an APR of approximately
                    2.86%, subject to blockchain variance. See FAQ for details.
                  </Text>
                }
              />

              <CurrencyView
                hideMenuButton={hideMenuButton}
                menuClick={menuClick}
                menuItems={
                  <>
                    <Menu.Item
                      onPress={() => {
                        setTransferDialog({
                          open: true,
                          isSteem: false,
                          isSaving: false,
                        });
                        menuClickHandler();
                      }}
                      titleStyle={{fontSize: 12}}
                      leadingIcon="transfer"
                      title={'Transfer'}
                    />

                    <Menu.Item
                      onPress={() => {
                        setPowerupDialog({
                          ...powerupDialog,
                          open: true,
                          isSaving: true,
                          isSteem: false,
                        });
                        menuClickHandler();
                      }}
                      titleStyle={{fontSize: 12}}
                      leadingIcon="wallet-plus"
                      title={'Transfer to Savings'}
                    />
                  </>
                }
                mt={10}
                currencytitle={'STEEM DOLLARS'}
                amount={
                  <View>
                    <Tooltip
                      title={profileInfo?.balance_sbd?.toLocaleString('en-US')}>
                      <Text>
                        $ {abbreviateNumber(profileInfo?.balance_sbd, 3)}
                      </Text>
                    </Tooltip>
                  </View>
                }
                amountPrefix="$"
                expanableHeight={70}
                expanadedView={
                  <Text
                    style={{marginTop: 10, textAlign: 'justify'}}
                    variant="bodySmall">
                    Tradeable tokens that may be transferred anywhere at
                    anytime.
                  </Text>
                }
              />

              <CurrencyView
                hideMenuButton={hideMenuButton}
                // menuItems={<>
                //     <Menu.Item onPress={() => { }} titleStyle={{ fontSize: 12 }}
                //         leadingIcon='transfer' title={'Withdraw Steem'} />

                // </>}
                mt={10}
                currencytitle={'SAVINGS'}
                disableMenu
                amount={
                  <VStack items="end">
                    <View>
                      <Tooltip
                        title={profileInfo?.savings_steem?.toLocaleString(
                          'en-US',
                        )}>
                        <Text>
                          {abbreviateNumber(profileInfo.savings_steem, 3)} STEEM
                        </Text>
                      </Tooltip>
                    </View>

                    <View>
                      <Tooltip
                        title={profileInfo?.savings_sbd?.toLocaleString(
                          'en-US',
                        )}>
                        <Text>
                          $ {abbreviateNumber(profileInfo.savings_sbd, 3)}
                        </Text>
                      </Tooltip>
                    </View>
                  </VStack>
                }
                amountPrefix="$"
                expanableHeight={50}
                expanadedView={
                  <Text
                    style={{marginTop: 10, textAlign: 'justify'}}
                    variant="bodySmall">
                    Balances subject to 3 day withdraw waiting period.
                  </Text>
                }
              />

              {trx ? (
                <CurrencyView
                  hideMenuButton={hideMenuButton}
                  menuItems={
                    <>
                      {/* <Menu.Item onPress={() => { }} titleStyle={{ fontSize: 12 }}
                                leadingIcon='transfer' title={'Transfer'} /> */}
                    </>
                  }
                  mt={10}
                  currencytitle={'TRX'}
                  disableMenu
                  amount={
                    <View>
                      <Tooltip
                        title={trx?.trx_balance?.toLocaleString('en-US')}>
                        <Text>{abbreviateNumber(trx?.trx_balance, 3)}</Text>
                      </Tooltip>
                    </View>
                  }
                  expanableHeight={50}
                  expanadedView={
                    <HStack mt={10} spacing={6} items="center">
                      <Text style={{textAlign: 'justify'}} variant="bodySmall">
                        {trx?.tron_addr}
                      </Text>

                      <Button
                        mode="elevated"
                        compact
                        onPress={() => {
                          writeToClipboard(trx?.tron_addr);
                        }}
                        labelStyle={{
                          fontSize: 12,
                          marginVertical: 2,
                          marginHorizontal: 4,
                        }}>
                        COPY
                      </Button>
                    </HStack>
                  }
                />
              ) : null}
            </ScrollView>
          )
        );
      }, [
        profileInfo,
        hideMenuButton,
        transferDialog,
        powerupDialog,
        expiring,
        expiringData,
        trx,
        menuClick,
      ])}

      {transferDialog.open ? (
        <TransferModal
          isSteem={transferDialog.isSteem}
          visible={transferDialog.open}
          setVisible={() => setTransferDialog({...transferDialog, open: false})}
        />
      ) : null}
      {powerDownModal.open && (
        <PowerDownModal
          visible={powerDownModal.open}
          cancel={powerDownModal.cancel}
          setVisible={() => setPowerDownModal({open: false})}
        />
      )}
      {powerupDialog ? (
        <PowerupModal
          isSaving={powerupDialog.isSaving}
          visible={powerupDialog.open}
          isSteem={powerupDialog.isSteem}
          setVisible={setPowerupDialog}
        />
      ) : null}
    </VStack>
  );
};

export {WalletInfo};
