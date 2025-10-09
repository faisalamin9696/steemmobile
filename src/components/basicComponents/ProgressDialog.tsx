import { VStack } from "@react-native-material/core"
import { Dialog, Text } from "react-native-paper"
import { ActivityIndicator, Modal } from "react-native";

interface Props {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}


const ProgressDialog = (props: Props) => {
    const { visible, setVisible } = props;
    const hideRewardDialog = () => setVisible(false);

    return (<Modal transparent visible={visible}>
        <Dialog visible={visible} dismissable={false} theme={{ roundness: 2 }} onDismiss={hideRewardDialog}>
            <Dialog.Content>
                <VStack center spacing={10}>
                    <Text variant="titleMedium">Please wait...</Text>
                    <ActivityIndicator size={30} />

                </VStack>

            </Dialog.Content>
        </Dialog >
    </Modal>)
}

export default ProgressDialog

