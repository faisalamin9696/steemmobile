import {HStack, VStack} from '@react-native-material/core';
import {useContext, useEffect, useState} from 'react';
import {
  AnimatedFAB,
  Card,
  IconButton,
  MD2Colors,
  Text,
} from 'react-native-paper';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAppSelector} from '../../constants/AppFunctions';
import MainWrapper from '../wrappers/MainWrapper';
import ModalHeader from './ModalHeader';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {LottieLoading} from './LottieLoading';
import LottieError from './LottieError';
import SearchBar from './SearchBar';
import {deleteSnippet, getSnippets} from '../../utils/realm';
import {PreferencesContext} from '../../contexts/ThemeContext';
import {MaterialDarkTheme} from '../../utils/theme';
import {AppRoutes} from '../../constants/AppRoutes';
import Icon, {Icons} from '../Icons';
import {AppConstants} from '../../constants/AppConstants';
import ConfirmationModal from './ConfirmationModal';
import Toast from 'react-native-toast-message';
import {toastConfig} from '../../utils/toastConfig';
import {useRefreshByUser} from '../../utils/useRefreshByUser';

interface SnipItemProps {
  snipItem: Snippet;
  index: number;
  navigation: any;
  loginInfo: AccountExt;
  onSelect: (item: Snippet) => void;
  handleOnEditClick: (item: Snippet) => void;
}

const SnipItem = (props: SnipItemProps) => {
  const {snipItem, loginInfo, onSelect, handleOnEditClick} = props;
  const snipKey = `snip-${loginInfo.name}`;
  const [confirmation, setConfirmation] = useState(false);
  const queryClient = useQueryClient();

  const {isPending, mutate} = useMutation({
    mutationKey: [snipKey],
    mutationFn: () => deleteSnippet(loginInfo.name, snipItem.id),
    onSuccess() {
      AppConstants.SHOW_TOAST('Deleted', '', 'success');
      let oldData = queryClient.getQueryData<Snippet[] | undefined>([snipKey]);

      queryClient.setQueryData(
        [snipKey],
        oldData?.filter(item => item.id !== item.id),
      );
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
    onSettled() {},
  });

  const handleOnDelete = () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }

    setConfirmation(true);
  };

  const handleOnEdit = () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }

    handleOnEditClick(snipItem);
  };
  return (
    <HStack>
      <TouchableOpacity
        style={{flex: 1}}
        onPress={() => {
          onSelect(snipItem);
        }}>
        <Card style={{marginTop: 4}} mode="contained">
          <Card.Content style={{paddingVertical: 6, paddingHorizontal: 10}}>
            <HStack spacing={6} items="center" justify="between">
              <VStack spacing={10} fill>
                <Text numberOfLines={1} variant="labelLarge">
                  {snipItem.title}
                </Text>

                <Text numberOfLines={3} variant="bodySmall">
                  {snipItem.body}
                </Text>
              </VStack>

              <Card mode="elevated">
                <VStack justify="center">
                  <IconButton
                    mode={'contained-tonal'}
                    icon={() => (
                      <Icon
                        size={16}
                        type={Icons.MaterialCommunityIcons}
                        name={'pencil'}
                        color={MD2Colors.blue500}
                        style={{}}
                      />
                    )}
                    size={8}
                    onPress={handleOnEdit}
                  />

                  <IconButton
                    mode={'contained-tonal'}
                    icon={() =>
                      isPending ? (
                        <ActivityIndicator size={16} />
                      ) : (
                        <Icon
                          type={Icons.MaterialCommunityIcons}
                          name={'delete'}
                          color={MD2Colors.red400}
                          size={16}
                          style={{}}
                        />
                      )
                    }
                    size={8}
                    onPress={handleOnDelete}
                    disabled={isPending}
                  />
                </VStack>
              </Card>
            </HStack>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <ConfirmationModal
        visible={confirmation}
        setVisible={setConfirmation}
        handlePrimaryClick={mutate}
        body="Do you really want to delete this snippet?"
        primaryText="Delete"
      />
    </HStack>
  );
};

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onSelect: (snip: {title: string; body: string}) => void;
  setClear?: boolean;
  navigation: any;
}

