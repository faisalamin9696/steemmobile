import {HStack, VStack} from '@react-native-material/core';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import {Card, MD2Colors, Text} from 'react-native-paper';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import ModalHeader from '../../../components/basicComponents/ModalHeader';
import React, {PureComponent, useEffect, useMemo, useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {getCommentVotes, getSimplePost} from '../../../steem/SteemApis';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import LottieError from '../../../components/basicComponents/LottieError';
import {AppFunctions, useAppSelector} from '../../../constants/AppFunctions';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import TimeAgoWrapper from '../../../components/wrappers/TimeAgoWrapper';
import RoundSegmentedButtons from '../../../components/segmented/RoundSegmentedButtons';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

const VotersPage = ({navigation, route}) => {
  const {comment} = route.params;
  const hideDialog = () => navigation.pop();
  const votersKey = `${comment.permlink}-Voters`;
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<PostVote[]>();
  const [segmentValue, setSegmentValue] = useState<
    'rshares' | 'percent' | 'time'
  >('rshares');
  const [totalVotes, setTotalVotes] = useState('');

  const {
    data: postData,
    isLoading,
    error,
    refetch,
    isSuccess,
    isFetched,
  } = useQuery({
    queryKey: [`voters-${comment.author}-${comment.permlink}`],
    queryFn: () => getSimplePost(comment.author, comment.permlink),
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  const sortVoterBy = (
    data: Post | undefined,
    sortBy: 'rshares' | 'percent' | 'time',
  ) => {
    if (data) {
      if (voters && voters?.length) {
        setTotalVotes(String(voters.length));
        const filtered = (data = voters.sort((a, b) => b[sortBy] - a[sortBy]));
        queryClient.setQueryData([votersKey], filtered);
        setRows(filtered);
        return filtered;
      }
    }
  };

  useEffect(() => {
    if (isSuccess) {
      sortVoterBy(postData, segmentValue);
    }
  }, [isSuccess, isFetched]);

  const voters = useMemo(
    () => AppFunctions.MapSDS({result: postData?.votes}) ?? [],
    [postData],
  );

  useEffect(() => {
    if (voters) {
      sortVoterBy(postData, segmentValue);
    }
  }, [voters]);

  const ratio = (postData?.payout ?? 1) / (postData?.net_rshares ?? 1);

  class VoterItem extends PureComponent<{item; index}> {
    render() {
      const {item, index} = this.props;
      const voteAmount = item['rshares'] * ratio;
      return (
        <Card key={index ?? item.voter} mode="contained">
          <Card.Content style={{paddingVertical: 6, paddingHorizontal: 6}}>
            <HStack spacing={10}>
              <View>
                <BadgeAvatar navigation={navigation} name={item.voter} />
              </View>
              <VStack spacing={6}>
                <HStack spacing={8}>
                  <Text variant="labelMedium">{item.voter}</Text>
                  <View>
                    <TimeAgoWrapper date={item.time * 1000} />
                  </View>
                </HStack>

                <Text>{`$${voteAmount.toFixed(
                  voteAmount >= 0.001 && voteAmount < 0.009 ? 3 : 2,
                )} (${item['percent'] / 100}%)`}</Text>
              </VStack>
            </HStack>
          </Card.Content>
        </Card>
      );
    }
  }

  const handleSegmentChange = async value => {
    setSegmentValue(value);
    if (postData) sortVoterBy(postData, value);
  };

  return (
    <MainWrapper>
      <VStack fill style={{paddingHorizontal: 20, paddingTop: 20}}>
        {useMemo(() => {
          return (
            <ModalHeader
              title={`${`Voters ${(totalVotes && `(${totalVotes})`) || ''}`}`}
              onClose={hideDialog}
            />
          );
        }, [totalVotes])}

        <RoundSegmentedButtons
          density="high"
          value={segmentValue}
          onValueChange={handleSegmentChange}
          style={{
            borderColor: MD2Colors.red400,
            paddingHorizontal: 10,
            marginTop: 10,
          }}
          buttons={[
            {value: 'rshares', label: 'REWARDS', style: {borderWidth: 0.2}},
            {value: 'percent', label: 'PERCENT', style: {borderWidth: 0.2}},
            {value: 'time', label: 'TIME', style: {borderWidth: 0.2}},
          ]}
        />

        <VStack fill spacing={6} mt={8}>
          {/* <Text style={{ marginTop: 5 }}>Who should receive any rewards?</Text> */}
          {isLoading ? (
            <LottieLoading loading={true} />
          ) : error ? (
            <LottieError
              error={error?.['message']}
              loading={error !== undefined}
              onTryAgain={refetchByUser}
            />
          ) : (
            <>
              {postData && (
                <FlatList
                  data={rows}
                  overScrollMode="never"
                  contentContainerStyle={{paddingBottom: 40}}
                  ListEmptyComponent={() =>
                    !isLoading && !postData ? (
                      <LottieError
                        buttonText="Refresh"
                        loading
                        onTryAgain={refetchByUser}
                      />
                    ) : null
                  }
                  onEndReachedThreshold={0.5}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefetchingByUser}
                      onRefresh={refetchByUser}
                    />
                  }
                  renderItem={({item, index}) => (
                    <VoterItem item={item} index={index} />
                  )}
                  ItemSeparatorComponent={() => (
                    <VStack style={{marginVertical: 4}} />
                  )}
                  removeClippedSubviews
                  maxToRenderPerBatch={15}
                  initialNumToRender={15}
                  scrollEventThrottle={16}
                />
              )}
            </>
          )}
        </VStack>
      </VStack>
    </MainWrapper>
  );
};

export {VotersPage};

const styles = StyleSheet.create({
  tabBarStyle: {
    height: 30,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  tabBarItemStyle: {
    marginTop: -6,
    elevation: 0,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
});
