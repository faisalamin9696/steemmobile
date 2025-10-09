import {VStack} from '@react-native-material/core';
import React, {useContext, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  Avatar,
  Card,
  MD2Colors,
  MD3Colors,
  Text,
  Tooltip,
} from 'react-native-paper';
import Icon, {Icons} from '../../../components/Icons';
import {AppColors} from '../../../constants/AppColors';
import {useAppSelector} from '../../../constants/AppFunctions';
import {getResizedAvatar} from '../../../utils/ImageApis';
import {parseAccountMeta} from '../../../utils/user';
import {useMutation} from '@tanstack/react-query';
import {followUser, unfollowUser} from '../../../steem/CondenserApis';
import {getCredentials} from '../../../utils/realm';
import {AppConstants} from '../../../constants/AppConstants';
import {AppRoutes} from '../../../constants/AppRoutes';
import {abbreviateNumber} from '../../../utils/utils';
import ConfirmationModal from '../../../components/basicComponents/ConfirmationModal';
import ViewBar from '../../../components/basicComponents/ViewBar';
import {useDispatch} from 'react-redux';
import {saveProfileHandler} from '../../../redux/reducers/ProfileReducer';
import {proxifyImageSrc} from '../../../utils/e-render/src';
import {PreferencesContext} from '../../../contexts/ThemeContext';

interface Props {
  navigation?: any;
  route: any;
  data: AccountExt;
  containerStyle?: ViewStyle;
  onExpanded?: (expanded: boolean) => void;
  isExpanded?: boolean;
  isAccount?: boolean;
}

const cardHeight = 160;

interface CustomAvatarProps {
  followLoading: boolean;
  unFollowLoading: boolean;
  data: AccountExt;
  handleEditClick: () => void;
  loginInfo: AccountExt;
  isSmall?: boolean;
}

