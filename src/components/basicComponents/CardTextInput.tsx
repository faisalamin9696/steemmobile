import React, { Ref, useContext, useMemo } from "react";
import { Card, MD2Colors, TextInput } from "react-native-paper"
import {
    InputModeOptions, NativeSyntheticEvent, StyleProp, TextInputFocusEventData,
    TextInputSelectionChangeEventData, TextStyle, ViewStyle
} from "react-native";
import { PreferencesContext } from "../../contexts/ThemeContext";

interface Props {
    value: string,
    onChangeText: (text: any) => void;
    placeholder: string;
    cardStyle?: StyleProp<ViewStyle>
    inputStyle?: StyleProp<TextStyle>;
    inputRight?: React.ReactNode;
    inputLeft?: React.ReactNode;
    multiline?: boolean;
    onSelectionChange?: (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
    mode?: "flat" | "outlined"
    inputMode?: InputModeOptions | undefined
    autoCapitalize?: "none" | "words" | "sentences" | "characters" | undefined;
    disabled?: boolean;
    numberOfLines?: number;
    onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
    maxLength?: number;
    contentStyle?: StyleProp<TextStyle>;
    autoFocus?: boolean;
    editorScrollEnabled?: boolean;
    innerRef?: Ref<any>;
    cardMode?: 'contained' | 'elevated';


}
const CardTextInput = (props: Props) => {
    const { value, onChangeText, placeholder, cardStyle, inputStyle,
        inputRight, inputLeft, multiline, onSelectionChange,
        mode, inputMode, autoCapitalize, disabled, numberOfLines, onFocus,
        maxLength, contentStyle, autoFocus, editorScrollEnabled, innerRef, cardMode } = props;
    const { isThemeDark } = useContext(PreferencesContext);

    const inputCard = useMemo(() => {
        return <Card theme={{ roundness: 2 }} mode={cardMode ?? "contained"}
            style={[{
                marginVertical: 2,
                backgroundColor: MD2Colors.transparent
            }, cardStyle]}>
            <Card.Content style={{
                paddingHorizontal: 0, paddingVertical: 0,
                backgroundColor: MD2Colors.transparent
            }}>
                <TextInput
                    ref={innerRef}
                    onFocus={(e) => {
                        if (onFocus)
                            onFocus(e);
                    }

                    }
                    mode={mode || "flat"}
                    value={value}
                    onChangeText={onChangeText}
                    contentStyle={[contentStyle]}
                    placeholder={placeholder}
                    style={[{
                        height: multiline ? undefined : mode === 'outlined' ? undefined : 35,
                        paddingVertical: mode === 'outlined' ? 0 : 2, borderRadius: 4

                    }, inputStyle]}

                    right={inputRight}
                    left={inputLeft}
                    underlineStyle={{ opacity: 0 }}
                    multiline={multiline || false}
                    onSelectionChange={onSelectionChange}
                    inputMode={inputMode}
                    dense
                    autoFocus={autoFocus}
                    autoCapitalize={autoCapitalize || 'sentences'}
                    disabled={disabled ?? false}
                    numberOfLines={numberOfLines || undefined}
                    maxLength={maxLength ?? undefined}
                    keyboardAppearance={isThemeDark ? 'dark' : 'light'}
                    selectionColor={'#357ce6'}
                    contextMenuHidden={false}

                />
            </Card.Content>
        </Card>

    }, [value, disabled])

    return (<>{inputCard}</>)
}
export default CardTextInput;