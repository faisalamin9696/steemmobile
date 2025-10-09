import { useContext, useState } from "react";
import { AppConstants } from "../../constants/AppConstants";
import { signImage, uploadImage } from "../../steem/CondenserApis";
import { getCredentials } from "../../utils/realm";
import { ActivityIndicator, Platform, StyleProp, ViewStyle } from "react-native";
import ImagePicker, { Image, ImageOrVideo } from 'react-native-image-crop-picker';
import { VStack } from "@react-native-material/core";
import { AppStrings } from "../../constants/AppStrings";
import ActionSheet from "react-native-actions-sheet";
import { Button, IconButton, MD2Colors } from "react-native-paper";
import { MaterialDarkTheme, MaterialLightTheme } from "../../utils/theme";
import { openActionSheet } from "../../utils/utils";
import Icon, { Icons } from "../Icons";
import { PreferencesContext } from "../../contexts/ThemeContext";
import { useAppSelector } from "../../constants/AppFunctions";
import { openSettings } from 'react-native-permissions';
import ConfirmationModal from "./ConfirmationModal";
import { delay } from "../../utils/editor";



interface Props {
    handleStartUploading?: (uploading: boolean) => void;
    handleEndUploading?: (uploading: boolean) => void;
    handleEndPicked?: (images: Image[]) => void;
    handleSuccessfulUpload?: (url: string, isPlaceholder: boolean, imgMd?: string) => void;
    iconSize?: number;
    buttonMode?: 'outlined' | 'contained' | 'contained-tonal' | undefined
    disabled?: boolean;
    style?: StyleProp<ViewStyle>
    innerIconSize?: number;
    sheetID?: string;

}


let imagesToUpload: any[] = [];

