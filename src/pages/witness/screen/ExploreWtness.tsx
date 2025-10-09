import {HStack, VStack} from '@react-native-material/core';
import {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, View} from 'react-native';
import {Card, IconButton, MD2Colors, Text} from 'react-native-paper';
import {AuthorTitleCard} from '../../../components/basicComponents/AuthorTitleCard';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {getRankedWitness} from '../../../steem/SteemApis';
import {useAppSelector} from '../../../constants/AppFunctions';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import LottieError from '../../../components/basicComponents/LottieError';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import {abbreviateNumber} from '../../../utils/utils';
import {parseUsername} from '../../../utils/user';
import TimeAgoWrapper from '../../../components/wrappers/TimeAgoWrapper';
import Icon, {Icons} from '../../../components/Icons';
import {voteForWitness} from '../../../steem/CondenserApis';
import {AppConstants} from '../../../constants/AppConstants';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {getCredentials} from '../../../utils/realm';
import ConfirmationModal from '../../../components/basicComponents/ConfirmationModal';
import {saveLoginInfo} from '../../../utils/handlers';
import {useDispatch} from 'react-redux';
import SearchBar from '../../../components/basicComponents/SearchBar';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';
interface CommunityItemProps {
  navigation: any;
  item: Witness;
  index: number;
}

const WitnessItem = (props: CommunityItemProps) => {
  const {navigation, item, index} = props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const exploreWitnessKey = `witness-explored`;
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [confirmation, setConfirmation] = useState({
    visible: false,
    body: '',
  });

  const voteMutation = useMutation({
    mutationFn: (data: {credentials: any; approve: boolean}) =>
      voteForWitness(loginInfo, data.credentials.password, {
        from: loginInfo.name,
        witness: item.name,
        approved: data.approve,
      }),
    onSuccess(data, variables) {
      if (variables.approve) {
        AppConstants.SHOW_TOAST('Witness Approved', '', 'success');
        saveLoginInfo(dispatch, {
          ...loginInfo,
          witness_votes: loginInfo.witness_votes.concat([item.name]),
        });
      } else {
        saveLoginInfo(dispatch, {
          ...loginInfo,
          witness_votes: loginInfo.witness_votes.filter(
            item0 => item0 !== item.name,
          ),
        });
        AppConstants.SHOW_TOAST('Witness Vote Removed', '', 'success');
      }
    },
    onError(error, variables, context: any) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
      const oldData = context?.oldData;
      if (oldData) {
        queryClient.setQueryData([exploreWitnessKey], oldData);
      }
    },
    onMutate(variables) {
      const oldData = queryClient.getQueryData<Witness[]>([exploreWitnessKey]);
      if (oldData) {
        queryClient.setQueryData([exploreWitnessKey], () => {
          return oldData.map(item0 =>
            item0.name === item.name
              ? {
                  ...item0,
                  received_votes:
                    item0.received_votes + (variables.approve ? 1 : -1),
                  observer_votes_witness: variables.approve ? 1 : 0,
                }
              : item0,
          );
        });
      }
      return {oldData};
    },
  });

  const handleOnVoteClick = () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }
    let body = confirmation.body;
    if (item.observer_votes_witness)
      body = `Do you really want to remove your witness vote for ${item.name}?`;
    else body = `Do you really want to approve witness ${item.name}?`;
    setConfirmation({body: body, visible: true});
  };

  const handleOnConfirm = async () => {
    const credentials = await getCredentials();
    if (credentials) {
      voteMutation.mutate({
        credentials: credentials,
        approve: !item.observer_votes_witness,
      });
    } else AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
  };

  return (
    <Card mode="contained">
      <Card.Content style={{paddingVertical: 6, paddingHorizontal: 6}}>
        <VStack spacing={6}>
          <HStack items="center" spacing={10} fill>
            <View>
              <BadgeAvatar navigation={navigation} name={item.name} />
            </View>

            <VStack spacing={4}>
              <HStack items="center" spacing={4}>
                <Text>{item.name} </Text>

                <View>
                  <AuthorTitleCard
                    cardStyle={{paddingHorizontal: 10}}
                    title={`🥇 • ${item.rank}`}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 8,
                    textTransform: 'uppercase',
                    opacity: 0.75,
                  }}
                  variant={'labelSmall'}>
                  {item.running_version}
                </Text>
              </HStack>
              <HStack items="center" spacing={4}>
                <Text>Joined •</Text>
                <TimeAgoWrapper date={item.created * 1000} />
              </HStack>
            </VStack>
          </HStack>
          <VStack spacing={6}>
            <Card style={{alignSelf: 'flex-start'}}>
              <Card.Content style={{paddingHorizontal: 6, paddingVertical: 2}}>
                <Text>
                  {abbreviateNumber(item.received_votes)} votes •{' '}
                  {abbreviateNumber(item.produced_blocks)} blocks •{' '}
                  {abbreviateNumber(item.missed_blocks)} missed
                </Text>
              </Card.Content>
            </Card>
          </VStack>
        </VStack>
        <IconButton
          disabled={voteMutation.isPending}
          onPress={handleOnVoteClick}
          style={{position: 'absolute', right: 2, zIndex: 2}}
          size={30}
          mode="contained"
          icon={() =>
            voteMutation.isPending ? (
              <ActivityIndicator size={25} />
            ) : (
              <Icon
                type={Icons.MaterialCommunityIcons}
                name={
                  loginInfo.login && item.observer_votes_witness
                    ? 'chevron-up-circle'
                    : 'chevron-up-circle-outline'
                }
                color={MD2Colors.teal500}
                style={{}}
              />
            )
          }
        />
      </Card.Content>

      <ConfirmationModal
        visible={confirmation.visible}
        body={confirmation.body}
        setVisible={value => setConfirmation({...confirmation, visible: value})}
        handlePrimaryClick={handleOnConfirm}
        primaryText="Yes"
      />
    </Card>
  );
};

