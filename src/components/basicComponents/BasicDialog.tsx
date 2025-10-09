import {VStack} from '@react-native-material/core';
import {Linking} from 'react-native';
import {Button, Dialog, Text} from 'react-native-paper';

interface Props {
  title: string;
  body?: string;
  visible: boolean;
  setVisible?: (visible: boolean) => void;
  cancelable?: boolean;
  showActions?: boolean;
  actionText?: string;
  link?: string;
}

const BasicDialog = (props: Props) => {
  const {
    title,
    body,
    visible,
    setVisible,
    cancelable,
    showActions,
    actionText,
    link,
  } = props;
  const hideRewardDialog = () => {
    if (setVisible) setVisible(false);
  };

  return (
    <Dialog
      visible={visible}
      dismissable={cancelable ?? false}
      theme={{roundness: 2}}
      onDismiss={hideRewardDialog}>
      <Dialog.Title style={{alignSelf: 'center'}}>{title}</Dialog.Title>
      <Dialog.Content>
        <VStack center spacing={10}>
          <Text selectable variant="bodySmall">
            {body ?? ''}
          </Text>
        </VStack>
      </Dialog.Content>
      {showActions ? (
        <Dialog.Actions>
          <Button onPress={hideRewardDialog}>{actionText ?? 'Cancel'}</Button>
        </Dialog.Actions>
      ) : null}

      <Dialog.Actions>
        {!!link ? (
          <Button
            style={{width: 'auto'}}
            onPress={() => {
              if (!!link) Linking.openURL(link);
            }}>
            Open
          </Button>
        ) : null}
      </Dialog.Actions>
    </Dialog>
  );
};

export default BasicDialog;
