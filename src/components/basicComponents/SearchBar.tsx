import {useContext} from 'react';
import {RegisteredStyle, StyleProp, TextStyle, View} from 'react-native';
import {Searchbar} from 'react-native-paper';
import {PreferencesContext} from '../../contexts/ThemeContext';
import {MaterialDarkTheme, MaterialLightTheme} from '../../utils/theme';

interface Props {
  placeholder?: string;
  style?: TextStyle | RegisteredStyle<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  onIconPress?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const SearchBar = (props: Props) => {
  const {
    placeholder,
    style,
    inputStyle,
    value,
    onChangeText,
    onSubmitEditing,
    onIconPress,
    onBlur,
    onFocus,
  } = props;
  const {isThemeDark} = useContext(PreferencesContext);
  return (
    <View style={{height: 40}}>
      <Searchbar
        style={[
          {
            marginBottom: 4,
            marginHorizontal: 4,
            fontSize: 12,
            minHeight: 0,
            maxHeight: 40,
            justifyContent: 'center',
            elevation: 6,
            backgroundColor: isThemeDark
              ? MaterialDarkTheme.colors.elevation.level1
              : MaterialLightTheme.colors.elevation.level3,
          },
          style,
        ]}
        inputStyle={[
          {
            fontSize: 14,
            padding: 0,
            paddingHorizontal: 0,
            minHeight: 0,
            maxHeight: 40,
          },
          inputStyle,
        ]}
        placeholder={placeholder ?? 'Search...'}
        onChangeText={onChangeText}
        value={value}
        autoCapitalize="none"
        onSubmitEditing={onSubmitEditing}
        onIconPress={onIconPress}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};

export default SearchBar;
