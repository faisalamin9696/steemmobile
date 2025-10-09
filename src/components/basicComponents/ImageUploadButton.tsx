import React, { useContext, useState, useCallback } from "react";
import {
    Platform,
    StyleProp,
    ViewStyle,
} from "react-native";
import ImagePicker, { Image, ImageOrVideo } from "react-native-image-crop-picker";
import { VStack } from "@react-native-material/core";
import {
    Button,
    IconButton,
    MD2Colors,
} from "react-native-paper";
import ActionSheet from "react-native-actions-sheet";
import Icon, { Icons } from "../Icons";
import ConfirmationModal from "./ConfirmationModal";
import { PreferencesContext } from "../../contexts/ThemeContext";
import {
    openActionSheet,
} from "../../utils/utils";

import {
    signImage,
    uploadImage,
} from "../../steem/CondenserApis";
import { useAppSelector } from "../../constants/AppFunctions";
import { MaterialDarkTheme, MaterialLightTheme } from "../../utils/theme";
import { openSettings } from "react-native-permissions";
import { AppStrings } from "../../constants/AppStrings";
import { AppConstants } from "../../constants/AppConstants";
import { useMutation } from "@tanstack/react-query";
import { UserCredentials } from "react-native-keychain";
import { getCredentials } from "../../utils/realm";
import { delay, extractFilenameFromPath } from "../../utils/editor";

interface Props {
    handleImagesPicked?: (images?: Image[]) => void;
    handleUploadError?: (error?: string) => void;
    handleUploadStart?: () => void;
    handleUploadEnd?: () => void;
    handleUploadResponse?: (url: string, isPlaceholder: boolean, imgMd?: string) => void;
    handleMediaInsert: (data: Array<MediaInsertData>) => void;

    iconSize?: number;
    buttonMode?: 'outlined' | 'contained' | 'contained-tonal' | undefined
    disabled?: boolean;
    style?: StyleProp<ViewStyle>
    innerIconSize?: number;
    sheetID?: string;


}

export interface MediaInsertData {
    url: string;
    filename?: string;
    text: string;
    status: string;
}

const ImageUploadButton = (props: Props) => {
    const {
        handleImagesPicked,
        handleUploadError,
        handleUploadStart,
        handleUploadEnd,
        handleUploadResponse,
        iconSize,
        buttonMode,
        disabled,
        style,
        innerIconSize,
        sheetID,
        handleMediaInsert
    } = props;

    const { isThemeDark } = useContext(PreferencesContext);
    const loginInfo = useAppSelector((state) => state.loginReducer.value);


    const [confirmation, setConfirmation] = useState({
        title: "Something went wrong",
        body: "",
        primaryText: "Ok",
        open: false,
        onPress: () => { },
    });

    const _handleMediaOnSelectFailure = useCallback((error) => {
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
    }, []);

    const handleGalleryPick = useCallback((isCamera = false) => {
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
                multiple: true,
                mediaType: 'photo',
                smartAlbums: ['UserLibrary', 'Favorites', 'PhotoStream', 'Panoramas', 'Bursts'],
                includeBase64: true,

            }).then(image => {
                onPickLibrary(image);
            }).catch(error => {
                _handleMediaOnSelectFailure(error)

            });
    }, []);

    const onPickLibrary = useCallback(async (images: Image[]) => {
        if (!loginInfo.login) {
            AppConstants.SHOW_TOAST('Login to continue');
            return
        }
        if (images.length <= 0) {
            return
        }
        if (handleImagesPicked) handleImagesPicked(images);

        images.forEach((element, index) => {
            if (element) {
                images[index].filename =
                    element.filename ||
                    extractFilenameFromPath({ path: element.path, mimeType: element.mime });

                _handleMediaInsertion({
                    filename: element.filename,
                    url: '',
                    text: '',
                    status: 'uploading',
                });
            }
        });

        for (let fi = 0; fi < images.length; fi += 1) {
            const acceptedFile = images[fi];
            const imageToUpload = {
                file: acceptedFile,
                temporaryTag: '',
            };
            if (handleUploadStart) handleUploadStart();
            delay(500);
            await _uploadImage(imageToUpload);
        };

    }, []);



    const _uploadImage = async (media: { file: ImageOrVideo, temporaryTag: string }) => {
        if (!loginInfo.login) return
        const credentials = await getCredentials();

        if (!credentials) {
            if (handleUploadError) handleUploadError('Invalid credentials');
            AppConstants.SHOW_TOAST('Failed', 'Invalid credentials', 'error');
            return;
        }

        try {
            await mediaUploadMutation.mutateAsync({ image: media.file, credentials: credentials });
        } catch (error: any) {
            const image_name = Platform.OS === 'ios' ? media.file.filename : media.file.path.split('/').pop();
            const imageMd = `![${image_name}](UPLOAD FAILED)`;
            if (handleUploadResponse) handleUploadResponse(media.temporaryTag, false, imageMd);

            let error_message = '';

            if (error.toString().includes('code 413')) {
                error_message = 'Large file size';
            } else if (error.toString().includes('code 429')) {
                error_message = 'Limit exceed';
            } else if (error.toString().includes('code 400')) {
                error_message = 'Invalid Image';
            } else {
                error_message = String(error);
            }

            AppConstants.SHOW_TOAST('Failed', error_message, 'error');


        }


    }

    const _handleMediaInsertion = (data: MediaInsertData) => {
        handleMediaInsert([data]);

    };

    const mediaUploadMutation = useMutation({
        mutationKey: ['imageUpload'],
        mutationFn: async ({ image, credentials }: { image: ImageOrVideo, credentials: UserCredentials }) => {
            delay(200);
            let sign = await signImage(image, credentials.password);
            return await uploadImage(image, credentials.username, sign);

        }, onSuccess: (res, variables) => {
            console.log('upload successfully');
            if (res && res.data && res.data.url) {
                _handleMediaInsertion({
                    filename: variables.image.filename,
                    url: res.data.url,
                    text: '',
                    status: 'ready'
                });
            }
        }, onSettled: () => {
            if (handleUploadEnd) handleUploadEnd();
        },
        onError: (err) => {
            throw err;
        },
    })


    return (
        <VStack>
            <IconButton
                style={style ?? undefined}
                mode={buttonMode}
                // disabled={disabled || uploading}
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
    );
};

export default ImageUploadButton;