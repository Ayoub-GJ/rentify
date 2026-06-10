import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../theme/theme';

interface Props {
  uri: string;
  style?: object;
  resizeMode?: 'cover' | 'contain';
}

export default function SmartImage({ uri, style, resizeMode = 'cover' }: Props) {
  return (
    <View style={[{ backgroundColor: Colors.surfaceAlt, overflow: 'hidden' }, style]}>
      {!!uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit={resizeMode}
          cachePolicy="disk"
          transition={150}
          renderToHardwareTextureAndroid
        />
      )}
    </View>
  );
}
