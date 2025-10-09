import {useNavigation} from '@react-navigation/native';
import React, {useState, useEffect, useImperativeHandle} from 'react';

import {LayoutAnimation, View} from 'react-native';
import {StyleSheet} from 'react-native';
import getWindowDimensions from '../../../utils/getWindowDimensions';
import {PinAnimatedInput} from '../../../components/pinAnimatedInput';
import {NumericKeyboard} from '../../../components/numericKeyboard';
import BadgeAvatar from '../../../components/basicComponents/BadgeAvatar';
import {Button, IconButton, MD2Colors, ProgressBar, Text} from 'react-native-paper';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import {VStack} from '@react-native-material/core';
import {delay} from '../../../utils/editor';

const {height, width} = getWindowDimensions();

interface Props {
  informationText: string;
  showForgotButton: boolean;
  username: string;
  handleForgotButton;
  setPinCode;
  hideCloseButton: boolean;
  isReset: boolean;
  pinCodeParams: any;
  applicationPinCode: any;
  encUnlockPin: any;
  isBiometricEnabled: boolean;
  unlocking: boolean;
}
const PinCodeView = React.forwardRef(
  (props: Props, ref: React.Ref<any>) => {
    const {
      informationText,
      showForgotButton,
      username,
      handleForgotButton,
      setPinCode,
      hideCloseButton,
      isReset,
      unlocking,
    } = props;

    const [pin, setPin] = useState('');
    const navigation = useNavigation();

    useImperativeHandle(ref, () => ({
      setPinThroughBiometric(bioPin) {
        if (bioPin && bioPin.length === 4) {
          setPin(bioPin);
        }
      },
    }));

    useEffect(() => {
      _handlePinComplete();
    }, [pin]);

    const _handlePinComplete = async () => {
      if (pin.length === 4) {
        await delay(100);
        await setPinCode(pin);
        setPin('');
      }
    };

    const _handleKeyboardOnPress = async value => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      try {
        if (unlocking) {
          return;
        }
        if (value === 'clear') {
          setPin('');
          return;
        }
        if (value === 'trim') {
          setPin(pin ? pin.substring(0, pin.length - 1) : pin);
          return;
        }
        const newPin = `${pin}${value}`;

        if (pin.length < 4) {
          setPin(newPin);
        } else if (pin.length >= 4) {
          setPin(`${value}`);
        }
      } catch (err) {
        console.warn('Failed to handle keyboard press as expected', err);
      }
    };

    const _handleBackPress = () => {
      navigation.goBack();
    };

    return (
      <MainWrapper>
        <VStack style={[styles.container]} items="center">
          {!hideCloseButton && (
            <View style={styles.backIconContainer}>
              <Button
                uppercase
                compact
                contentStyle={{height: 25}}
                labelStyle={{
                  marginHorizontal: 8,
                  marginVertical: 0,
                  height: 20,
                  alignItems: 'center',
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'white',
                }}
                icon="close"
                style={[
                  {backgroundColor: MD2Colors.red400, height: 25, marginTop:10},
                ]}
                mode={'contained-tonal'}
                onPress={_handleBackPress}>
                {'Close'}
              </Button>

            </View>
          )}
          <>
            {username ? (
              <View style={styles.logoView}>
                <BadgeAvatar
                  name={username}
                  avatarSize={80}
                  avatarQuality="medium"
                />
              </View>
            ) : null}
          </>

          <>
            {username ? (
              <View style={styles.titleView}>
                <Text
                  style={styles.title}
                  variant="bodyLarge">{`@${username}`}</Text>
              </View>
            ) : null}
          </>
          <View style={styles.informationView}>
            <Text style={{textAlign: 'center'}} variant="labelMedium">
              {informationText}
            </Text>
          </View>

          <View style={styles.animatedView}>
            <PinAnimatedInput pin={pin} loading={false} />
          </View>

          {unlocking ? (
            <ProgressBar
              visible
              indeterminate
              style={{height: 4, width: 100, borderRadius: 45}}
            />
          ) : null}

          <View style={styles.numericKeyboardView}>
            <NumericKeyboard onPress={_handleKeyboardOnPress} />
          </View>
          {showForgotButton ? (
            <View style={styles.forgotButtonView}>
              <Button
                mode="contained"
                compact
                labelStyle={{marginVertical: 4, marginHorizontal: 10}}
                onPress={() => handleForgotButton()}
                icon={'lock-reset'}>
                RESET
              </Button>
            </View>
          ) : (
            <View style={styles.forgotButtonView} />
          )}
        </VStack>
      </MainWrapper>
    );
  },
);

export default PinCodeView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: height / 15,
  },
  logoView: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width / 7,
  },
  backIconContainer: {
    paddingHorizontal: 16,
    left: 0,
    position: 'absolute',
  },

  titleView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#357ce6',
    fontWeight: '700',
  },
  informationText: {
    color: 'red',
    textAlign: 'center',
  },
  informationView: {
    flex: 1,
    alignItems: 'center',
    color: 'red',
  },
  animatedView: {
    flex: 1,
    alignItems: 'center',
  },
  numericKeyboardView: {
    flex: 6,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  forgotButtonView: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  forgotButtonText: {
    fontSize: 14,
    marginTop: 25,
    alignSelf: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 64 / 2,
  },
});
