import { Card, Dialog, Text } from "react-native-paper"
import { Modal, TouchableOpacity } from "react-native";
import { FlatList } from "react-native";
import { HStack, VStack } from "@react-native-material/core";
import BadgeAvatar from "./BadgeAvatar";
import SearchBar from "./SearchBar";
import { useState } from "react";
import { parseUsername } from "../../utils/user";
import { View } from "react-native";

interface Props {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    usersData: string[];
    onSelect: (item: string) => void;

}


const UsersListModal = (props: Props) => {
    const { visible, setVisible, usersData, onSelect } = props;
    const hideModal = () => setVisible(false);
    const [query, setQuery] = useState('');

    const handleItemClick = (item: string) => {
        onSelect(item);
        hideModal();
    }

    const _renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleItemClick(item)}>
            <HStack items="center" spacing={10}>
                <BadgeAvatar avatarSize={30} name={item} handleAvatarClick={() => handleItemClick(item)} />
                <Text variant='bodyLarge'>{item}</Text>
            </HStack>
        </TouchableOpacity>

    )


    const filtered = usersData && usersData.filter(item =>
        (item.includes(parseUsername(query)) || item.includes(query)))


    return (<Modal animationType='none' transparent
        visible={visible} onDismiss={hideModal}
        onRequestClose={hideModal} >
        <Dialog theme={{ roundness: 2, animation: { scale: 0, defaultAnimationDuration: 0 } }}
    
        
            visible={visible} onDismiss={hideModal}>
            <Dialog.ScrollArea style={{ borderTopWidth: 0, borderBottomWidth: 0 }}>
                <VStack spacing={10}>
                    <View>
                        <Card mode='elevated'>
                            <SearchBar
                                value={query}
                                onChangeText={setQuery}
                                style={{ marginHorizontal: 0, elevation: 44 }}

                            />
                        </Card>

                    </View>

                    {<FlatList
                        data={filtered}
                        keyboardShouldPersistTaps='always'
                        renderItem={_renderItem}
                        ItemSeparatorComponent={() => <VStack mt={8} />}

                    />}
                </VStack>

            </Dialog.ScrollArea>

        </Dialog >
    </Modal >)
}

export default UsersListModal