const AccountHeader = (props: Props) => {
  const {navigation, data, isAccount, containerStyle, onExpanded, isExpanded} =
    props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const profileInfo =
    useAppSelector(state => state.profileReducer.value)?.[data.name] ?? data;
  const isSelf = isAccount;
  const parsed = parseAccountMeta(profileInfo?.posting_json_metadata ?? '{}');
  const [confirmation, setConfirmation] = useState(false);
  const [expanded, setExpanded] = useState(isExpanded ?? true);
  const description = parsed?.about || parsed.location || parsed.website || '';
  const dispatch = useDispatch();
  const {isThemeDark} = useContext(PreferencesContext);

  const followMutation = useMutation({
    mutationFn: (credentials: any) =>
      followUser(loginInfo, credentials.password, {
        follower: loginInfo.name,
        following: profileInfo.name,
      }),
    onSuccess() {
      dispatch(
        saveProfileHandler({...profileInfo, observer_follows_author: 1}),
      );
      AppConstants.SHOW_TOAST('Followed', '', 'success');
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (credentials: any) =>
      unfollowUser(loginInfo, credentials.password, {
        follower: loginInfo.name,
        following: profileInfo.name,
      }),
    onSuccess() {
      dispatch(
        saveProfileHandler({...profileInfo, observer_follows_author: 0}),
      );
      AppConstants.SHOW_TOAST('Unfollowed', '', 'success');
    },
    onError(error) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
  });

  const handleUnfollowClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '', 'info');
      return;
    }
    const credentials = await getCredentials();
    if (credentials) {
      unfollowMutation.mutate(credentials);
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const handleFollowClick = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '', 'info');
      return;
    }
    const credentials = await getCredentials();
    if (credentials) {
      followMutation.mutate(credentials);
    } else {
      AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
    }
  };

  const handleEditClick = () => {
    navigation.navigate(AppRoutes.PAGES.EditAccountPage);
  };

  return (
    <>
      {useMemo(() => {
        return (
          <VStack
            style={[
              styles.container,
              containerStyle,
              {height: expanded ? cardHeight : 50},
            ]}>
            <View
              style={{
                position: 'absolute',
                height: '100%',
                width: '100%',
              }}>
              {profileInfo && (
                <View>
                  {parsed.coverImage ? (
                    <Card.Cover
                      theme={{roundness: 2}}
                      style={{
                        height: '100%',
                        width: '100%',
                        backgroundColor: AppColors.GLASS_COLOR,
                        opacity: 0.9,
                      }}
                      source={{
                        uri: proxifyImageSrc(parsed.coverImage, 640),
                      }}
                    />
                  ) : null}
                  <View
                    style={{
                      height: '100%',
                      width: '100%',
                      borderRadius: 4,
                      backgroundColor: AppColors.BLACK,
                      opacity: 0.6,
                      position: 'absolute',
                    }}
                  />

                  <View
                    style={{
                      justifyContent: 'center',
                      alignSelf: 'center',
                      position: 'absolute',
                    }}>
                    <VStack
                      style={{
                        alignItems: 'center',
                        width: '100%',
                      }}>
                      {expanded ? (
                        <VStack items="center">
                          <View>
                            <CustomAvatar
                              followLoading={followMutation.isPending}
                              handleEditClick={() => {
                                isSelf
                                  ? handleEditClick()
                                  : setConfirmation(true);
                              }}
                              loginInfo={loginInfo}
                              unFollowLoading={unfollowMutation.isPending}
                              data={profileInfo}
                            />
                          </View>

                          <Text
                            key={'expandedtext'}
                            variant="labelSmall"
                            style={{
                              color: 'white',
                              fontWeight: 'bold',
                              marginTop: 5,
                            }}>
                            @{profileInfo.name}{' '}
                            {` (${
                              profileInfo?.reputation !== 0
                                ? profileInfo.reputation?.toFixed(2)
                                : 25
                            })`}
                          </Text>

                          {parsed.username ? (
                            <Text
                              variant="bodyMedium"
                              style={{color: 'white', marginTop: 3}}>
                              {parsed.username}
                            </Text>
                          ) : null}
                          <Text
                            numberOfLines={1}
                            style={{
                              color: 'white',
                              paddingHorizontal: 50,
                              textAlign: 'center',
                              opacity: 0.8,
                              fontStyle: 'italic',
                              fontSize: 10,
                            }}>
                            {description}
                          </Text>
                        </VStack>
                      ) : (
                        <VStack items="center">
                          <Text
                            key={'!expandedtext'}
                            variant="labelSmall"
                            style={{
                              color: 'white',
                              fontWeight: 'bold',
                              marginTop: 4,
                            }}>
                            @{profileInfo.name}{' '}
                            {` (${
                              profileInfo?.reputation !== 0
                                ? profileInfo.reputation?.toFixed(2)
                                : 25
                            })`}
                          </Text>

                          <Text
                            numberOfLines={1}
                            style={{
                              color: 'white',
                              paddingHorizontal: 50,
                              textAlign: 'center',
                              opacity: 0.8,
                              fontStyle: 'italic',
                              fontSize: 10,
                            }}>
                            {description}
                          </Text>
                        </VStack>
                      )}
                    </VStack>
                  </View>
                  {expanded && (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        position: 'absolute',
                      }}>
                      <Tooltip
                        title={profileInfo.count_followers?.toLocaleString(
                          'en-US',
                        )}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            margin: 10,
                          }}
                          onPress={() => {
                            navigation.push(AppRoutes.PAGES.FollowersPage, {
                              account: profileInfo.name,
                              isFollowing: false,
                            });
                          }}>
                          <Card
                            theme={{roundness: 2}}
                            elevation={0}
                            style={{
                              backgroundColor: isThemeDark
                                ? MD3Colors.secondary0
                                : MD3Colors.secondary99,
                            }}>
                            <Card.Content
                              style={{
                                paddingVertical: 1,
                                paddingHorizontal: 10,
                              }}>
                              <VStack items="center">
                                <Text variant="labelLarge" style={{}}>
                                  Followers
                                </Text>

                                <View>
                                  <Text>
                                    {abbreviateNumber(
                                      Number(profileInfo.count_followers),
                                    )}
                                  </Text>
                                </View>
                              </VStack>
                            </Card.Content>
                          </Card>
                        </TouchableOpacity>
                      </Tooltip>
                    </View>
                  )}

                  {expanded && (
                    <View
                      style={{
                        alignSelf: 'flex-end',
                        position: 'absolute',
                      }}>
                      <Tooltip
                        title={profileInfo.count_following?.toLocaleString(
                          'en-US',
                        )}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            margin: 10,
                          }}
                          onPress={() => {
                            navigation.push(AppRoutes.PAGES.FollowersPage, {
                              account: profileInfo.name,
                              isFollowing: true,
                            });
                          }}>
                          <Card
                            theme={{roundness: 2}}
                            elevation={0}
                            style={{
                              backgroundColor: isThemeDark
                                ? MD3Colors.secondary0
                                : MD3Colors.secondary99,
                            }}>
                            <Card.Content
                              style={{
                                paddingVertical: 1,
                                paddingHorizontal: 10,
                              }}>
                              <VStack items="center">
                                <Text variant="labelLarge" style={{}}>
                                  Followings
                                </Text>

                                <View>
                                  <Text>
                                    {abbreviateNumber(
                                      Number(profileInfo.count_following),
                                    )}
                                  </Text>
                                </View>
                              </VStack>
                            </Card.Content>
                          </Card>
                        </TouchableOpacity>
                      </Tooltip>
                    </View>
                  )}

                  {!expanded && (
                    <View
                      style={{
                        position: 'absolute',
                        right: 10,
                        justifyContent: 'center',
                        alignSelf: 'flex-end',
                        alignItems: 'center',
                      }}>
                      <CustomAvatar
                        followLoading={followMutation.isPending}
                        isSmall
                        handleEditClick={() => {
                          isSelf ? handleEditClick() : setConfirmation(true);
                        }}
                        loginInfo={loginInfo}
                        unFollowLoading={unfollowMutation.isPending}
                        data={profileInfo}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            <ViewBar
              onPress={() => {
                if (onExpanded) onExpanded(!expanded);
                setExpanded(!expanded);
              }}
            />
          </VStack>
        );
      }, [profileInfo, followMutation, unfollowMutation, expanded])}

      <ConfirmationModal
        visible={confirmation}
        setVisible={setConfirmation}
        body={`Do you really want to ${
          profileInfo?.observer_follows_author ? 'unfollow' : 'follow'
        } ${profileInfo?.name}?`}
        primaryText="Yes"
        handlePrimaryClick={() => {
          profileInfo?.observer_follows_author
            ? handleUnfollowClick()
            : handleFollowClick();
        }}
      />
    </>
  );
};