const ExploreWitness = ({navigation, route}) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const exploreWitnessKey = `witness-explored`;
  const [rows, setRows] = useState<Community[]>();
  const queryClient = useQueryClient();
  let [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    const response = await getRankedWitness(loginInfo.name || 'null');
    return response as Witness[];
  };

  const {refetch, isFetching, isLoading, data, error, isFetched, isError} =
    useQuery({
      queryKey: [exploreWitnessKey],
      queryFn: fetchData,
    });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);
  useEffect(() => {
    if (isError) AppConstants.SHOW_TOAST('Failed', String(error), 'error');
  }, [isFetched, isError, error]);

  const filteredItems =
    data &&
    data.filter(
      item =>
        item.name &&
        item.name.toLowerCase().includes(parseUsername(searchText)),
    );

  const loadMore = async data => {
    let newStart = rows?.slice(data?.length ?? 0);
    const newRow = newStart?.slice(1, 15);
    return newRow;
  };

  const mutation = useMutation({
    mutationFn: loadMore,
    onMutate: data => {
      queryClient.setQueryData([exploreWitnessKey], (previousData: any) => [
        ...previousData,
        ...data!,
      ]);
    },
  });

  const handleEndReached = async () => {
    if (!isFetching && data) {
      let newStart = rows?.slice(data?.length ?? 0);
      const newRow = newStart?.slice(0, 15);
      mutation.mutate(newRow);
    }
  };

  return (
    <MainWrapper>
      <VStack fill ph={4}>
        {isLoading ? (
          <LottieLoading loading={isLoading} />
        ) : error ? (
          <Text style={{alignSelf: 'center'}}>
            <LottieError
              error={error?.['message'] || ''}
              loading={error !== undefined}
              onTryAgain={refetch}
            />
          </Text>
        ) : (
          <VStack spacing={4} mt={4} fill>
            <View>
              <SearchBar
                placeholder="Search witness..."
                onChangeText={setSearchText}
                value={searchText}
              />
            </View>
            {filteredItems && (
              <FlatList
                keyboardShouldPersistTaps="always"
                overScrollMode="never"
                onEndReached={handleEndReached}
                data={filteredItems}
                onEndReachedThreshold={1}
                keyExtractor={(item, index) =>
                  `${index}-${item.name}/${item.rank}`
                }
                ItemSeparatorComponent={() => <View style={{marginTop: 5}} />}
                contentContainerStyle={{paddingBottom: 40}}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetchingByUser}
                    onRefresh={refetchByUser}
                  />
                }
                ListEmptyComponent={() => (
                  <LottieError
                    buttonText="Refresh"
                    loading
                    onTryAgain={refetchByUser}
                  />
                )}
                renderItem={({item, index}: any) => (
                  <WitnessItem
                    navigation={navigation}
                    item={item}
                    index={index}
                  />
                )}
                // ListFooterComponent={() => (data && rows && data!.length >= rows!.length) ? null : <LottieLinearLoading loading={true} />}
                removeClippedSubviews
                maxToRenderPerBatch={15}
                initialNumToRender={15}
                scrollEventThrottle={16}
              />
            )}
          </VStack>
        )}
      </VStack>
    </MainWrapper>
  );
};

export {ExploreWitness};