const ImagePickerButton = (props: Props) => {
    const { handleStartUploading, handleEndUploading,
        handleEndPicked, iconSize, buttonMode, disabled, style, innerIconSize,
        sheetID, handleSuccessfulUpload } = props;
    let [imagesUploadCount, setImagesUploadCount] = useState(0);
    // const [uploading, setUploading] = useState(false);
    const { isThemeDark } = useContext(PreferencesContext);
    const loginInfo = useAppSelector(state => state.loginReducer.value);
    const [confirmation, setConfirmation] = useState(
        {
            title: 'Something went wrong',
            body: '',
            primaryText: 'Ok',
            open: false,
            onPress: () => { }

        }
    )

    const _handleMediaOnSelectFailure = (error) => {
        let title = 'Something went wrong';
        let body = error.message || JSON.stringify(error);
        let onPress = () => {
            setConfirmation({ ...confirmation, open: false });
        }
        let primaryText = 'Ok';


        switch (error.code) {
            case 'E_PERMISSION_MISSING':
            case 'E_NO_LIBRARY_PERMISSION':
                title = 'Permission denied';
                body = 'Please, go to phone Settings and change SteemMobile app permissions.';
                onPress = () => {
                    openSettings()
                };
                primaryText = 'Open Settings';

                break;
        }
        if (error?.code !== 'E_PICKER_CANCELLED')
            setConfirmation({
                title: title,
                body: body,
                onPress: onPress,
                primaryText: primaryText,
                open: true
            });
    };
    const handleGalleryPick = async (isCamera = false) => {

        if (isCamera) {
            ImagePicker.openCamera({
                mediaType: 'photo',
                includeBase64: true,
            }).then(image => {
                onPickLibrary([image]);

            }).catch(error => {
                _handleMediaOnSelectFailure(error)
            });

        } else

            ImagePicker.openPicker({
                // width: 300,
                // height: 400,
                multiple: true,
                mediaType: 'photo',
                smartAlbums: ['UserLibrary', 'Favorites', 'PhotoStream', 'Panoramas', 'Bursts'],
                includeBase64: true,

            }).then(image => {
                onPickLibrary(image);
            }).catch(error => {
                _handleMediaOnSelectFailure(error)

            });
    }

    const onPickLibrary = (images: ImageOrVideo[]) => {
        if (!loginInfo.login) {
            AppConstants.SHOW_TOAST('Login to continue');
            return
        }
        if (images.length <= 0) {
            return
        }

        if (handleEndPicked) handleEndPicked(images)

        for (let fi = 0; fi < images.length; fi += 1) {
            const acceptedFile = images[fi];
            const imageToUpload = {
                file: acceptedFile,
                temporaryTag: '',
            };

            imagesToUpload.push(imageToUpload);
        };
        insertPlaceHolders();
        uploadNextImage();
    }
    // upload images
    const _uploadImage = async (image) => {


        const credentials = await getCredentials();
        if (credentials) {

            try {
                let sign = await signImage(image.file, credentials.password);
                if (!sign) {
                    AppConstants.SHOW_TOAST('Failed to sign', '', 'error');
                    // setUploading(false);
                    if (handleEndUploading) handleEndUploading(false);
                    return;
                }
                let image_name = image.file.path.split('/').pop();
                if (Platform.OS === 'ios') {
                    image_name = image.file.filename;
                }

                // upload an image

                uploadImage(image.file, credentials.username, sign).then((res) => {
                    if (res.data && res.data.url) {
                        res.data.hash = res.data.url.split('/').pop();
                        const imageMd = `![](${res.data.url})`;
                        if (handleSuccessfulUpload) handleSuccessfulUpload(image.temporaryTag, false, imageMd);
                        uploadNextImage();
                        return
                    } else {
                        AppConstants.SHOW_TOAST('Failed', '', 'error');
                        return;

                    }
                }).catch((error) => {

                    const imageMd = `![${image_name}](UPLOAD FAILED)`;
                    if (handleSuccessfulUpload) handleSuccessfulUpload(image.temporaryTag, false, imageMd)

                    // _handleDescriptionChange(tempBody);
                    if (error.toString().includes('code 413')) {
                        // console.log('Large file size')
                        AppConstants.SHOW_TOAST('Large file size', '', 'error')

                        return

                    } else if (error.toString().includes('code 429')) {
                        AppConstants.SHOW_TOAST('Limit exceed', '', 'error')

                        // console.log('Limit exceed')
                        return
                    } else if (error.toString().includes('code 400')) {
                        AppConstants.SHOW_TOAST('Invalid Image', '', 'error')

                        // console.log('Invalid Image', error)
                        return
                    } else {
                        AppConstants.SHOW_TOAST('Failed', '', 'error')
                        // console.log('Failed', error);
                    }
                    return;
                }).finally(() => {
                    if (handleEndUploading) handleEndUploading(false);
                    uploadNextImage();
                });
            } catch (e) {
                if (handleEndUploading) handleEndUploading(false);
                AppConstants.SHOW_TOAST('Failed', String(e), 'error');

            }
        } else {
            if (handleEndUploading) handleEndUploading(false);
            AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
            // setUploading(false);
        }
    };

    const uploadNextImage = async () => {
        if (imagesToUpload.length > 0) {
            const nextImage = imagesToUpload.pop();
            // this.upload(nextImage);
            if (handleStartUploading) handleStartUploading(true);
            await delay(200);
            await _uploadImage(nextImage)
        }
    };


    const insertPlaceHolders = () => {

        let placeholder = '';
        for (let ii = 0; ii < imagesToUpload.length; ii += 1) {
            const imageToUpload: any = imagesToUpload[ii];
            if (imageToUpload.temporaryTag === '') {
                imagesUploadCount++;
                imageToUpload.temporaryTag = `![Uploading image #${imagesUploadCount
                    }...]()`;
                placeholder += `\n${imageToUpload.temporaryTag}\n`;
            }

        }
        // Insert the temporary tag where the cursor currently is
        if (handleSuccessfulUpload) handleSuccessfulUpload(placeholder, true)

        setImagesUploadCount(imagesUploadCount)


    };

    return <VStack>
        <IconButton
            style={style ?? undefined}
            mode={buttonMode}
            disabled={disabled}
            icon={() => <Icon size={innerIconSize ?? 18} type={Icons.MaterialCommunityIcons}
                name={'camera'} color={MD2Colors.green600}
                style={{}} />}
            size={iconSize ?? 18}
            onPress={() => {
                openActionSheet(sheetID ?? AppStrings.GALLERY_SHEET_ID)
            }} />

        <ActionSheet
            id={sheetID ?? AppStrings.GALLERY_SHEET_ID}
            statusBarTranslucent={false}
            drawUnderStatusBar={false} 
            gestureEnabled={true}
            indicatorStyle={{ backgroundColor: MD2Colors.grey300 }}
            containerStyle={{
                paddingHorizontal: 12,
                backgroundColor: isThemeDark ? MaterialDarkTheme.colors.background : MaterialLightTheme.colors.background
            }}
            springOffset={50}
            defaultOverlayOpacity={0.3}>
            <VStack mt={10} spacing={20} style={{
                padding: 20,
                minHeight: 180,
                width: '100%'
            }}>
                <Button icon={'view-gallery'} mode="contained"
                    onPress={() => { handleGalleryPick() }}>Gallery</Button>

                <Button icon={'camera'} mode="contained"
                    onPress={() => { handleGalleryPick(true) }}
                >Camera</Button>
            </VStack>
        </ActionSheet>

        <ConfirmationModal
            title={confirmation.title}
            body={confirmation.body}
            visible={confirmation.open}
            setVisible={(value) => { setConfirmation({ ...confirmation, open: value }) }}
            handlePrimaryClick={confirmation.onPress}
            primaryText={confirmation.primaryText}
        />
    </VStack>



}

export default ImagePickerButton;