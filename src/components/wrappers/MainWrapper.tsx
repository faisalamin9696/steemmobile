import React, { useContext } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { MaterialDarkTheme, MaterialLightTheme } from "../../utils/theme";
import { PreferencesContext } from "../../contexts/ThemeContext";

interface Props {
    style?: StyleProp<ViewStyle>;
    children: any;
}
const MainWrapper = (props: Props) => {
    const { style, children } = props;
    const { isThemeDark } = useContext(PreferencesContext);

    return (<View style={[
        {
            backgroundColor: isThemeDark ?
                MaterialDarkTheme.colors.background : MaterialLightTheme.colors.background, flex: 1
        }, style]}>


        {children}
    </View>)

}

export default MainWrapper