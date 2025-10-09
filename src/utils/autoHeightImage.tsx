import React, {useMemo, useState} from 'react';
import {ActivityIndicator, Platform, TouchableOpacity} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {Button, MD2Colors} from 'react-native-paper';
import {proxifyImageSrc} from './e-render/src';
import {Icons} from '../components/Icons';

interface AutoHeightImageProps {
  contentWidth: number;
  imgUrl: string;
  metadata: any;
  isAnchored: boolean;
  activeOpacity?: number;
  onPress: () => void;
}

export const AutoHeightImage = ({
  contentWidth,
  imgUrl,
  metadata,
  isAnchored,
  activeOpacity,
  onPress,
}: AutoHeightImageProps) => {
  // extract iniital height based on provided ratio
  const _initialHeight = useMemo(() => {
    let _height = contentWidth / (16 / 9);
    if (metadata && metadata.image && metadata.image_ratios) {
      metadata.image_ratios.forEach((_ratio, index) => {
        const url = metadata.image[index];

        if (url && !isNaN(_ratio)) {
          const poxifiedUrl = proxifyImageSrc(
            url,
            undefined,
            undefined,
            Platform.select({
              ios: 'match',
              android: 'webp',
            }),
          );

          if (imgUrl === poxifiedUrl) {
            const _ratio = metadata.image_ratios[index];
            _height = contentWidth / _ratio;
          }
        }
      });
    }
    return _height;
  }, [imgUrl]);

  const [imgWidth, setImgWidth] = useState(contentWidth);
  const [imgHeight, setImgHeight] = useState(_initialHeight);
  const [onLoadCalled, setOnLoadCalled] = useState(false);
  const [onFailedCalled, setOnFailedCalled] = useState(false);
  const [onLoadEndCalled, setOnLoadEndCalled] = useState(false);

  // NOTE: important to have post image bound set even for images with ratio already provided
  // as this handles the case where width can be lower than contentWidth
  const _setImageBounds = (width, height) => {
    const newWidth = width < contentWidth ? width : contentWidth;
    const newHeight = (height / width) * newWidth;
    setImgHeight(newHeight);
    setImgWidth(newWidth);
  };

  const imgStyle = {
    width: imgWidth,
    height: imgHeight,
    backgroundColor: onLoadCalled ? 'transparent' : '#7c8085',
  };

  const _onLoad = evt => {
    setOnLoadCalled(true);
    _setImageBounds(evt.nativeEvent.width, evt.nativeEvent.height);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isAnchored}
      activeOpacity={activeOpacity || 1}>
      {onLoadEndCalled ? null : onFailedCalled ? null : (
        <ActivityIndicator
          color={MD2Colors.white}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 4,
          }}
          size={18}
        />
      )}

      {onFailedCalled ? (
        <Button
          theme={{roundness: 0}}
          mode="text"
          labelStyle={{color: 'white'}}
          style={[imgStyle, {alignItems: 'center', justifyContent: 'center'}]}
          icon={() => (
            <Icons.MaterialCommunityIcons
              name="close"
              color={'red'}
              size={18}
            />
          )}>
          Invalid image
        </Button>
      ) : null}

      <FastImage
        style={onFailedCalled ? undefined : imgStyle}
        source={{uri: imgUrl}}
        resizeMode={FastImage.resizeMode.contain}
        onLoad={_onLoad}
        onLoadEnd={() => {
          setOnLoadEndCalled(true);
        }}
        onError={() => {
          setOnFailedCalled(true);
        }}
      />
    </TouchableOpacity>
  );
};
