import {HStack, VStack} from '@react-native-material/core';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {Card, MD2Colors, Text} from 'react-native-paper';
import {useEffect, useState} from 'react';
import {getCommunityReport} from '../../../steem/SteemApis';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {FlatList, RefreshControl, View} from 'react-native';
import SearchBar from '../../../components/basicComponents/SearchBar';
import LottieError from '../../../components/basicComponents/LottieError';
import {LottieLinearLoading} from '../../../components/basicComponents/LottieLinearLoading';
import {parseUsername} from '../../../utils/user';
import RoundSegmentedButtons from '../../../components/segmented/RoundSegmentedButtons';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import {AppConstants} from '../../../constants/AppConstants';
import {useRefreshByUser} from '../../../utils/useRefreshByUser';

const CommunityReportPage = ({navigation, route}) => {
  const {category} = route?.params;
  const [rows, setRows] = useState<CommunityReport[]>();
  let [searchText, setSearchText] = useState('');
  const [segmentValue, setSegmentValue] = useState<
    'author' | 'total_post_count' | 'total_comment_count'
  >('author');
  const reportKey = `Community-Report-${category}`;
  const queryClient = useQueryClient();

  useEffect(() => {
    navigation.setOptions({
      title: `Community Report (${category})`,
    });
  }, []);

  const {data, refetch, error, isLoading, isFetched, isError, isSuccess} =
    useQuery({
      queryKey: [reportKey],
      enabled: category !== undefined,
      gcTime: 0,
      queryFn: () => getCommunityReport(category),
    });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (isSuccess) {
      if (data) {
        setRows(sortDataBy(data, segmentValue));
      }
    }
    if (isError) AppConstants.SHOW_TOAST('Failed', String(error), 'error');
  }, [isFetched, isError, isSuccess]);

  const handleSegmentChange = async value => {
    setSegmentValue(value);
    if (data && rows) sortDataBy(rows, value);
  };

  const sortDataBy = (
    items: CommunityReport[],
    sortBy: 'author' | 'total_post_count' | 'total_comment_count',
  ) => {
    if (data) {
      let filtered;
      if (sortBy === 'author') {
        filtered = data.sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
      } else {
        filtered = data.sort((a, b) => b[sortBy] - a[sortBy]);
      }
      setRows(filtered);
      queryClient.setQueryData([reportKey], filtered);

      return filtered;
    }
  };

  const _renderItem = ({item}) => {
    return (
      <Card mode="contained">
        <Card.Content style={{paddingVertical: 6, paddingHorizontal: 6}}>
          <HStack items="center" spacing={10}>
            <View>
              <BadgeAvatar name={item.author} navigation={navigation} />
            </View>
            <VStack spacing={8}>
              <Text>{item.author}</Text>
              <Card style={{alignSelf: 'flex-start'}}>
                <Card.Content
                  style={{paddingHorizontal: 6, paddingVertical: 2}}>
                  <Text>
                    {item.total_post_count} Posts • {item.total_comment_count}{' '}
                    Comments • {item.unique_comment_count} Unique
                  </Text>
                </Card.Content>
              </Card>
            </VStack>
          </HStack>
        </Card.Content>
      </Card>
    );
  };

  const filteredItems =
    rows &&
    rows.filter(
      item =>
        item.author &&
        item.author?.toLowerCase().includes(parseUsername(searchText)),
    );

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
          <VStack mt={4} spacing={6} fill>
            <View>
              <SearchBar value={searchText} onChangeText={setSearchText} />
            </View>
            <View>
              <RoundSegmentedButtons
                density="high"
                value={segmentValue}
                onValueChange={handleSegmentChange}
                style={{
                  borderColor: MD2Colors.red400,
                  paddingHorizontal: 10,
                }}
                buttons={[
                  {
                    value: 'author',
                    label: 'Author',
                    style: {borderWidth: 0.2, minWidth: 35},
                  },
                  {
                    value: 'total_post_count',
                    label: 'Posts',
                    style: {borderWidth: 0.2},
                  },
                  {
                    value: 'total_comment_count',
                    label: 'Comments',
                    style: {borderWidth: 0.2, minWidth: 30},
                  },
                ]}
              />
            </View>

            {filteredItems && (
              <FlatList
                overScrollMode="never"
                data={filteredItems}
                onEndReachedThreshold={1}
                keyExtractor={(item, index) => `${index}-${item.author}`}
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
                renderItem={_renderItem}
                ListFooterComponent={() =>
                  data && rows && data!.length >= rows!.length ? null : (
                    <LottieLinearLoading loading={true} />
                  )
                }
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

export default CommunityReportPage;
