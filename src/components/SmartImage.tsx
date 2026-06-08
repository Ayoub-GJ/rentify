import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, ImageStyle } from 'react-native';
import { Colors } from '../theme/theme';

interface Props {
  uri: string;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain';
}

export default function SmartImage({ uri, style, resizeMode = 'cover' }: Props) {
  const [isLoading, setIsLoading] = useState(!!uri);

  useEffect(() => {
    setIsLoading(!!uri);
  }, [uri]);

  return (
    <View style={[{ backgroundColor: Colors.surfaceAlt, overflow: 'hidden' }, style]}>
      {!!uri && (
        <Image
          key={uri}
          source={{ uri, cache: 'reload' }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      )}
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}
