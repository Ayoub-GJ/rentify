import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { LocationsStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';

// ─── Types ────────────────────────────────────────────────────

interface MockMessage {
  id: string;
  texte: string;
  moi: boolean;
  heure: string;
  date: string;
}

// ─── Mock data ────────────────────────────────────────────────

const MOCK_MESSAGES: MockMessage[] = [
  { id: '1', texte: 'Bonjour, la perceuse est encore disponible ?', moi: false, heure: '14:30', date: 'Hier' },
  { id: '2', texte: 'Oui bien sûr ! Pour quelles dates ?', moi: true, heure: '14:32', date: 'Hier' },
  { id: '3', texte: 'Du 1er au 4 juin, ça vous convient ?', moi: false, heure: '14:35', date: 'Hier' },
  { id: '4', texte: 'Parfait, je confirme votre réservation.', moi: true, heure: '14:40', date: 'Hier' },
  { id: '5', texte: 'Merci beaucoup ! À bientôt 😊', moi: false, heure: '14:41', date: 'Hier' },
  { id: '6', texte: 'À bientôt, bonne journée !', moi: true, heure: '14:42', date: 'Hier' },
  { id: '7', texte: 'Bonjour, je serai là à 10h pour récupérer.', moi: false, heure: '09:15', date: "Aujourd'hui" },
  { id: '8', texte: 'Parfait, je vous attends !', moi: true, heure: '09:20', date: "Aujourd'hui" },
];

// ─── Props ────────────────────────────────────────────────────

type Props = StackScreenProps<LocationsStackParamList, 'Chat'>;

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

function MessageBubble({ msg }: { msg: MockMessage }) {
  if (msg.moi) {
    return (
      <View style={styles.rowRight}>
        <View style={styles.bubbleSent}>
          <Text style={styles.bubbleSentText}>{msg.texte}</Text>
        </View>
        <Text style={styles.timeRight}>{msg.heure}</Text>
      </View>
    );
  }
  return (
    <View style={styles.rowLeft}>
      <View style={[styles.bubbleReceived, Shadows.sm]}>
        <Text style={styles.bubbleReceivedText}>{msg.texte}</Text>
      </View>
      <Text style={styles.timeLeft}>{msg.heure}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<MockMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  function sendMessage() {
    if (!inputText.trim()) return;
    const newMsg: MockMessage = {
      id: Date.now().toString(),
      texte: inputText.trim(),
      moi: true,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: "Aujourd'hui",
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  }

  // Build list items with date separators
  type ListItem = { type: 'separator'; date: string; key: string } | { type: 'message'; msg: MockMessage; key: string };

  const listItems: ListItem[] = [];
  let lastDate = '';
  for (const msg of messages) {
    if (msg.date !== lastDate) {
      listItems.push({ type: 'separator', date: msg.date, key: `sep-${msg.date}` });
      lastDate = msg.date;
    }
    listItems.push({ type: 'message', msg, key: msg.id });
  }

  return (
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
            <Text style={styles.avatarInitials}>MA</Text>
          </View>
          <View>
            <Text style={styles.headerName}>Mohammed Alami</Text>
            <Text style={styles.headerSub}>Perceuse Bosch GSB 18V</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
          <Ionicons name="call-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Object banner */}
      <View style={styles.banner}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400' }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerTitle} numberOfLines={1}>Perceuse Bosch GSB 18V</Text>
          <Text style={styles.bannerDates}>1 juin → 4 juin · 3 jours</Text>
        </View>
        <Text style={styles.bannerPrice}>75 MAD</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={listItems}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) =>
          item.type === 'separator'
            ? <DateSeparator label={item.date} />
            : <MessageBubble msg={item.msg} />
        }
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: Platform.OS === 'android' ? 10 : insets.bottom + 8 },
        ]}
      >
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
          placeholderTextColor={Colors.textTertiary}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} activeOpacity={0.8}>
          <Ionicons name="send" size={20} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 2,
  },
  bannerDates: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bannerPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: 14,
    color: Colors.primary,
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
  },
});
