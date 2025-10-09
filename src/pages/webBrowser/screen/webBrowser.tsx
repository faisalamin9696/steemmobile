import React, {useMemo, useState} from 'react';
import {
  Alert,
  ActivityIndicator,
  Share,
  View,
  Linking,
  StyleSheet,
} from 'react-native';
import {WebView} from 'react-native-webview';

import {SafeAreaView} from 'react-native-safe-area-context';
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import MainWrapper from '../../../components/wrappers/MainWrapper';

interface Props {
  navigation: any;
  route: any;
}

const WebBrowser = (props: Props) => {
  const {route, navigation} = props;
  const url = useMemo(() => route.params?.url, []);

  const [isLoading, setIsLoading] = useState(true);

  if (!url) {
    Alert.alert('DEV: url parameter cannot be empty');
    navigation.goBack();
    return <></>;
  }

  // const urlObj = new URL(url);
  // const title = `${urlObj.host || urlObj.hostname}...`;

  const _handleRightIconPress = () => {
    Share.share({
      message: url,
    });
  };

  const _handleBrowserIconPress = () => {
    Linking.openURL(url);
  };

  const _onError = () => {
    Alert.alert('Failed');
  };

  return (
    <SafeAreaView>
      <MainWrapper>
        {/* <BasicHeader
                    title={title}
                    backIconName="close"
                    rightIconName="share"
                    iconType="MaterialIcons"
                    rightIconBtnStyle={styles.rightIconContainer}
                    handleRightIconPress={_handleRightIconPress}
                    handleBrowserIconPress={_handleBrowserIconPress}
                    isHasBrowserIcon
                /> */}
        <View>
          <WebView
            style={styles.webView}
            onLoadEnd={() => {
              setIsLoading(false);
            }}
            onError={_onError}
            source={{
              uri: url,
            }}
          />
          {isLoading && (
            <ActivityIndicator
              style={styles.loading}
              // color={EStyleSheet.value('$primaryDarkGray')}
              size="large"
            />
          )}
        </View>
      </MainWrapper>
    </SafeAreaView>
  );
};

export default gestureHandlerRootHOC(WebBrowser);

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    width: '100%',
  },
  loading: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  rightIconContainer: {
    marginHorizontal: 8,
  },
});