const SnippetsModal = (props: Props) => {
  const {visible, setVisible, setClear, onSelect, navigation} = props;
  let loginInfo = useAppSelector(state => state.loginReducer.value);
  const hideSnipDialog = () => setVisible(false);
  const queryClient = useQueryClient();
  const snipKey = `snip-${loginInfo.name}`;
  let oldData = queryClient.getQueryData<Snippet[] | undefined>([snipKey]);
  const [data, setData] = useState<Snippet[] | undefined>(oldData || []);
  let [searchText, setSearchText] = useState('');
  const [isExtended, setExtended] = useState(true);
  const {isThemeDark} = useContext(PreferencesContext);

  const {
    isLoading,
    refetch,
    error,
    data: snipData,
    isFetched,
  } = useQuery({
    enabled: loginInfo.login === true,
    queryKey: [snipKey],
    queryFn: () => getSnippets(loginInfo.name),
    retryDelay: 10000,
  });

  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetch);

  useEffect(() => {
    if (snipData) setData(snipData || []);
  }, [snipData]);

  const onScroll = ({nativeEvent}) => {
    const currentScrollPosition =
      Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
    setExtended(currentScrollPosition <= 0);
  };

  const filteredItems =
    data &&
    data.filter(
      item =>
        item.title &&
        item.title?.toLowerCase()?.includes(searchText?.toLowerCase()),
    );

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={hideSnipDialog}
      onDismiss={hideSnipDialog}>
      <MainWrapper>
        <VStack
          fill
          spacing={6}
          style={{paddingHorizontal: 20, paddingTop: 20}}>
          <ModalHeader title="Snippets" onClose={hideSnipDialog} />
          {isLoading ? (
            <LottieLoading loading={true} />
          ) : error ? (
            <LottieError
              error={'Data not found'}
              loading={error !== undefined}
              onTryAgain={() => {
                queryClient.invalidateQueries({queryKey: [snipKey]});
                refetch();
              }}
            />
          ) : (
            <VStack spacing={6} fill mt={10}>
              <View>
                <SearchBar
                  placeholder="Search..."
                  onChangeText={setSearchText}
                  value={searchText}
                />
              </View>

              {filteredItems ? (
                <FlatList
                  data={filteredItems}
                  keyboardShouldPersistTaps="always"
                  contentContainerStyle={{paddingBottom: 40}}
                  ListEmptyComponent={() => (
                    <LottieError
                      buttonText="Refresh"
                      loading
                      onTryAgain={() => {
                        queryClient.invalidateQueries({queryKey: [snipKey]});
                        refetchByUser();
                      }}
                    />
                  )}
                  onScroll={onScroll}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefetchingByUser}
                      onRefresh={refetchByUser}
                    />
                  }
                  renderItem={({item, index}) => (
                    <SnipItem
                      key={index ?? item.id}
                      snipItem={item}
                      index={index}
                      navigation={navigation}
                      loginInfo={loginInfo}
                      onSelect={() => {
                        onSelect(item);
                        hideSnipDialog();
                      }}
                      handleOnEditClick={snipItem => {
                        navigation.navigate(AppRoutes.PAGES.NewSnippetPage, {
                          snippet: snipItem,
                        });
                        hideSnipDialog();
                      }}
                    />
                  )}
                />
              ) : null}
            </VStack>
          )}
        </VStack>

        <AnimatedFAB
          icon={'plus'}
          label={'Add Snippet'}
          extended={isExtended}
          onPress={() => {
            hideSnipDialog();
            navigation.navigate(AppRoutes.PAGES.NewSnippetPage);
          }}
          visible={true}
          animateFrom={'right'}
          iconMode={'dynamic'}
          style={[
            styles.fabStyle,
            {
              backgroundColor: isThemeDark
                ? MaterialDarkTheme.colors.primary
                : undefined,
            },
          ]}
        />
        <Toast position="top" topOffset={80} config={toastConfig} />
      </MainWrapper>
    </Modal>
  );
};

export default SnippetsModal;

const styles = StyleSheet.create({
  fabStyle: {
    bottom: 16,
    right: 16,
    position: 'absolute',
  },
});
