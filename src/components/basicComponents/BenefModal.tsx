import {HStack, VStack} from '@react-native-material/core';
import {useEffect, useState} from 'react';
import {Avatar, IconButton, MD2Colors, Text} from 'react-native-paper';
import {Modal, ScrollView} from 'react-native';
import {AppConstants} from '../../constants/AppConstants';
import {useAppSelector} from '../../constants/AppFunctions';
import {getResizedAvatar} from '../../utils/ImageApis';
import {parseUsername, validateUsername} from '../../utils/user';
import {isFloatOrInt} from '../../utils/utils';
import CardTextInput from './CardTextInput';
import Toast from 'react-native-toast-message';
import MainWrapper from '../wrappers/MainWrapper';
import ModalHeader from './ModalHeader';
import {getPostDraft} from '../../utils/realm';
import {toastConfig} from '../../utils/toastConfig';

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setClear?: boolean;
  onChange: (bene: BeneType[]) => void;
}

export interface BeneType {
  account: string;
  weight: number;
}

const BenefModal = (props: Props) => {
  const {visible, setVisible, setClear, onChange} = props;

  const loginInfo = useAppSelector(state => state.loginReducer.value);

  const draft = getPostDraft();
  const showBenefDialog = () => setVisible(true);
  const hideBenefDialog = () => setVisible(false);
  let [benefUsername, setBenefUsername] = useState('');
  const [benefShare, setBenefShare] = useState('');
  const [totalBenef, setTotalBenef] = useState(100);
  const [benefList, setBenefList] = useState<BeneType[]>(
    draft.beneficiaries ?? [],
  );

  // load the draft
  useEffect(() => {
    if (benefList.length >= 1) {
      onChange(benefList);
      benefList.forEach((benef: any) => {
        setTotalBenef(totalBenef - benef.weight / 100);
      });
    }
  }, []);

  useEffect(() => {
    if (setClear) {
      setBenefList([]);
      setTotalBenef(100);
      setBenefShare('');
    }
  }, [setClear]);

  const handleAddBenif = async () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue', '', 'info');
      return;
    }

    benefUsername = parseUsername(benefUsername);

    if (!validateUsername(benefUsername)) {
      AppConstants.SHOW_TOAST('Invalid username', '', 'info');
      return;
    }
    if (benefShare === '') {
      AppConstants.SHOW_TOAST('Invalid weight', '', 'info');
      return;
    }

    if (!isFloatOrInt(benefShare)) {
      AppConstants.SHOW_TOAST(
        'Invalid weight',
        'Weight must be in digits',
        'info',
      );
      return;
    }

    if (parseFloat(benefShare) > 100 || parseFloat(benefShare) < 1) {
      AppConstants.SHOW_TOAST(
        'Invalid weight',
        'Percentage must be from 1-100',
        'info',
      );
      return;
    }

    benefUsername = parseUsername(benefUsername);
    if (benefUsername === loginInfo.name) {
      AppConstants.SHOW_TOAST(
        'Invalid username',
        'Cannot specify self as beneficiary',
        'info',
      );
      return;
    }

    if (
      benefList.filter((element: any) => element.account === benefUsername)
        .length >= 1
    ) {
      AppConstants.SHOW_TOAST('Duplicate username', '', 'info');
      return;
    }

    if (parseFloat(benefShare) <= totalBenef) {
      if (benefUsername && benefShare) {
        const newList = benefList.concat([
          {account: benefUsername, weight: parseFloat(benefShare) * 100},
        ]);
        setBenefList(newList);
        onChange(newList);
        setTotalBenef(totalBenef - parseFloat(benefShare));
        setBenefUsername('');
        setBenefShare('');
      } else {
        AppConstants.SHOW_TOAST('Invalid data', '', 'info');
        return;
      }
    } else {
      AppConstants.SHOW_TOAST(
        'Invalid weight',
        'Total percentage must be less than 100',
        'info',
      );
      return;
    }
  };

  const deleteBenef = (item: BeneType) => {
    setTotalBenef(totalBenef + item.weight / 100);
    const newList = benefList.filter(value => {
      return value.account !== item.account;
    });
    setBenefList(newList);
    onChange(newList);
  };

  const benefItem = (item: BeneType, index: number) => {
    return (
      <VStack key={index ?? item.account}>
        <HStack items="center" justify="around">
          <HStack fill spacing={10}>
            <Avatar.Image
              size={25}
              style={{backgroundColor: 'white'}}
              {...props}
              source={{uri: getResizedAvatar(item.account)}}
            />

            <Text>{item.account}</Text>
          </HStack>

          <HStack fill items="center" justify="end" spacing={10}>
            <Text>{item.weight / 100}%</Text>
            <IconButton
              onPress={() => deleteBenef(item)}
              iconColor={MD2Colors.red400}
              icon={'delete'}
            />
          </HStack>
        </HStack>
      </VStack>
    );
  };

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={hideBenefDialog}
      onDismiss={hideBenefDialog}
      presentationStyle={'fullScreen'}>
      <MainWrapper>
        <VStack fill style={{paddingHorizontal: 20, paddingTop: 20}}>
          <ModalHeader
            title="Beneficiaries"
            onClose={hideBenefDialog}
            subTitle={'Who should receive any rewards?'}
          />

          <HStack mt={20} items="center" justify={'around'}>
            <CardTextInput
              cardStyle={{flex: 0.5, marginHorizontal: 4}}
              value={benefShare}
              onChangeText={setBenefShare}
              placeholder="Weight"
              inputStyle={{fontWeight: 'normal'}}
              mode="outlined"
              inputMode="decimal"
            />
            <CardTextInput
              cardStyle={{flex: 1}}
              value={benefUsername}
              onChangeText={setBenefUsername}
              placeholder="Username"
              inputStyle={{fontWeight: 'normal'}}
              mode="outlined"
              autoCapitalize="none"
            />

            <IconButton
              onPress={handleAddBenif}
              iconColor={MD2Colors.green600}
              icon={'plus-circle'}
            />
          </HStack>

          <HStack items="center" justify="around">
            <HStack fill spacing={10}>
              <Avatar.Image
                size={25}
                style={{backgroundColor: 'white'}}
                {...props}
                source={{uri: getResizedAvatar(loginInfo.name)}}
              />

              <Text>{loginInfo.name}</Text>
            </HStack>

            <HStack fill items="center" justify="end" spacing={10}>
              <Text>{totalBenef}%</Text>
              <IconButton
                disabled
                iconColor={MD2Colors.red400}
                icon={'delete'}
              />
            </HStack>
          </HStack>

          <ScrollView
            contentContainerStyle={{paddingBottom: 20}}
            keyboardShouldPersistTaps="always">
            {benefList.map((item, index) => benefItem(item, index))}
          </ScrollView>
        </VStack>
        <Toast position="top" topOffset={80} config={toastConfig} />
      </MainWrapper>
    </Modal>
  );
};

export default BenefModal;
