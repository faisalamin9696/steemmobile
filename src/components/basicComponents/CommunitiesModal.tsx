import {HStack, VStack} from '@react-native-material/core';
import {PureComponent, useEffect, useState} from 'react';
import {Card, Text} from 'react-native-paper';
import {
  FlatList,
  Modal,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import {AppColors} from '../../constants/AppColors';
import {useAppSelector} from '../../constants/AppFunctions';
import {getAccountCommunities} from '../../steem/SteemApis';
import {useDispatch} from 'react-redux';
import MainWrapper from '../wrappers/MainWrapper';
import ModalHeader from './ModalHeader';
import {saveLoginInfo} from '../../utils/handlers';
import {parseUsername} from '../../utils/user';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {LottieLoading} from './LottieLoading';
import LottieError from './LottieError';
import BadgeAvatar from './BadgeAvatar';
import {empty_community} from '../../utils/placeholders';
import SearchBar from './SearchBar';
import {AppConstants} from '../../constants/AppConstants';
import {useRefreshByUser} from '../../utils/useRefreshByUser';

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onSelect: (community: Community) => void;
  setClear?: boolean;
}

const CommunitiesModal = (props: Props) => {
  const {visible, setVisible, setClear, onSelect} = props;

  let loginInfo = useAppSelector(state => state.loginReducer.value);
  const dispatch = useDispatch();
  const hideBenefDialog = () => setVisible(false);
  let [searchText, setSearchText] = useState('');

  const queryClient = useQueryClient();

  const accountCommunityKey = `communities-${loginInfo.name}`;
  const [rows, setRows] = useState(
    queryClient.getQueryData<Community[] | undefined>([accountCommunityKey]) ??
      [],
  );

  const {data, isLoading, refetch, error, isSuccess, isFetched, isError} =
    useQuery({
      enabled: !!loginInfo.name && rows?.length === 0,
      queryKey: [accountCommunityKey],
      queryFn: () => getAccountCommunities(loginInfo.name, loginInfo.name),
      retryDelay: 5000,
    });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (isSuccess) {
      setRows(data);
      saveLoginInfo(dispatch, {...loginInfo, communities: data});
    }
    if (isError) AppConstants.SHOW_TOAST('Failed', String(error), 'error');
  }, [isSuccess, isFetched, isError]);

  const filteredItems = rows?.filter(
    item =>
      (item.account &&
        item.account?.toLowerCase().includes(parseUsername(searchText))) ||
      (item.title &&
        item.title?.toLowerCase().includes(searchText?.toLowerCase())),
  );

  class CommunityItem extends PureComponent<{item: Community; index: number}> {
    render() {
      const {item, index} = this.props;

      return (
        <TouchableOpacity
          onPress={() => {
            onSelect(item);
            hideBenefDialog();
          }}>
          <Card style={{marginTop: 4}} mode="contained">
            <Card.Content style={{paddingVertical: 6, paddingHorizontal: 6}}>
              <VStack>
                <HStack items="center" spacing={10}>
                  <View>
                    <BadgeAvatar
                      name={item.account}
                      reputation={item.account_reputation}
                    />
                  </View>
                  <VStack>
                    <Text>{item.title} </Text>
                    <View>
                      <Text>{item.account} </Text>
                    </View>
                  </VStack>
                </HStack>
              </VStack>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      );
    }
  }

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={hideBenefDialog}
      onDismiss={hideBenefDialog}>
      <MainWrapper>
        <VStack
          fill
          spacing={6}
          style={{paddingHorizontal: 20, paddingTop: 20}}>
          <ModalHeader title="Select Community" onClose={hideBenefDialog} />
          {isLoading ? (
            <LottieLoading loading={true} />
          ) : error ? (
            <LottieError
              error={error?.['message']}
              loading={error !== undefined}
              onTryAgain={() => {
                queryClient.invalidateQueries({
                  queryKey: [accountCommunityKey],
                });
                refetch();
              }}
            />
          ) : (
            <VStack spacing={6} fill mt={10}>
              <View>
                <SearchBar
                  placeholder="Search community..."
                  onChangeText={setSearchText}
                  value={searchText}
                />
              </View>

              <View>
                <CommunityItem
                  item={{
                    ...empty_community(loginInfo.name, 'My Blogs'),
                    account_reputation: loginInfo.reputation,
                  }}
                  index={1}
                />
              </View>
              <View
                style={{
                  backgroundColor: AppColors.LIGHT_GRAY,
                  height: 1,
                  width: '90%',
                  alignSelf: 'center',
                  opacity: 0.8,
                  marginVertical: 4,
                }}
              />

              {filteredItems ? (
                <FlatList
                  data={filteredItems}
                  contentContainerStyle={{paddingBottom: 40}}
                  ListEmptyComponent={() => (
                    <LottieError
                      buttonText="Refresh"
                      loading
                      onTryAgain={() => {
                        queryClient.invalidateQueries({
                          queryKey: [accountCommunityKey],
                        });
                        setRows([]);
                        refetchByUser();
                      }}
                    />
                  )}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefetchingByUser}
                      onRefresh={refetchByUser}
                    />
                  }
                  renderItem={({item, index}) => (
                    <CommunityItem item={item} index={index} />
                  )}
                />
              ) : null}
            </VStack>
          )}
        </VStack>
      </MainWrapper>
    </Modal>
  );
};

export default CommunitiesModal;
