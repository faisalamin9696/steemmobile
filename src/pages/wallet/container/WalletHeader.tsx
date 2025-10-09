import {HStack, VStack} from '@react-native-material/core';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, ViewStyle} from 'react-native';
import CircularProgress, {
  ProgressRef,
} from 'react-native-circular-progress-indicator';
import {Button, Card, MD2Colors, Text, Tooltip} from 'react-native-paper';
import {useDispatch} from 'react-redux';
import PieChart from '../../../components/charts/pie/PieChart';
import {useAppSelector} from '../../../constants/AppFunctions';
import {getAccountExt, loadSteemGlobals} from '../../../steem/SteemApis';
import {AppConstants} from '../../../constants/AppConstants';
import {saveSteemGlobals} from '../../../redux/reducers/SteemGlobalReducer';
import TimeAgoWrapper from '../../../components/wrappers/TimeAgoWrapper';
import ExpandableView from '../../../components/basicComponents/ExpandableView';
import ViewBar from '../../../components/basicComponents/ViewBar';
import {useMutation} from '@tanstack/react-query';
import {saveProfileHandler} from '../../../redux/reducers/ProfileReducer';
import moment from 'moment';
import {saveLoginInfo} from '../../../utils/handlers';

interface Props {
  navigation: any;
  route: any;
  data: AccountExt;
  containerStyle?: ViewStyle;
  clubData: ClubData | undefined;
  onExpanded?: (expanded: boolean) => void;
  isExpanded?: boolean;
}

const cardHeight = 160;

const getClubString = (clubData: ClubData) => {
  if (!clubData) return '';
  const str =
    clubData.powered_up >= 100
      ? '100'
      : clubData.powered_up >= 75
      ? '75'
      : clubData.powered_up >= 50
      ? '50'
      : '';
  return str;
};

interface CustomProgressProps {
  title: string;
  value: number;
  tooltip: string;
  isSmall?: boolean | undefined;
}
const CustomProgress = (props: CustomProgressProps) => {
  let {title, value, tooltip, isSmall} = props;

  const progressProps = {
    radius: isSmall ? 22 : 35,
    inActiveStrokeOpacity: 0.5,
    activeStrokeWidth: isSmall ? 4 : 5,
    inActiveStrokeWidth: isSmall ? 6 : 15,
    duration: 1000,
  };

  return (
    <View>
      <Tooltip title={`${value}% ${tooltip}` || ''}>
        <CircularProgress
          key={'rc-circle'}
          {...progressProps}
          strokeLinecap="butt"
          titleColor={'white'}
          value={value ?? 0}
          progressValueStyle={{
            fontWeight: '200',
            color: 'white',
            fontSize: isSmall ? 10 : undefined,
          }}
          title={title}
          titleStyle={{marginTop: isSmall ? -5 : undefined}}
          activeStrokeSecondaryColor="yellow"
          inActiveStrokeColor="black"
          duration={1000}
          // dashedStrokeConfig={{
          //     count: 50,
          //     width: 2,
          // }}
          strokeColorConfig={[
            {color: 'red', value: 0},
            {color: 'skyblue', value: 75},
            {color: 'yellowgreen', value: 100},
          ]}
        />
      </Tooltip>
    </View>
  );
};

