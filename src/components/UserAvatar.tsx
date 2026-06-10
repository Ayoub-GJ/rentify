import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SmartImage from './SmartImage';
import { getUserById } from '../services/firestoreService';
import { avatarColorFromUid, getInitials } from '../utils/formatters';
import { Typography } from '../theme/theme';

interface Props {
  uid: string;
  size: number;
  name?: string;
  photoURL?: string;
}

export default function UserAvatar({ uid, size, name, photoURL: photoProp }: Props) {
  const [photoURL, setPhotoURL] = useState<string | undefined>(photoProp);

  useEffect(() => {
    if (photoProp) {
      setPhotoURL(photoProp);
      return;
    }
    if (!uid) return;
    getUserById(uid).then((user) => {
      if (user?.photoURL) setPhotoURL(user.photoURL);
    });
  }, [uid, photoProp]);

  const bg = avatarColorFromUid(uid);
  const initials = name
    ? name.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).join('').slice(0, 2) || '?'
    : getInitials({ prenom: name });
  const fontSize = size * 0.38;

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      {photoURL ? (
        <SmartImage
          uri={photoURL}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: Typography.fontHeading,
    color: '#fff',
  },
});
