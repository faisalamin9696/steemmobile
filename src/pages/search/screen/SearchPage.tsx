import {Button, Card, IconButton, Text} from 'react-native-paper';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {HStack, VStack} from '@react-native-material/core';
import {useEffect, useMemo, useState} from 'react';
import RoundSegmentedButtons from '../../../components/segmented/RoundSegmentedButtons';
import {
  getAccountsByPrefix,
  getSearchedContent,
} from '../../../steem/SteemApis';
import {useAppSelector} from '../../../constants/AppFunctions';
import {AppConstants} from '../../../constants/AppConstants';
import {FlatList, LayoutAnimation, RefreshControl, View} from 'react-native';
import {LottieLoading} from '../../../components/basicComponents/LottieLoading';
import LottieError from '../../../components/basicComponents/LottieError';
import {parseAccountMeta} from '../../../utils/user';
import {delay} from '../../../utils/editor';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import CommentItem from '../../../components/comment';
import BasicDialog from '../../../components/basicComponents/BasicDialog';
import SearchBar from '../../../components/basicComponents/SearchBar';

const SearchPage = ({navigation, route}) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const [refreshing, setRefreshing] = useState(false);
  const [segmentValue, setSegmentValue] = useState<
    'all' | 'user' | 'tag' | 'comment'
  >('all');
  let [searchText, setSearchText] = useState('');
  let [rows, setRows] = useState<any[]>();
  let [allData, setAllData] = useState<any[]>();
  const [limit, setLimit] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(undefined);
  const [isLoadMore, setLoadMore] = useState(false);
  const [infoDialog, setInfoDialog] = useState(false);
  const settings = useAppSelector(state => state.settingsReducer.value);

  useEffect(() => {
    navigation.setOptions({
      title: `${!allData ? 'Search' : `Results (${allData?.length})`}`,
      headerRight: () => (
        <IconButton onPress={handleOnInfoClick} icon={'help-circle'} />
      ),
    });
  }, [rows]);

  const handleOnInfoClick = () => {
    setInfoDialog(true);
  };
  function resetAll() {
    rows = undefined;
    allData = undefined;
    setError(undefined);
    setAllData(undefined);
    setRows(undefined);
    setError(undefined);
  }
  const fetchData = async (api?: string) => {
    searchText = searchText?.trim();
    if (!searchText) return;

    getSearchedContent(searchText, loginInfo.name || 'null', api)
      .then(res => {
        setAllData(res);
        setRows(res.slice(0, limit));
        setError(undefined);
      })
      .catch(err => {
        AppConstants.SHOW_TOAST('Failed', String(err), 'error');
        setError(err);
      })
      .finally(() => {
        setRefreshing(false);
        setIsLoading(false);
      });
  };

  const fetchAccounts = async () => {
    searchText = searchText?.trim();
    if (!searchText) return;

    getAccountsByPrefix(searchText, loginInfo.name || 'null')
      .then(res => {
        setAllData(res);
        setRows(res.slice(0, limit));
        setError(undefined);
      })
      .catch(err => {
        AppConstants.SHOW_TOAST('Failed', String(err), 'error');
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
        setRefreshing(false);
      });
  };

  const sortDataBy = async (sortBy: 'all' | 'user' | 'tag' | 'comment') => {
    if (!searchText) return;
    searchText = searchText?.trim();
    setIsLoading(true);
    if (!searchText) return;
    switch (sortBy) {
      case 'tag':
        resetAll();
        fetchData(`getPostsByTagsText/${searchText}`);
        break;
      case 'comment':
        resetAll();
        fetchData(`getCommentsByText`);
        break;
      case 'user':
        resetAll();
        fetchAccounts();
        break;

      default:
        fetchData();
        break;
    }
  };

  const handleOnSearchClick = () => {
    searchText = searchText?.trim();
    if (searchText) {
      sortDataBy(segmentValue);
    }
  };

  const loadMore = async data => {
    setLimit(prev => prev + 15);
    return delay(1500).then(() => {
      let newStart = allData?.slice(data?.length ?? 0);
      const newRow = newStart?.slice(1, 15);
      setLoadMore(false);
      return newRow;
    });
  };

  const handleEndReached = async () => {
    if (!isLoading && allData && allData?.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
      setLoadMore(true);
      const more = await loadMore(rows);
      if (more) setRows([...rows!, ...more!]);
    }
  };

  const handleSegmentChange = async value => {
    resetAll();
    setSegmentValue(value);
    sortDataBy(value);
  };

  const AccountItem = item => {
    const {name, reputation, json_metadata, posting_json_metadata} = item?.item;
    const parsed = parseAccountMeta(posting_json_metadata ?? '{}');
    return (
      <Card mode="contained">
        <Card.Content>
          <HStack spacing={10} items="center">
            <HStack>
              <BadgeAvatar
                navigation={navigation}
                name={name}
                reputation={reputation}
              />
            </HStack>
            <VStack spacing={4}>
              <HStack items="center">
                {parsed.username && (
                  <Text variant="labelMedium">{parsed.username ?? ''}</Text>
                )}
              </HStack>
              <Text>{name}</Text>
            </VStack>
          </HStack>
        </Card.Content>
      </Card>
    );
  };
  return (
    <MainWrapper>
      <VStack fill ph={4} mt={4} spacing={6}>
        <View>
          <SearchBar
            placeholder="Search query..."
            onChangeText={setSearchText}
            value={searchText}
            onSubmitEditing={handleOnSearchClick}
            onIconPress={handleOnSearchClick}
          />
        </View>
        <View>
          <RoundSegmentedButtons
            scrollable
            density="high"
            value={segmentValue}
            onValueChange={handleSegmentChange}
            style={{
              paddingHorizontal: 10,
            }}
            buttons={[
              {
                value: 'all',
                label: 'All',
                style: {borderWidth: 0.2, minWidth: 40},
              },
              {
                value: 'user',
                label: 'Users',
                style: {borderWidth: 0.2, minWidth: 60},
              },
              {
                value: 'tag',
                label: 'Tags',
                style: {borderWidth: 0.2, minWidth: 50},
              },
              {
                value: 'comment',
                label: 'Comments',
                style: {borderWidth: 0.2, minWidth: 80},
              },
            ]}
          />
        </View>
        <View style={{flex: 1}}>
          {useMemo(() => {
            return isLoading && searchText ? (
              <LottieLoading loading={true} />
            ) : error ? (
              <Text style={{alignSelf: 'center'}}>
                <LottieError
                  error={error?.['message'] || ''}
                  loading={true}
                  onTryAgain={() => {
                    setRefreshing(true);
                    sortDataBy(segmentValue);
                  }}
                />
              </Text>
            ) : (
              <FlatList
                keyboardShouldPersistTaps="always"
                data={rows}
                overScrollMode="never"
                contentContainerStyle={{paddingBottom: 80}}
                ListEmptyComponent={() => (
                  <LottieError buttonText="Refresh" loading empty />
                )}
                onEndReachedThreshold={0.5}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      sortDataBy(segmentValue);
                    }}
                  />
                }
                ListFooterComponent={() =>
                  allData && allData.length > 0 ? (
                    <Button
                      loading={isLoadMore}
                      disabled={isLoadMore}
                      mode="contained"
                      style={{alignSelf: 'center', marginVertical: 6}}
                      labelStyle={{
                        marginHorizontal: 8,
                        marginVertical: 4,
                        fontSize: 12,
                      }}
                      compact
                      onPress={handleEndReached}>
                      Load More
                    </Button>
                  ) : null
                }
                renderItem={({item}) => {
                  return segmentValue === 'user' ? (
                    <AccountItem item={item} />
                  ) : (
                    <CommentItem
                      settings={settings}
                      navigation={navigation}
                      route={route}
                      comment={item}
                      isBlog
                      isSearch
                    />
                  );
                }}
                ItemSeparatorComponent={() => (
                  <VStack style={{marginVertical: 4}} />
                )}
                removeClippedSubviews
                maxToRenderPerBatch={15}
                initialNumToRender={15}
                scrollEventThrottle={16}
              />
            );
          }, [segmentValue, isLoading, refreshing, rows, isLoadMore, error])}
        </View>
      </VStack>

      {infoDialog ? (
        <BasicDialog
          cancelable
          showActions
          title={'Searching tips'}
          body={`◉ For an exact search, enclose your text within double quotation marks at the beginning and end.\n
◉ Use uppercase AND / OR / NOT for advanced searching.\n
◉ Example: To search for posts containing the exact phrase 'this is fun', combined with 'crazy' and excluding 'winter' ,\n\nQuery: "this is fun" AND crazy NOT winter.
            `}
          visible={infoDialog}
          setVisible={setInfoDialog}
        />
      ) : null}
    </MainWrapper>
  );
};

export {SearchPage};
