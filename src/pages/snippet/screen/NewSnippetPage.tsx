import {VStack} from '@react-native-material/core';
import {useContext, useEffect, useState} from 'react';
import {AnimatedFAB, MD2Colors} from 'react-native-paper';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  TextInput as TextInputRN,
} from 'react-native';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {MaterialDarkTheme} from '../../../utils/theme';
import CardTextInput from '../../../components/basicComponents/CardTextInput';
import {useAppSelector} from '../../../constants/AppFunctions';
import {useMutation} from '@tanstack/react-query';
import Icon, {Icons} from '../../../components/Icons';
import {AppConstants} from '../../../constants/AppConstants';
import {addSnippet, updateSnippet} from '../../../utils/realm';


const NewSnippetPage = ({navigation, route}) => {
  const {snippet} = route?.params || {};
  const [isNew, setIsNew] = useState(snippet ? false : true);
  let loginInfo = useAppSelector(state => state.loginReducer.value);
  const snipKey = `snip-${loginInfo.name}`;
  const {isThemeDark} = useContext(PreferencesContext);
  let [title, setTitle] = useState(isNew ? '' : snippet.title);
  let [body, setBody] = useState(isNew ? '' : snippet.body);

  const {isPending: isLoading1, mutate: newMutate} = useMutation({
    mutationKey: [snipKey],
    mutationFn: () => addSnippet(loginInfo.name, {title, body}),
    onSuccess(data, variables, context) {
      if (data) {
        AppConstants.SHOW_TOAST('Saved', '', 'success');
        setTitle('');
        setBody('');
      }
    },
    onError(error, variables, context) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
    onSettled() {},
  });

  const {isPending: isLoading2, mutate: updateMutate} = useMutation({
    mutationKey: [snipKey],
    mutationFn: () => updateSnippet(loginInfo.name, {...snippet, title, body}),
    onSuccess(data, variables, context) {
      AppConstants.SHOW_TOAST('Updated', '', 'success');
      setTitle('');
      setBody('');
      navigation.pop();
    },
    onError(error, variables, context) {
      AppConstants.SHOW_TOAST('Failed', String(error), 'error');
    },
    onSettled() {},
  });

  const handleSave = () => {
    if (!loginInfo.login) {
      AppConstants.SHOW_TOAST('Login to continue');
      return;
    }

    title = title?.trim();
    body = body?.trim();

    if (!title || !body) {
      AppConstants.SHOW_TOAST('Some fields are empty');
      return;
    }
    if (isNew) newMutate();
    else updateMutate();
  };

  return (
    <MainWrapper>
      <VStack fill spacing={6} ph={4}>
        <ScrollView
          style={{marginTop: 10}}
          contentContainerStyle={{marginBottom: 80}}
          keyboardShouldPersistTaps="always">
          <CardTextInput
            disabled={isLoading1 || isLoading2}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            inputStyle={{fontWeight: 'bold'}}
            maxLength={255}
            numberOfLines={1}
          />

          <TextInputRN
            multiline={true}
            autoCorrect={false}
            value={body}
            onChangeText={setBody}
            placeholder="Body..."
            selectionColor="#357ce6"
            style={{
              flex: 1,
              fontSize: 14,
              marginTop: 5,
              paddingTop: 10,
              paddingBottom: 32,
              paddingHorizontal: 16,
              textAlignVertical: 'top',
              maxHeight: undefined,
              backgroundColor: MD2Colors.transparent,
              color:
                isLoading1 || isLoading2
                  ? MD2Colors.grey400
                  : isThemeDark
                  ? 'white'
                  : 'black',
            }}
            underlineColorAndroid={MD2Colors.transparent}
            keyboardAppearance={isThemeDark ? 'dark' : 'light'}
            editable={!isLoading1 || !isLoading2}
            placeholderTextColor={MD2Colors.grey400}
            maxLength={8000}
          />
        </ScrollView>
      </VStack>

      <AnimatedFAB
        icon={() =>
          isLoading1 || isLoading2 ? (
            <ActivityIndicator size={24} />
          ) : (
            <Icon
              type={Icons.MaterialCommunityIcons}
              name={'content-save'}
              color={'black'}
              style={{}}
            />
          )
        }
        label={isNew ? 'Save' : 'Update'}
        extended={true}
        onPress={() => {
          handleSave();
        }}
        visible={true}
        animateFrom={'right'}
        iconMode={'dynamic'}
        disabled={isLoading1 || isLoading2}
        style={[
          styles.fabStyle,
          {
            backgroundColor: isThemeDark
              ? MaterialDarkTheme.colors.primary
              : undefined,
          },
        ]}
      />
    </MainWrapper>
  );
};

export {NewSnippetPage};

const styles = StyleSheet.create({
  fabStyle: {
    bottom: 16,
    right: 16,
    position: 'absolute',
  },
});
