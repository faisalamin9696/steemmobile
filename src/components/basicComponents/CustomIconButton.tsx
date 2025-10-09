import { ActivityIndicator, TouchableOpacity, ViewStyle } from "react-native";
import Icon, { Icons } from "../Icons"
import { HStack } from "@react-native-material/core";

interface Props {
    type?: string;
    name: string;
    color: string;
    style?: ViewStyle;
    disabled?: boolean;
    size?: number;
    loading?: boolean;
    children?: React.ReactNode



}
const CustomIconButton = (props: Props) => {
    const { type, name, color, style, disabled, size, loading, children } = props;

    return (loading ? <ActivityIndicator /> :
        <TouchableOpacity disabled={disabled ?? false}>
            <HStack items='center' spacing={5}>
                <Icon
                    type={type ?? Icons.MaterialCommunityIcons}
                    name={name}
                    size={size}
                    color={color}
                    style={style} />
                {children}
            </HStack>
        </TouchableOpacity>)
}

export default CustomIconButton;