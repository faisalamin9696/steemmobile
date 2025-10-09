import React, { useContext } from "react";
import { Dimensions, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { PreferencesContext } from "../../contexts/ThemeContext";
import { HStack } from "@react-native-material/core";
import { MaterialDarkTheme, MaterialLightTheme } from "../../utils/theme";
import { Card, MD2Colors, Text } from "react-native-paper";
import SelectDropdown from "react-native-select-dropdown";
import { Icons } from "../Icons";
const { width } = Dimensions.get('window');

interface CustomDropdownProps {
    items: { item: string, value: string }[];
    value: string;
    onChange: (item: { item: string; value: string; }) => void;
    disabled?: boolean;
    dropdownStyle?: StyleProp<ViewStyle>;
    cardStyle?: StyleProp<ViewStyle>;

}

const DropdownItem = (props: CustomDropdownProps) => {
    const { items, value, onChange, dropdownStyle, disabled, cardStyle } = props;

    const { isThemeDark } = useContext(PreferencesContext);
    const dropDownItem = (item: { item: string, value: string }, selected?: boolean | undefined) => {
        return (
            <HStack center pv={10} ph={2} style={{ borderRadius: 10 }} >
                <Text numberOfLines={1} variant="labelSmall" style={{
                    color: selected ? 'white' :
                        isThemeDark ? MD2Colors.grey400 : MD2Colors.grey800, overflow: 'hidden'
                }} >
                    {item.item}</Text>
            </HStack>
        );
    };

    return <Card theme={{ roundness: 2 }}
        mode="elevated" style={[cardStyle]}>

        <SelectDropdown
        
            disabled={disabled}
            data={items}
            onSelect={(selectedItem, index) => {
                onChange(selectedItem);
            }}
            
            buttonStyle={[{
                backgroundColor: 'transparent',
                borderRadius: 10, height: 30,
                opacity: disabled ? 0.7 : 1
            }, dropdownStyle]}
            buttonTextStyle={[{
                color: isThemeDark ? 'white' : 'black',
                fontSize: 12
            }]}
            defaultButtonText={value}
            rowStyle={{
                padding: 0, marginHorizontal: 0,
                borderBottomColor: isThemeDark ? MD2Colors.grey800 : MD2Colors.grey300,
                borderRadius: 10


            }}

            buttonTextAfterSelection={(selectedItem, index) => {
                return selectedItem.item;
            }}

            rowTextForSelection={(item, index) => {
                return item.item;
            }}
            renderDropdownIcon={isOpened => {
                return <Icons.MaterialCommunityIcons name={isOpened ? 'chevron-up' : 'chevron-down'}
                    color={isThemeDark ? 'white' : 'black'} style={{ opacity: 0.8 }} size={15} />;
            }}
            renderCustomizedRowChild={(item, index) => {
                return (
                    dropDownItem(item)
                );
            }}

            dropdownStyle={{
                backgroundColor: isThemeDark ? MaterialDarkTheme.colors.background :
                    MaterialLightTheme.colors.background, borderRadius: 10, maxHeight: 200,

            }}

        />
    </Card>
}

export default DropdownItem


const styles = StyleSheet.create({
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        width: 200,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F6F6F6',
    },
    headerTitle: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    saveAreaViewContainer: { flex: 1, backgroundColor: '#FFF' },
    viewContainer: { flex: 1, width, backgroundColor: '#FFF' },
    scrollViewContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: '10%',
        paddingBottom: '20%',
    },

    dropdown1BtnStyle: {
        width: '80%',
        height: 50,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    dropdown1BtnTxtStyle: { color: '#444', textAlign: 'left' },
    dropdown1DropdownStyle: { backgroundColor: '#EFEFEF' },
    dropdown1RowStyle: { backgroundColor: '#EFEFEF', borderBottomColor: '#C5C5C5' },
    dropdown1RowTxtStyle: { color: '#444', textAlign: 'left' },
    dropdown1SelectedRowStyle: { backgroundColor: 'rgba(0,0,0,0.1)' },
    dropdown1searchInputStyleStyle: {
        backgroundColor: '#EFEFEF',
        borderRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },

    dropdown2BtnStyle: {
        width: '80%',
        height: 50,
        backgroundColor: '#444',
        borderRadius: 8,
    },
    dropdown2BtnTxtStyle: {
        color: '#FFF',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    dropdown2DropdownStyle: {
        backgroundColor: '#444',
        borderRadius: 12,
    },
    dropdown2RowStyle: { backgroundColor: '#444', borderBottomColor: '#C5C5C5' },
    dropdown2RowTxtStyle: {
        color: '#FFF',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    dropdown2SelectedRowStyle: { backgroundColor: 'rgba(255,255,255,0.2)' },
    dropdown2searchInputStyleStyle: {
        backgroundColor: '#444',
        borderBottomWidth: 1,
        borderBottomColor: '#FFF',
    },

    dropdown3BtnStyle: {
        height: 50,
        backgroundColor: '#FFF',
        paddingHorizontal: 0,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: '#444',
    },
    dropdown3BtnChildStyle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
    },
    dropdown3BtnImage: { width: 45, height: 45, resizeMode: 'cover' },
    dropdown3BtnTxt: {
        color: '#444',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 24,
        marginHorizontal: 12,
    },
    dropdown3DropdownStyle: { backgroundColor: 'slategray' },
    dropdown3RowStyle: {
        backgroundColor: 'slategray',
        borderBottomColor: '#444',
        height: 50,
    },
    dropdown3RowChildStyle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 18,
    },
    dropdownRowImage: { width: 45, height: 45, resizeMode: 'cover' },
    dropdown3RowTxt: {
        color: '#F1F1F1',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 24,
        marginHorizontal: 12,
    },
    dropdown3searchInputStyleStyle: {
        backgroundColor: 'slategray',
        borderBottomWidth: 1,
        borderBottomColor: '#FFF',
    },
});

// const styles = StyleSheet.create({
//     dropdown: {
//         width: 200,
//         borderRadius: 22,
//         paddingHorizontal: 8,
//         fontSize: 12
//     },
// })