export {AccountHeader};

const CustomAvatar = (props: CustomAvatarProps) => {
  const {
    followLoading,
    unFollowLoading,
    data,
    handleEditClick,
    loginInfo,
    isSmall,
  } = props;
  const isSelf = data?.name === loginInfo?.name;

  return (
    <VStack mt={isSmall ? 2 : 10}>
      <Avatar.Image
        style={{backgroundColor: MD2Colors.white}}
        source={{
          uri: getResizedAvatar(data.name, 'small'),
        }}
        size={isSmall ? 40 : 55}
      />

      {data && (
        <TouchableOpacity
          onPress={handleEditClick}
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            alignSelf: 'flex-end',
            justifyContent: 'center',
            padding: 2,
            position: 'absolute',
            bottom: 0,
          }}>
          {isSelf ? (
            <Icon
              type={Icons.MaterialCommunityIcons}
              name={'pencil'}
              color={'blue'}
              style={{}}
              size={isSmall ? 10 : 15}
            />
          ) : followLoading || unFollowLoading ? (
            <ActivityIndicator size={15} />
          ) : data ? (
            <View>
              {data?.observer_follows_author ? (
                <Icon
                  type={Icons.MaterialCommunityIcons}
                  name={'minus'}
                  color={'red'}
                  style={{}}
                  size={isSmall ? 10 : 15}
                />
              ) : (
                <Icon
                  type={Icons.MaterialCommunityIcons}
                  name={'plus'}
                  color={'green'}
                  style={{}}
                  size={isSmall ? 10 : 15}
                />
              )}
            </View>
          ) : null}
        </TouchableOpacity>
      )}
    </VStack>
  );
};
const styles = StyleSheet.create({
  container: {
    elevation: 4,
    borderColor: 'white',
    borderRadius: 6,
    backgroundColor: MD2Colors.red300,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'column',
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    height: cardHeight,
    marginTop: 4,
  },
});