const WalletHeader = (props: Props) => {
  const {data, clubData, onExpanded, isExpanded} = props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const profileInfo =
    useAppSelector(state => state.profileReducer.value)[data.name] ?? data;

  const [sync, setSync] = useState(false);
  const vp_bar = useRef<ProgressRef>(null);
  const rc_bar = useRef<ProgressRef>(null);
  const isSelf = profileInfo?.name === loginInfo?.name;
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(isExpanded ?? true);

  useEffect(() => {
    if (onExpanded) onExpanded(expanded);
  }, [expanded]);

  const mutation = useMutation({
    mutationKey: [`userData-${loginInfo.name}`],
    mutationFn: () => getAccountExt(loginInfo?.name, 'null'),
    onSuccess(result) {
      dispatch(saveProfileHandler({...result, last_fetch: moment().unix()}));
      if (data.name === loginInfo.name) {
        saveLoginInfo(dispatch, {...result, last_fetch: moment().unix()});
      }
    },
    onSettled() {
      setSync(false);
    },
    onError(err) {
      AppConstants.SHOW_TOAST('Failed', String(err), 'error');
    },
  });

  const handleRefreshData = async () => {
    try {
      setSync(true);
      const global = await loadSteemGlobals();
      dispatch(saveSteemGlobals(global));
      await mutation.mutateAsync();
      vp_bar.current?.reAnimate();
      rc_bar.current?.reAnimate();
    } catch (error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
      setSync(false);
    }
  };

  const data_cols = [
    {
      name: 'in',
      amount: clubData?.transfer_in || 0,
      color: MD2Colors.blue400,
      legendFontColor: 'white',
      legendFontSize: 10,
    },
    {
      name: 'out',
      amount: clubData?.transfer_out || 0,
      color: MD2Colors.pink400,
      legendFontColor: 'white',
      legendFontSize: 10,
    },
    {
      name: 'up',
      amount: clubData?.powered_up || 0,
      color: MD2Colors.green400,
      legendFontColor: 'white',
      legendFontSize: 10,
    },
  ];

  const chartConfig = {
    backgroundColor: '#26872a',
    backgroundGradientFrom: '#43a047',
    backgroundGradientTo: '#66bb6a',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
      height: 2,
    },
  };

  return useMemo(() => {
    return (
      <View
        style={{
          width: '100%',
          height: expanded ? cardHeight : 50,
          marginTop: 4,
        }}>
        <Card
          key={'back-card'}
          mode="elevated"
          theme={{roundness: 2}}
          style={{
            height: '100%',
            backgroundColor: expanded ? MD2Colors.red300 : MD2Colors.red300,
          }}>
          {expanded && profileInfo ? (
            <ExpandableView
              animDuration={0}
              visible={expanded}
              maxHeight={cardHeight}>
              <>
                <Card.Content
                  style={{
                    height: '100%',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignContent: 'center',
                    alignItems: 'center',
                    zIndex: 2,
                  }}>
                  <View style={{marginTop: -10}} key={'pie-chart'}>
                    {profileInfo &&
                      clubData &&
                      clubData.powered_up +
                        clubData.transfer_in +
                        clubData.transfer_out >=
                        1 && (
                        <VStack>
                          <View>
                            <PieChart
                              data={data_cols}
                              width={170}
                              height={100}
                              chartConfig={chartConfig}
                              accessor={'amount'}
                              backgroundColor={'transparent'}
                              paddingLeft={'0'}
                              center={[0, 0, 0, 0]}
                              hasLegend={true}
                            />
                          </View>
                          <Text
                            style={{opacity: 0.5, color: 'white'}}
                            variant="labelSmall">
                            {getClubString(clubData)
                              ? 'CLUB: ' + getClubString(clubData)
                              : 'No CLUB'}
                            {` (${AppConstants.CLUB_MONTHS}-MONTHS)`}
                          </Text>
                        </VStack>
                      )}
                  </View>

                  <View
                    style={{
                      height: '100%',
                      justifyContent: 'center',
                      marginTop: -20,
                    }}>
                    {profileInfo ? (
                      <HStack spacing={10}>
                        <View>
                          <CustomProgress
                            title="VP"
                            tooltip={'Voting Power'}
                            value={profileInfo.upvote_mana_percent}
                          />
                        </View>

                        <View>
                          <CustomProgress
                            title="RC"
                            tooltip={'Resource Credit'}
                            value={profileInfo.rc_mana_percent}
                          />
                        </View>
                      </HStack>
                    ) : null}
                  </View>
                </Card.Content>
              </>
            </ExpandableView>
          ) : null}
          {isSelf && profileInfo ? (
            <Card
              onPress={handleRefreshData}
              style={{
                position: 'absolute',
                top: 0,
                zIndex: 2,
                alignSelf: 'flex-end',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 6,
                borderBottomRightRadius: 0,
                paddingRight: 4,
                opacity: 0.8,
              }}>
              <HStack center>
                <Button
                  mode="text"
                  loading={sync}
                  disabled={sync}
                  icon="sync"
                  labelStyle={{
                    marginVertical: 0,
                    fontSize: 12,
                    marginRight: 8,
                  }}>
                  Last update
                </Button>
                <TimeAgoWrapper date={loginInfo.last_fetch * 1000} />
              </HStack>
            </Card>
          ) : null}
        </Card>

        {!expanded && profileInfo && (
          <VStack
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}>
            <HStack spacing={10}>
              <View>
                <CustomProgress
                  title="VP"
                  tooltip={'Voting Power'}
                  value={profileInfo.upvote_mana_percent}
                  isSmall
                />
              </View>

              <View>
                <CustomProgress
                  title="RC"
                  tooltip={'Resource Credit'}
                  value={profileInfo.rc_mana_percent}
                  isSmall
                />
              </View>
            </HStack>
          </VStack>
        )}

        <ViewBar onPress={() => setExpanded(!expanded)} />
      </View>
    );
  }, [clubData, profileInfo, sync, loginInfo, expanded]);
};

export {WalletHeader};
