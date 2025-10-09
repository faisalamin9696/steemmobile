import {HStack} from '@react-native-material/core';
import {Button, Card, IconButton, MD2Colors} from 'react-native-paper';
import {Image, ImageOrVideo} from 'react-native-image-crop-picker';
import {useEffect, useState} from 'react';
import Icon, {Icons} from '../../../components/Icons';
import {View} from 'react-native';
import RewardModal, {
  RewardType,
  rewardTypes,
} from '../../../components/basicComponents/RewardModal';
import BenefModal, {
  BeneType,
} from '../../../components/basicComponents/BenefModal';
import ImagePickerButton from '../../../components/basicComponents/ImagePickerButton';
import {getPostDraft} from '../../../utils/realm';
import SnippetsModal from '../../../components/basicComponents/SinppetsModal';
import {useAppSelector} from '../../../constants/AppFunctions';
import {AppConstants} from '../../../constants/AppConstants';

interface Props {
  selection: any;
  handleOnClear?: () => void;
  handleRewardChange: (reward: RewardType) => void;
  handleBeneChange: (Beneficiary: BeneType[]) => void;
  handleSnippet: (text: string) => void;
  setClear?: boolean;
  isEdit?: boolean;
  navigation: any;
  disableAll?: boolean;
  handleStartUploading?: (uploading: boolean) => void;
  handleEndUploading?: (uploading: boolean) => void;
  handleEndPicked?: (images: Image[]) => void;
  handleSuccessfulUpload?: (
    url: string,
    isPlaceholder: boolean,
    imgMd?: string,
  ) => void;
}

const PostingBottomTray = (props: Props) => {
  const {
    handleOnClear,
    handleRewardChange,
    handleBeneChange,
    setClear,
    isEdit,
    handleSnippet,
    navigation,
    disableAll,
  } = props;

  const draft = getPostDraft();
  const [payoutMethod, setPyoutMethod] = useState(
    draft.reward ?? rewardTypes[1],
  );
  const [beneCount, setBeneCount] = useState(draft?.beneficiaries?.length ?? 0);
  const [benefModal, setModalDialog] = useState(false);
  const [rewardDialog, setRewardDialog] = useState(false);
  const [snipModal, setSnipModal] = useState(false);
  const showBenefModal = () => setModalDialog(true);
  const hideBenefModal = () => setModalDialog(false);
  const showRewardfDialog = () => setRewardDialog(true);
  const hideRewardDialog = () => setRewardDialog(false);
  const showSnipModal = () => setSnipModal(true);
  const hideSnipModal = () => setSnipModal(false);
  const loginInfo = useAppSelector(state => state.loginReducer.value);

  useEffect(() => {
    if (setClear) {
      setBeneCount(0);
      setPyoutMethod(rewardTypes[1]);
    }
  }, [setClear]);

  const handleOpenSnippet = () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }
    showSnipModal();
  };

  return (
    <View>
      <Card theme={{roundness: 2}}>
        <Card.Content style={{paddingVertical: 0, paddingHorizontal: 0}}>
          <HStack items="center" justify="between">
            <ImagePickerButton
              buttonMode="contained-tonal"
              {...props}
              disabled={disableAll ?? false}
            />
            {/* <Divider style={{ width: 1, height: 15, backgroundColor: AppColors.LIGHT_GRAY }} /> */}

            {isEdit ? null : (
              <Button
                compact
                labelStyle={{marginVertical: 6, marginStart: 4}}
                contentStyle={{marginHorizontal: 0}}
                disabled={(disableAll || isEdit) ?? false}
                onPress={showRewardfDialog}
                mode={'contained-tonal'}
                icon={'currency-usd'}>
                {payoutMethod.shortTitle}
              </Button>
            )}

            {/* <Divider style={{ width: 1, height: 15, backgroundColor: AppColors.LIGHT_GRAY }} /> */}

            {isEdit ? null : (
              <Button
                labelStyle={{marginVertical: 6}}
                compact
                mode={'contained-tonal'}
                onPress={showBenefModal}
                icon={'account-multiple-check'}
                disabled={(disableAll || isEdit) ?? false}
                style={{}}>
                {'Bene: ' + beneCount}
              </Button>
            )}
            {/* <Divider style={{ width: 1, height: 15, backgroundColor: AppColors.LIGHT_GRAY }} /> */}

            <IconButton
              mode={'contained-tonal'}
              icon={() => (
                <Icon
                  size={18}
                  type={Icons.MaterialCommunityIcons}
                  name={'format-list-text'}
                  color={MD2Colors.blue600}
                  style={{}}
                />
              )}
              size={15}
              disabled={disableAll}
              onPress={handleOpenSnippet}
            />

            <IconButton
              mode={'contained-tonal'}
              icon={() => (
                <Icon
                  size={18}
                  type={Icons.MaterialCommunityIcons}
                  name={'delete'}
                  color={MD2Colors.red400}
                  style={{}}
                />
              )}
              size={15}
              disabled={disableAll}
              onPress={handleOnClear}
            />
          </HStack>
        </Card.Content>
      </Card>
      {
        <RewardModal
          setClear={setClear}
          onSelect={reward => {
            setPyoutMethod(reward);
            handleRewardChange(reward);
          }}
          visible={rewardDialog}
          setVisible={hideRewardDialog}
        />
      }
      {
        <BenefModal
          setClear={setClear}
          visible={benefModal}
          setVisible={hideBenefModal}
          onChange={bene => {
            handleBeneChange(bene);
            setBeneCount(bene.length);
          }}
        />
      }
      {
        <SnippetsModal
          navigation={navigation}
          setClear={setClear}
          visible={snipModal}
          setVisible={hideSnipModal}
          onSelect={snip => {
            handleSnippet(snip.body);
          }}
        />
      }
    </View>
  );
};

export {PostingBottomTray};
