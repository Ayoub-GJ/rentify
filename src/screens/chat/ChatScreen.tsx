import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  ImageStyle,
} from 'react-native';
import SmartImage from '../../components/SmartImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../config/firebase.config';
import {
  subscribeToMessages,
  sendMessage,
  uploadChatImage,
} from '../../services/firestoreService';
import { Message } from '../../types';
import {
  HomeStackParamList,
  SearchStackParamList,
  LocationsStackParamList,
} from '../../navigation/types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';

// ─── Types ────────────────────────────────────────────────────

type ChatRoute = RouteProp<
  HomeStackParamList | SearchStackParamList | LocationsStackParamList,
  'Chat'
>;

interface DisplayMessage {
  id: string;
  texte: string;
  imageUrl?: string;
  moi: boolean;
  heure: string;
  date: string;
}

// ─── Helpers ──────────────────────────────────────────────────

const MONTH_FR = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return "Aujourd'hui";
  if (diff === 86400000) return 'Hier';
  return `${date.getDate()} ${MONTH_FR[date.getMonth()]}`;
}

function getTimeLabel(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function toDisplayMessage(msg: Message, currentUid: string): DisplayMessage {
  return {
    id: msg.id,
    texte: msg.texte,
    imageUrl: msg.imageUrl,
    moi: msg.senderId === currentUid,
    heure: getTimeLabel(msg.createdAt),
    date: getDateLabel(msg.createdAt),
  };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((w) => w.length > 0)
    .map((w) => w[0].toUpperCase())
    .join('')
    .slice(0, 2) || '?';
}

// ─── DateSeparator ────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.dateSepRow}>
      <View style={styles.dateSepBadge}>
        <Text style={styles.dateSepText}>{label}</Text>
      </View>
    </View>
  );
}

// ─── MessageBubble ────────────────────────────────────────────

function MessageBubble({
  msg,
  onImagePress,
}: {
  msg: DisplayMessage;
  onImagePress: (uri: string) => void;
}) {
  const hasImage = !!msg.imageUrl;
  const hasText = !!msg.texte && msg.texte.trim().length > 0;

  if (msg.moi) {
    return (
      <View style={styles.rowRight}>
        {hasImage && (
          <TouchableOpacity onPress={() => onImagePress(msg.imageUrl!)} activeOpacity={0.9}>
            <SmartImage
              uri={msg.imageUrl!}
              style={StyleSheet.flatten([styles.msgImage, hasText ? { marginBottom: Spacing.xs } : undefined]) as ImageStyle}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        {hasText && (
          <View style={styles.bubbleSent}>
            <Text style={styles.bubbleSentText}>{msg.texte}</Text>
          </View>
        )}
        <Text style={styles.timeRight}>{msg.heure}</Text>
      </View>
    );
  }

  return (
    <View style={styles.rowLeft}>
      {hasImage && (
        <TouchableOpacity onPress={() => onImagePress(msg.imageUrl!)} activeOpacity={0.9}>
          <SmartImage
            uri={msg.imageUrl!}
            style={StyleSheet.flatten([styles.msgImage, hasText ? { marginBottom: Spacing.xs } : undefined]) as ImageStyle}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
      {hasText && (
        <View style={[styles.bubbleReceived, Shadows.sm]}>
          <Text style={styles.bubbleReceivedText}>{msg.texte}</Text>
        </View>
      )}
      <Text style={styles.timeLeft}>{msg.heure}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatRoute>();
  const { conversationId, itemTitre, itemImage, otherUserName } = route.params;
  const insets = useSafeAreaInsets();

  const currentUid = auth.currentUser?.uid ?? '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sendingImage, setSendingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [conversationId]);

  // ── Send text ──

  async function handleSend() {
    const texte = inputText.trim();
    if (!texte || !currentUid) return;
    setInputText('');
    await sendMessage(conversationId, currentUid, texte);
  }

  // ── Send image ──

  const handleSendImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', "Autorise l'accès aux photos pour envoyer une image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.6,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;

    setSendingImage(true);
    try {
      const imageUrl = await uploadChatImage(result.assets[0].uri, conversationId);
      await sendMessage(conversationId, currentUid, '', imageUrl);
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer l'image. Réessaie.");
    } finally {
      setSendingImage(false);
    }
  };

  // ── Build display list with date separators ──

  type ListItem =
    | { type: 'separator'; date: string; key: string }
    | { type: 'message'; msg: DisplayMessage; key: string };

  const listItems: ListItem[] = [];
  let lastDate = '';
  for (const raw of messages) {
    const msg = toDisplayMessage(raw, currentUid);
    if (msg.date !== lastDate) {
      listItems.push({ type: 'separator', date: msg.date, key: `sep-${msg.date}-${raw.id}` });
      lastDate = msg.date;
    }
    listItems.push({ type: 'message', msg, key: raw.id });
  }

  const initials = getInitials(otherUserName);

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.headerName}>{otherUserName}</Text>
              <Text style={styles.headerSub} numberOfLines={1}>{itemTitre}</Text>
            </View>
          </View>
        </View>

        {/* Object banner */}
        <View style={styles.banner}>
          <SmartImage uri={itemImage} style={styles.bannerImage} resizeMode="cover" />
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle} numberOfLines={1}>{itemTitre}</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) =>
            item.type === 'separator'
              ? <DateSeparator label={item.date} />
              : <MessageBubble msg={item.msg} onImagePress={setPreviewImage} />
          }
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input bar : [📷] [TextInput] [→ Send] */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: Platform.OS === 'android' ? 10 : insets.bottom + 8 },
          ]}
        >
          <TouchableOpacity
            style={styles.imgBtn}
            onPress={handleSendImage}
            disabled={sendingImage}
            activeOpacity={0.8}
          >
            {sendingImage ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="image-outline" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor={Colors.textTertiary}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.8}>
            <Ionicons name="send" size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Full-screen image preview */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.previewBackdrop}
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
        >
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: Typography.fontHeading,
    fontSize: 13,
    color: Colors.primary,
  },
  headerName: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryXLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  bannerImage: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 13,
    color: Colors.textPrimary,
  },

  // Messages list
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 80,
  },

  // Date separator
  dateSepRow: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateSepBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dateSepText: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Sent message
  rowRight: {
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  bubbleSent: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    maxWidth: '78%',
  },
  bubbleSentText: {
    fontFamily: Typography.fontBody,
    fontSize: 15,
    color: Colors.textInverse,
    lineHeight: 21,
  },
  timeRight: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },

  // Received message
  rowLeft: {
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bubbleReceived: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    maxWidth: '78%',
  },
  bubbleReceivedText: {
    fontFamily: Typography.fontBody,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  timeLeft: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },

  // Image message
  msgImage: {
    width: 220,
    height: 220,
    borderRadius: Radius.lg,
  },

  // Input bar
  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  imgBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    fontFamily: Typography.fontBody,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Full-screen preview
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 1,
    padding: Spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
});
