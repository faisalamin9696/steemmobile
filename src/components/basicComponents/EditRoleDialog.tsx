import {HStack, VStack} from '@react-native-material/core';
import {Button, Card, Dialog, Text} from 'react-native-paper';
import BadgeAvatar from './BadgeAvatar';
import {Modal, View} from 'react-native';
import {PureComponent, useMemo, useState} from 'react';
import {AppColors} from '../../constants/AppColors';
import CardTextInput from './CardTextInput';
import {Role} from '../../utils/community';
import {
  setUserRole,
  setUserRoleTitle,
  setUserTitle,
} from '../../steem/CondenserApis';
import {useAppSelector} from '../../constants/AppFunctions';
import {AppConstants} from '../../constants/AppConstants';
import {getCredentials} from '../../utils/realm';
import {useMutation} from '@tanstack/react-query';
import DropdownItem from './DropdownItem';
import {useDispatch} from 'react-redux';
import {savePostHandler} from '../../redux/reducers/PostReducer';

interface Props {
  feed_api: string;
  type: any;
  account: string;
  comment: Post;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  cancelable?: boolean;
  isAccount?: boolean;
}

const EditRoleDialog = (props: Props) => {
  const {comment, visible, setVisible} = props;
  const hideEditDialog = () => setVisible(false);
  const [title, setTitle] = useState(comment.author_title);
  const [role, setRole] = useState<
    'muted' | 'guest' | 'member' | 'mod' | 'admin' | 'owner' | ''
  >(comment.author_role);
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  let items;
  const observerRole = comment.observer_role;
  const isSameRole = comment.author_role === comment.observer_role;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  if (Role.atLeast(observerRole, 'owner')) {
    items = [
      {item: 'ADMIN', value: 'admin'},
      {item: 'MODERATOR', value: 'mod'},
      {item: 'GUEST', value: 'guest'},
      {item: 'MUTED', value: 'muted'},
    ];
  } else if (Role.atLeast(observerRole, 'admin')) {
    items = [
      {item: 'MODERATOR', value: 'mod'},
      {item: 'GUEST', value: 'guest'},
      {item: 'MUTED', value: 'muted'},
    ];
  } else if (Role.atLeast(observerRole, 'mod')) {
    items = [
      {item: 'MEMBER', value: 'member'},
      {item: 'GUEST', value: 'guest'},
      {item: 'MUTED', value: 'muted'},
    ];
  }

  class AuthorTitleCard extends PureComponent {
    render() {
      return (
        comment.author_title && (
          <Card mode="elevated">
            <Card.Content
              style={{
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderColor: AppColors.STEEM,
                alignItems: 'center',
              }}>
              <Text style={{fontSize: 10, opacity: 0.8}}>
                {comment.author_title}
              </Text>
            </Card.Content>
          </Card>
        )
      );
    }
  }

  const roleTitleMutation = async (credentials: any) => {
    await roleMutation.mutateAsync(credentials);
    await titleMutation.mutateAsync(credentials);
  };

  const roleMutation = useMutation({
    mutationFn: (credentials: any) =>
      setUserRole(loginInfo, credentials.password, {
        communityId: comment.category,
        account: comment.author,
        role: role || 'guest',
      }),
    onSuccess() {
      dispatch(savePostHandler({...comment, author_role: role}));
      AppConstants.SHOW_TOAST('Done', '', 'success');
      hideEditDialog();
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
    onSettled() {
      setLoading(false);
    },
  });

  const titleMutation = useMutation({
    mutationFn: (credentials: any) =>
      setUserTitle(loginInfo, credentials.password, {
        communityId: comment.category,
        account: comment.author,
        title: title,
      }),
    onSuccess() {
      dispatch(savePostHandler({...comment, author_title: title}));
      AppConstants.SHOW_TOAST('Done', '', 'success');
      hideEditDialog();
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
    onSettled() {
      setLoading(false);
    },
  });

  const handleSaveClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }

    if (title === comment.author_title && role === comment.author_role) {
      AppConstants.SHOW_TOAST('Nothing to change', '', 'info');
      return;
    }
    if (comment.author_role === '') {
      comment.author_role = 'guest';
    }

    setLoading(true);
    const credentials = await getCredentials();
    if (credentials) {
      if (title !== comment.author_title && role !== comment.author_role) {
        roleTitleMutation(credentials);
      } else if (role !== comment.author_role) {
        roleMutation.mutate(credentials);
      }
      if (title !== comment.author_title) {
        titleMutation.mutate(credentials);
      }
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
      setLoading(false);
    }
  };
  return useMemo(() => {
    return (
      <Modal
        onRequestClose={hideEditDialog}
        animationType="none"
        visible={visible}
        transparent>
        <Dialog
          visible={visible}
          dismissable={!loading ?? true}
          theme={{
            roundness: 2,
            animation: {scale: 0, defaultAnimationDuration: 0},
          }}
          onDismiss={hideEditDialog}>
          <Dialog.Content>
            <VStack spacing={10}>
              <HStack items="center" spacing={15}>
                <View>
                  <BadgeAvatar
                    name={comment.author}
                    reputation={comment.author_reputation}
                  />
                </View>
                <VStack>
                  <HStack spacing={4}>
                    <Text variant="labelMedium">{comment?.author}</Text>
                    <View>
                      {comment.author_role && (
                        <Text
                          style={{
                            fontSize: 8,
                            textTransform: 'uppercase',
                            opacity: 0.75,
                          }}
                          variant={'labelSmall'}>
                          {comment.author_role}
                        </Text>
                      )}
                    </View>
                  </HStack>

                  <AuthorTitleCard />
                </VStack>
              </HStack>
              <VStack spacing={4}>
                <HStack items="center" spacing={30}>
                  <Text variant="labelSmall">Title</Text>
                  <View style={{flex: 1}}>
                    <CardTextInput
                      disabled={loading}
                      inputStyle={{fontSize: 14}}
                      value={title}
                      placeholder="Enter title"
                      onChangeText={setTitle}
                    />
                  </View>
                </HStack>

                <HStack items="center" spacing={30}>
                  <Text
                    variant="labelSmall"
                    style={{opacity: isSameRole ? 0.5 : 1}}>
                    Role
                  </Text>

                  <DropdownItem
                    disabled={isSameRole || loading}
                    value={role}
                    items={items}
                    cardStyle={{
                      alignSelf: 'center',
                      width: 150,
                    }}
                    dropdownStyle={{width: undefined}}
                    onChange={(item: any) => {
                      setRole(item.value);
                    }}
                  />
                </HStack>
              </VStack>
            </VStack>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                hideEditDialog();
              }}
              disabled={loading}>
              Cancel
            </Button>
            <Button
              onPress={handleSaveClick}
              loading={loading}
              disabled={loading}>
              Update
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Modal>
    );
  }, [comment, title, role, loading]);
};

export default EditRoleDialog;
