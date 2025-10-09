import {HStack, VStack} from '@react-native-material/core';
import {Avatar, Button, Card, MD2Colors, Text} from 'react-native-paper';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import React, {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useAppSelector} from '../../../constants/AppFunctions';
import CardTextInput from '../../../components/basicComponents/CardTextInput';
import {ActivityIndicator, StyleProp, TextStyle, View} from 'react-native';
import {getResizedAvatar} from '../../../utils/ImageApis';
import {AppColors} from '../../../constants/AppColors';
import {parseAccountMeta} from '../../../utils/user';
import ImagePickerButton from '../../../components/basicComponents/ImagePickerButton';
import {AppConstants} from '../../../constants/AppConstants';
import {getCredentials} from '../../../utils/realm';
import {updateProfile} from '../../../steem/CondenserApis';
import {saveLoginInfo} from '../../../utils/handlers';
import {useDispatch} from 'react-redux';
import {closeActionSheet} from '../../../utils/utils';
import {AppStrings} from '../../../constants/AppStrings';

interface CardProps {
  title: string;
  value: string;
  onChange: any;
  placeholder?: string;
  multiline?: boolean;
  style?: StyleProp<TextStyle>;
  maxLength?: number;
}

const CardItem = (props: CardProps) => {
  const {title, value, onChange, placeholder, multiline, style, maxLength} =
    props;
  return (
    <HStack items="center">
      <Text style={{flex: 0.3}}>{title}</Text>
      <CardTextInput
        cardStyle={{flex: 1, width: '100%'}}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ''}
        multiline={multiline}
        inputStyle={[style]}
        maxLength={maxLength}
      />
    </HStack>
  );
};

const EditAccountPage = ({navigation, route}) => {
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const parsedData = parseAccountMeta(loginInfo?.posting_json_metadata ?? '{}');
  const [name, setName] = useState(parsedData.username ?? '');
  const [about, setAbout] = useState(parsedData.about ?? '');
  const [location, setLocation] = useState(parsedData.location ?? '');
  const [website, setWebste] = useState(parsedData.website ?? '');
  const [profilePic, setProfilePic] = useState(parsedData.profileImage ?? '');
  const [coverPic, setCoverPic] = useState(parsedData.coverImage ?? '');
  const [profileUploading, setProfileUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();

  const handleOnSave = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }

    if (
      name === parsedData.username &&
      about === parsedData.about &&
      profilePic === parsedData.profileImage &&
      website === parsedData.website &&
      location === parsedData.location &&
      coverPic === parsedData.coverImage
    ) {
      AppConstants.SHOW_TOAST('Nothing to update');
      return;
    }
    setSaving(true);

    const credentials = await getCredentials();
    if (credentials) {
      const params = {
        name: name,
        about: about,
        profile_image: profilePic,
        website: website,
        location: location,
        cover_image: coverPic,
      };
      // saveLoginInfo(dispatch, { ...loginInfo, posting_json_metadata: JSON.stringify({ profile: params }) })
      // AppConstants.SHOW_TOAST('Updated', '', 'success');
      // return
      updateProfile(loginInfo, credentials.password, params)
        .then(res => {
          saveLoginInfo(dispatch, {
            ...loginInfo,
            posting_json_metadata: JSON.stringify({profile: params}),
          });
          AppConstants.SHOW_TOAST('Updated', '', 'success');
        })
        .catch(e => {
          AppConstants.SHOW_TOAST('Failed', String(e), 'error');
        })
        .finally(() => {
          setSaving(false);
        });
    } else AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
  };

  return (
    <MainWrapper>
      <VStack fill style={{padding: 4}} spacing={10}>
        <View style={{alignItems: 'center', height: 100}}>
          <Card.Cover
            theme={{roundness: 2}}
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute',
              backgroundColor: AppColors.GLASS_COLOR,
              opacity: 1,
            }}
            source={{
              uri: coverPic,
            }}
          />

          <VStack mt={10}>
            <Avatar.Image
              style={{backgroundColor: MD2Colors.white}}
              source={{
                uri: profilePic || getResizedAvatar(loginInfo.name, 'small'),
              }}
              size={55}
            />

            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                bottom: 0,
                alignSelf: 'flex-end',
                justifyContent: 'center',
                padding: 2,
                position: 'absolute',
              }}>
              {profileUploading ? (
                <ActivityIndicator size={20} />
              ) : (
                <ImagePickerButton
                  style={{marginVertical: 0, marginHorizontal: 0}}
                  iconSize={2}
                  innerIconSize={15}
                  handleEndPicked={() => {
                    closeActionSheet(AppStrings.GALLERY_SHEET_ID);
                  }}
                  handleStartUploading={setProfileUploading}
                  handleEndUploading={setProfileUploading}
                  handleSuccessfulUpload={(url, isPlaceholder, imgMd) => {
                    if (!isPlaceholder) setProfilePic(url);
                  }}
                />
              )}
            </View>
          </VStack>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              bottom: 10,
              padding: 2,
              position: 'absolute',
              right: 10,
            }}>
            {coverUploading ? (
              <ActivityIndicator size={20} />
            ) : (
              <ImagePickerButton
                sheetID="cover-sheet"
                style={{marginVertical: 0, marginHorizontal: 0}}
                iconSize={5}
                innerIconSize={15}
                handleEndPicked={() => {
                  closeActionSheet(AppStrings.GALLERY_SHEET_ID);
                }}
                handleStartUploading={setCoverUploading}
                handleEndUploading={setCoverUploading}
                handleSuccessfulUpload={(url, isPlaceholder, imgMd) => {
                  if (!isPlaceholder) setCoverPic(url);
                }}
              />
            )}
          </View>
        </View>
        <VStack fill p={10} spacing={10}>
          <View style={{marginTop: 10}}>
            <CardItem title={'Name'} value={name} onChange={setName} />
          </View>
          <View>
            <CardItem
              title={'About'}
              value={about}
              onChange={setAbout}
              multiline
              style={{maxHeight: 100}}
            />
          </View>
          <View>
            <CardItem
              title={'Location'}
              value={location}
              onChange={setLocation}
            />
          </View>
          <View>
            <CardItem title={'Website'} value={website} onChange={setWebste} />
          </View>
          <Button
            disabled={saving}
            loading={saving}
            style={{alignSelf: 'center'}}
            uppercase
            mode="contained"
            onPress={handleOnSave}>
            Save
          </Button>
        </VStack>
      </VStack>
    </MainWrapper>
  );
};

export {EditAccountPage};
