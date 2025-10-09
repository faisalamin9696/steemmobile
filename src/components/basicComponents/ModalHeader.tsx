import {HStack, VStack} from '@react-native-material/core';
import {Button, MD2Colors, Text} from 'react-native-paper';
import {ViewStyle} from 'react-native';
import React from 'react';

interface Props {
  title: string;
  varient?: any;
  onClose?: () => void;
  closeText?: string;
  subTitle?: string | React.ReactNode;
  subtitleStyle?: ViewStyle;
  handleSubTitleClick?: () => void;
}
const ModalHeader = (props: Props) => {
  const {
    title,
    onClose,
    varient,
    closeText,
    subTitle,
    subtitleStyle,
    handleSubTitleClick,
  } = props;

  return (
    <VStack>
      <HStack items="center" spacing={20}>
        <Text variant={varient || 'titleMedium'}>{title}</Text>
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
          style={{backgroundColor: MD2Colors.red400, height: 25}}
          mode={'contained-tonal'}
          onPress={onClose}>
          {closeText || 'Close'}
        </Button>
      </HStack>
      {subTitle ? (
        typeof subTitle === 'string' ? (
          <Text
            variant="bodySmall"
            onPress={handleSubTitleClick}
            style={[
              {marginTop: 15, textAlign: 'justify', opacity: 0.8},
              subtitleStyle,
            ]}>
            {subTitle || ''}
          </Text>
        ) : (
          subTitle
        )
      ) : null}
    </VStack>
  );
};

export default ModalHeader;
