import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Item } from '../types';
import { askAssistant } from '../services/aiService';
import { toMockItem } from '../utils/itemHelpers';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '../theme/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface TextSegment {
  text: string;
  item?: Item;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  text: "Bonjour ! Décrivez-moi ce que vous cherchez et je vous aiderai à trouver l'objet idéal.",
};

const SUGGESTIONS = [
  'Objet le moins cher',
  'Sport à Agadir',
  'Outils disponibles',
] as const;

interface Props {
  items: Item[];
}

const { width: screenWidth } = Dimensions.get('window');
const FAB_BOTTOM = 20;
const POPUP_BOTTOM = FAB_BOTTOM + 56 + 12;

// Split text into plain/linked segments by matching exact item titles.
// Longest titles checked first to avoid partial-match collisions.
function parseSegments(text: string, items: Item[]): TextSegment[] {
  const sorted = [...items].sort((a, b) => b.titre.length - a.titre.length);
  const segments: TextSegment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest = remaining.length;
    let matched: Item | null = null;

    for (const item of sorted) {
      const idx = remaining.indexOf(item.titre);
      if (idx !== -1 && idx < earliest) {
        earliest = idx;
        matched = item;
      }
    }

    if (matched) {
      if (earliest > 0) segments.push({ text: remaining.substring(0, earliest) });
      segments.push({ text: matched.titre, item: matched });
      remaining = remaining.substring(earliest + matched.titre.length);
    } else {
      segments.push({ text: remaining });
      remaining = '';
    }
  }

  return segments;
}

export default function AIAssistant({ items }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const popupAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  function openPopup() {
    setIsMounted(true);
    setIsOpen(true);
    Animated.parallel([
      Animated.spring(popupAnim, { toValue: 1, tension: 220, friction: 14, useNativeDriver: true }),
      Animated.timing(iconAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function closePopup() {
    setIsOpen(false);
    Animated.parallel([
      Animated.timing(popupAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(iconAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setIsMounted(false));
  }

  // Accepts an explicit text (from suggestion chips) or reads inputText
  async function send(textOverride?: string) {
    const text = (textOverride ?? inputText).trim();
    if (!text || loading) return;
    if (!textOverride) setInputText('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();

    try {
      const reply = await askAssistant(text, items);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: "Désolé, je n'arrive pas à vous répondre pour le moment. Réessayez dans quelques instants.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  const popupScale = popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const popupTranslateY = popupAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const overlayOpacity = popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] });
  const iconRotation = iconAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const renderBubbleContent = (msg: Message) => {
    const isUser = msg.role === 'user';
    const baseStyle = [styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI];

    if (isUser || items.length === 0) {
      return <Text style={baseStyle}>{msg.text}</Text>;
    }

    const segments = parseSegments(msg.text, items);
    const hasLinks = segments.some((s) => s.item);
    if (!hasLinks) {
      return <Text style={baseStyle}>{msg.text}</Text>;
    }

    return (
      <Text style={baseStyle}>
        {segments.map((seg, i) =>
          seg.item ? (
            <Text
              key={i}
              style={styles.itemLink}
              onPress={() => navigation.navigate('ItemDetail', { item: toMockItem(seg.item!) })}
            >
              {seg.text}
            </Text>
          ) : (
            <Text key={i}>{seg.text}</Text>
          ),
        )}
      </Text>
    );
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    return (
      <View key={msg.id} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={12} color={Colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          {renderBubbleContent(msg)}
        </View>
      </View>
    );
  };

  return (
    <>
      {isMounted && (
        <TouchableWithoutFeedback onPress={closePopup}>
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
            pointerEvents={isOpen ? 'auto' : 'none'}
          />
        </TouchableWithoutFeedback>
      )}

      {isMounted && (
        <Animated.View
          style={[
            styles.popup,
            {
              opacity: popupAnim,
              transform: [{ scale: popupScale }, { translateY: popupTranslateY }],
            },
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          {/* Header */}
          <View style={styles.popupHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Assistant Rentify</Text>
            </View>
            <TouchableOpacity
              onPress={closePopup}
              style={styles.closeBtn}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(renderMessage)}

            {/* Suggestion chips — visible only when only the welcome message is shown */}
            {messages.length === 1 && !loading && (
              <View style={styles.suggestionsRow}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionChip}
                    onPress={() => send(s)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.suggestionChipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {loading && (
              <View style={[styles.msgRow, styles.msgRowAI]}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={12} color={Colors.primary} />
                </View>
                <View style={[styles.bubble, styles.bubbleAI]}>
                  <Text style={styles.dotsText}>…</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Décrivez ce que vous cherchez…"
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={400}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => send()}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={15} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={isOpen ? closePopup : openPopup}
        activeOpacity={0.85}
      >
        <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
          <Ionicons
            name={isOpen ? 'close' : 'sparkles'}
            size={24}
            color={Colors.textInverse}
          />
        </Animated.View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 998,
  },

  popup: {
    position: 'absolute',
    bottom: POPUP_BOTTOM,
    left: 16,
    right: 16,
    height: 420,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    zIndex: 999,
    ...Shadows.lg,
  },

  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAI: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: (screenWidth - 32) * 0.72,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: Colors.textInverse,
  },
  bubbleTextAI: {
    color: Colors.textPrimary,
  },
  itemLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontFamily: Typography.fontBodyMedium,
  },
  dotsText: {
    fontFamily: Typography.fontDisplay,
    fontSize: 16,
    color: Colors.textTertiary,
    letterSpacing: 2,
  },

  // ── Suggestion chips ──
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginLeft: 28 + Spacing.xs, // align with AI bubble (avatar width + gap)
  },
  suggestionChip: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryXLight,
  },
  suggestionChipText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.xs,
    color: Colors.primary,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 80,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
    ...Shadows.none,
  },

  fab: {
    position: 'absolute',
    bottom: FAB_BOTTOM,
    right: 20,
    zIndex: 1000,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
    elevation: 10,
  },
});
