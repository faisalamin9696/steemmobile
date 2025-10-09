import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {Provider} from 'react-redux';
import {store} from './src/redux/store/store';
// import {initQueryClient} from './src/steem/queries';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import React, {useEffect} from 'react';
import {HomePage} from './src/pages/home/screen/HomePage';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {toastConfig} from './src/utils/toastConfig';
import {request, PERMISSIONS} from 'react-native-permissions';
import ErrorBoundary from 'react-native-error-boundary';
import ErrorFallbackPage from './src/pages/error/ErrorFallbackPage';
import {Platform, UIManager} from 'react-native';
import { client } from './src/steem/CondenserApis';
import './global.css'

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
const App = () => {
  console.log(client.address);

  // encoding error fixes
  const TextEncodingPolyfill = require('text-encoding');

  Object.assign({
    TextEncoder: TextEncodingPolyfill.TextEncoder,
    TextDecoder: TextEncodingPolyfill.TextDecoder,
  });

  // const queryClientProviderProps = initQueryClient();

  const queryClient = new QueryClient();

  useEffect(() => {
    // request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS).then(result => {});

    // PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaView edges={['top', 'bottom']} style={{flex: 1}}>
          {/* <SafeAreaProvider style={{flex: 1}} > */}
          <Provider store={store}>
            <ErrorBoundary
              FallbackComponent={ErrorFallbackPage}>
              <HomePage />
            </ErrorBoundary>
          </Provider>
          <Toast position="top" topOffset={80} config={toastConfig} />
        </SafeAreaView>
        {/* </SafeAreaProvider> */}
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
};

export default App;
