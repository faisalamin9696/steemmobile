import { HStack, VStack } from "@react-native-material/core"
import { useEffect, useState } from "react";
import { Button, Dialog, RadioButton, Text } from "react-native-paper"
import { Modal } from "react-native";
import { useAppSelector } from "../../constants/AppFunctions";
import { getPostDraft } from "../../utils/realm";

export interface RewardType {
    title: string,
    shortTitle: string;
    payout: number;
}

export const rewardTypes: RewardType[] = [{ title: 'Decline Payout', shortTitle: 'Declined', payout: 0 },
{ title: '50% SBD / 50% SP', shortTitle: '50/50', payout: 50 },
{ title: 'Power Up 100%', shortTitle: '100%', payout: 100 }];

interface Props {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    setClear?: boolean;
    onSelect: (reward: RewardType) => void

}


const RewardModal = (props: Props) => {
    const { visible, setVisible, setClear, onSelect } = props;
    const loginInfo = useAppSelector(state => state.loginReducer.value);
    const isDraft = - false;
    const hideRewardDialog = () => setVisible(false);

    const draft = getPostDraft();
    const index = rewardTypes.findIndex(item => (
        item.payout === draft.reward.payout
    ));

    const [value, setValue] = useState(index.toString() ?? '1')



    useEffect(() => {
        if (setClear) {
            setValue('1')
        }
    }, [setClear]);


    return (<Modal transparent visible={visible} onDismiss={hideRewardDialog} >
        <Dialog theme={{ roundness: 2 }} visible={visible} onDismiss={hideRewardDialog}>
            <Dialog.Title >
                <Text variant="titleMedium">Select Reward Type</Text>
            </Dialog.Title>
            <Dialog.Content>
                <VStack>

                    <RadioButton.Group onValueChange={newValue => setValue(newValue)}
                        value={value}>
                        <HStack items="center">
                            <Text style={{ width: 150 }}>{rewardTypes[0].title}</Text>
                            <RadioButton value={'0'} />
                        </HStack>

                        <HStack items="center">
                            <Text style={{ width: 150 }}>{rewardTypes[1].title}</Text>
                            <RadioButton value={'1'} />
                        </HStack>

                        <HStack items="center">
                            <Text style={{ width: 150 }}>{rewardTypes[2].title}</Text>
                            <RadioButton value={'2'} />
                        </HStack>

                    </RadioButton.Group>

                </VStack>

            </Dialog.Content>
            <Dialog.Actions>

                <Button onPress={hideRewardDialog}>Cancel</Button>
                <Button onPress={() => {
                    if (value) {
                        onSelect(rewardTypes[parseInt(value)]);
                    }
                    hideRewardDialog();

                }}>Done</Button>
            </Dialog.Actions>
        </Dialog >
    </Modal>)
}

export default RewardModal

