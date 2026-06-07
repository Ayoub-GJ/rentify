import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase.config';
import {
  getUserConversations,
  ConversationWithUser,
} from '../../services/firestoreService';
import { Colors, Spacing, Radius, Typography, Layout } from '../../theme/theme';
import { fullName, getInitials, avatarColorFromUid } from '../../utils/formatters';
import { HomeStackParamList } from '../../navigation/types';

type MessagesNavProp = StackNavigationProp<HomeStackParamList, 'Messages'>;

// ─── Helpers ──────────────────────────────────────────────────

function renderLastMessage(lastMessage: string) {
  const isImage = lastMessage === '__IMAGE__' || lastMessage.startsWith('📷');
  if (isImage) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name="image-outline" size={14} color={Colors.textSecondary} />
        <Text style={msgStyles.lastMessage}>Photo</Text>
      </View>
    );
  }
  return (
    <Text style={msgStyles.lastMessage} numberOfLines={1}>
      {lastMessage || 'Aucun message'}
    </Text>
  );
}

const msgStyles = StyleSheet.create({
  lastMessage: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
});

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── Screen ───────────────────────────────────────────────────

export default function MessagesScreen() {
  const navigation = useNavigation<MessagesNavProp>();
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) { setLoading(false); return; }
        const convs = await getUserConversations(uid);
        if (active) {
          setConversations(convs);
          setLoading(false);
        }
      };
      load();
      return () => { active = false; };
    }, []),
  );

  const handleOpenChat = (conv: ConversationWithUser) => {
    navigation.navigate('Chat', {
      conversationId: conv.id,
      itemTitre: conv.itemTitre,
      itemImage: '',
      otherUserName: fullName(conv.otherUser),
      itemId: conv.itemId,
    });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptySubtitle}>
            Vos discussions avec d'autres utilisateurs apparaîtront ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const color = avatarColorFromUid(item.otherUserId);
            const initials = getInitials(item.otherUser);
            const name = fullName(item.otherUser);
            const timeLabel = item.lastMessageAt.getTime() === 0
              ? ''
              : formatTimeAgo(item.lastMessageAt);

            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleOpenChat(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: color }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                <View style={styles.content}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    {timeLabel ? (
                      <Text style={styles.time}>{timeLabel}</Text>
                    ) : null}
                  </View>
                  <View style={styles.itemTitreRow}>
                    {item.itemDeleted && (
                      <Ionicons name="archive-outline" size={13} color={Colors.textTertiary} />
                    )}
                    <Text style={styles.itemTitre} numberOfLines={1}>
                      {item.itemTitre}
                      {item.itemDeleted ? (
                        <Text style={styles.deletedSuffix}> (supprimée)</Text>
                      ) : null}
                    </Text>
                  </View>
                  {renderLastMessage(item.lastMessage)}
                </View>

                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontHeading,
    color: Colors.textPrimary,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontHeading,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.sm * Typography.lineHeight.relaxed,
  },

  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['4xl'],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#FFF',
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontBodyMedium,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontBodyMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
  time: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    flexShrink: 0,
  },
  itemTitre: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontFamily: Typography.fontBodyMedium,
    flex: 1,
  },
  itemTitreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deletedSuffix: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontFamily: Typography.fontBody,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 52 + Spacing.md,
  },
});
