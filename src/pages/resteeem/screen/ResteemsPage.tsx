import {HStack, VStack} from '@react-native-material/core';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import ModalHeader from '../../../components/basicComponents/ModalHeader';
import React, {PureComponent, useEffect, useMemo, useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {getCommentResteems} from '../../../steem/SteemApis';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import LottieError from '../../../components/basicComponents/LottieError';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import TimeAgoWrapper from '../../../components/wrappers/TimeAgoWrapper';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

const ResteemsPage = ({navigation, route}) => {
  const {comment} = route.params;
  const hideDialog = () => navigation.pop();
  const votersKey = `${comment.permlink}-Resteems`;
  const [rows, setRows] = useState<PostResteem[]>();
  const [totalVotes, setTotalVotes] = useState('');

  const {
    data: votersData,
    isLoading,
    error,
    refetch,
    isSuccess,
    isFetched,
  } = useQuery({
    queryKey: [votersKey],
    queryFn: () => getCommentResteems(comment.author, comment.permlink),
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (isSuccess) {
      setTotalVotes(String(votersData.length));
      setRows(votersData);
    }
  }, [isSuccess, isFetched]);

  class VoterItem extends PureComponent<{item; index}> {
    render() {
      const {item, index} = this.props;
      return (
        <Card key={index ?? item.resteemer} mode="contained">
          <Card.Content style={{paddingVertical: 6, paddingHorizontal: 6}}>
            <HStack spacing={10}>
              <View>
                <BadgeAvatar navigation={navigation} name={item.resteemer} />
              </View>

              <VStack>
                <Text>{item.resteemer}</Text>
                <View>
                  <TimeAgoWrapper date={item.time * 1000} />
                </View>
              </VStack>
            </HStack>
          </Card.Content>
        </Card>
      );
    }
  }

  return (
    <MainWrapper>
      <VStack fill style={{paddingHorizontal: 20, paddingTop: 20}}>
        {useMemo(() => {
          return (
            <ModalHeader
              title={`${`Reblogs ${(totalVotes && `(${totalVotes})`) || ''}`}`}
              onClose={hideDialog}
            />
          );
        }, [totalVotes])}

        <VStack fill spacing={6} mt={8}>
          {/* <Text style={{ marginTop: 5 }}>Who should receive any rewards?</Text> */}
          {isLoading || !rows ? (
            <LottieLoading loading={true} />
          ) : error ? (
            <LottieError
              error={error?.['message']}
              loading={error !== undefined}
              onTryAgain={refetch}
            />
          ) : (
            <>
              {votersData && rows && (
                <FlatList
                  data={votersData}
                  overScrollMode="never"
                  contentContainerStyle={{paddingBottom: 40}}
                  ListEmptyComponent={() => (
                    <LottieError
                      buttonText="Refresh"
                      loading
                      onTryAgain={refetchByUser}
                    />
                  )}
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

export {ResteemsPage};

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
