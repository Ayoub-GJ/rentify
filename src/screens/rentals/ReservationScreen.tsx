import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth } from '../../config/firebase.config';
import { createRental, getItemById } from '../../services/firestoreService';
import { StatutDemande } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';
import { HomeStackParamList } from '../../navigation/types';

type NavProp = StackNavigationProp<HomeStackParamList, 'Reservation'>;
type RouteType = RouteProp<HomeStackParamList, 'Reservation'>;

// ─── Constants ───────────────────────────────────────────────

const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ─── Helpers ─────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Mon=0 … Sun=6
function getFirstDayOffset(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon…
  return jsDay === 0 ? 6 : jsDay - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function formatDisplay(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 4).toLowerCase()}.`;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ─── Component ───────────────────────────────────────────────

export default function ReservationScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { item } = route.params;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const today = startOfDay(new Date());

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const summaryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(summaryAnim, {
      toValue: startDate && endDate ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [startDate, endDate]);

  // ── Calendar geometry ─────────────────────────────────────
  // Card: marginH=20, paddingH=16 each side → available = screenWidth-72
  const CELL_SIZE = Math.floor((screenWidth - 72) / 7);
  const CIRCLE_SIZE = CELL_SIZE - 8;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstOffset = getFirstDayOffset(year, month);

  const cells: (number | null)[] = [
    ...Array(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  // ── Month navigation ──────────────────────────────────────
  const firstThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoPrev = currentMonth > firstThisMonth;

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  // ── Date selection logic ──────────────────────────────────
  function handleDayPress(day: number) {
    const pressed = startOfDay(new Date(year, month, day));
    if (pressed < today) return;

    if (!startDate || (startDate && endDate)) {
      // Fresh start
      setStartDate(pressed);
      setEndDate(null);
    } else {
      // startDate set, endDate not yet
      if (pressed <= startDate) {
        setStartDate(pressed);
        setEndDate(null);
      } else {
        setEndDate(pressed);
      }
    }
  }

  // ── Derived values ────────────────────────────────────────
  const duration = startDate && endDate ? diffDays(startDate, endDate) : 0;
  const total = duration * item.prixParJour;
  const canReserve = startDate !== null && endDate !== null && duration > 0;

  async function handleConfirm() {
    if (!auth.currentUser || !startDate || !endDate) return;

    setLoading(true);
    try {
      const fullItem = await getItemById(item.id);
      if (!fullItem) throw new Error('Objet introuvable');

      await createRental({
        itemId: item.id,
        itemTitre: item.titre,
        itemImage: item.images?.[0] ?? '',
        locataireId: auth.currentUser.uid,
        proprietaireId: fullItem.proprietaireId ?? fullItem.ownerId ?? '',
        dateDebut: startDate,
        dateFin: endDate,
        jours: duration,
        prixTotal: total,
        message: message.trim(),
        statut: StatutDemande.PENDING,
      });

      setLoading(false);
      Alert.alert(
        'Demande envoyée',
        'Le propriétaire sera notifié.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      setLoading(false);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Réessayez.');
    }
  }

  // ── Day cell renderer ─────────────────────────────────────
  function renderDayCell(day: number | null, key: string) {
    if (day === null) {
      return <View key={key} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
    }

    const date = startOfDay(new Date(year, month, day));
    const isPast = date < today;
    const isToday = isSameDay(date, today);
    const isStart = startDate ? isSameDay(date, startDate) : false;
    const isEnd = endDate ? isSameDay(date, endDate) : false;
    const inRange =
      startDate && endDate ? date > startDate && date < endDate : false;

    // Strip (range background)
    let showStrip = false;
    let stripLeft: number | string = 0;
    let stripRight: number | string = 0;

    if (isStart && endDate && !isEnd) {
      showStrip = true;
      stripLeft = '50%';
      stripRight = 0;
    } else if (isEnd && startDate && !isStart) {
      showStrip = true;
      stripLeft = 0;
      stripRight = '50%';
    } else if (inRange) {
      showStrip = true;
      stripLeft = 0;
      stripRight = 0;
    }

    const stripInset = (CELL_SIZE - CIRCLE_SIZE) / 2;

    // Text color
    let textColor = Colors.textPrimary;
    if (isPast) textColor = Colors.textTertiary;
    else if (isStart || isEnd) textColor = Colors.textInverse;
    else if (inRange) textColor = Colors.primary;

    return (
      <TouchableOpacity
        key={key}
        onPress={() => !isPast && handleDayPress(day)}
        activeOpacity={isPast ? 1 : 0.75}
        style={{ width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center', opacity: isPast ? 0.4 : 1 }}
      >
        {/* Range strip */}
        {showStrip && (
          <View
            style={{
              position: 'absolute',
              top: stripInset,
              bottom: stripInset,
              left: stripLeft as number,
              right: stripRight as number,
              backgroundColor: Colors.primaryXLight,
            }}
          />
        )}

        {/* Circle (start / end) */}
        <View
          style={{
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            backgroundColor: isStart || isEnd ? Colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: isStart || isEnd ? Typography.fontHeading : Typography.fontBody,
              fontSize: 14,
              color: textColor,
            }}
          >
            {day}
          </Text>
        </View>

        {/* Today dot */}
        {isToday && !isStart && !isEnd && (
          <View
            style={{
              position: 'absolute',
              bottom: 3,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.primary,
            }}
          />
        )}
      </TouchableOpacity>
    );
  }

  const image = item.images?.[0];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.headerTitle}>Choisir les dates</Text>
          <Text style={styles.headerSubtitle}>Appuyez sur deux dates pour sélectionner</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Card objet ── */}
        <View style={styles.itemCard}>
          {image ? (
            <Image source={{ uri: image }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={[styles.itemImage, { backgroundColor: Colors.surfaceAlt }]} />
          )}
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.titre}</Text>
            <Text style={styles.itemPrice}>
              {item.prixParJour} MAD
              <Text style={styles.itemPriceUnit}> /jour</Text>
            </Text>
          </View>
        </View>

        {/* ── Calendrier ── */}
        <View style={styles.calendarCard}>
          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={prevMonth}
              disabled={!canGoPrev}
              style={{ opacity: canGoPrev ? 1 : 0.25, padding: Spacing.xs }}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={{ padding: Spacing.xs }}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((lbl) => (
              <View key={lbl} style={{ width: CELL_SIZE, alignItems: 'center' }}>
                <Text style={styles.dayLabel}>{lbl}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row' }}>
              {row.map((day, ci) => renderDayCell(day, `${ri}-${ci}`))}
            </View>
          ))}
        </View>

        {/* ── Summary card (animée) ── */}
        <Animated.View
          style={[
            styles.summaryCard,
            {
              opacity: summaryAnim,
              transform: [{
                translateY: summaryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
          pointerEvents={canReserve ? 'auto' : 'none'}
        >
          <View style={styles.summaryTopRow}>
            <Ionicons name="calendar" size={15} color={Colors.primary} />
            <Text style={styles.summaryDates}>
              {startDate ? ` ${formatDisplay(startDate)}` : ''}{' '}→{' '}
              {endDate ? formatDisplay(endDate) : ''}
            </Text>
            <Text style={styles.summaryNights}>
              {'  '}•{'  '}{duration} jour{duration > 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.summaryCalc}>
            {item.prixParJour} MAD × {duration} jour{duration > 1 ? 's' : ''} ={' '}
            <Text style={styles.summaryTotal}>{total} MAD</Text>
          </Text>
        </Animated.View>

        {/* ── Message optionnel ── */}
        <View style={styles.messageSection}>
          <Text style={styles.messageLabel}>
            Message{'  '}
            <Text style={{ color: Colors.textTertiary, fontFamily: Typography.fontBody }}>
              (optionnel)
            </Text>
          </Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Bonjour, je voudrais louer votre objet pour..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* ── Bottom bar ── */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Platform.OS === 'android' ? 20 : insets.bottom + 12 },
        ]}
      >
        {canReserve ? (
          <>
            <View>
              <Text style={styles.bottomTotal}>{total} MAD total</Text>
              <Text style={styles.bottomMeta}>
                {duration} jour{duration > 1 ? 's' : ''} · {item.prixParJour} MAD/j
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
              activeOpacity={0.88}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.confirmBtnText}>Demander →</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>Sélectionnez vos dates</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Item card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
  },
  itemTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: 15,
    color: Colors.primary,
  },
  itemPriceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textTertiary,
  },

  // Calendar
  calendarCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  monthTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayLabel: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  summaryDates: {
    fontFamily: Typography.fontHeading,
    fontSize: 14,
    color: Colors.primary,
  },
  summaryNights: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryCalc: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryTotal: {
    fontFamily: Typography.fontDisplay,
    fontSize: 14,
    color: Colors.primary,
  },

  // Message
  messageSection: {
    paddingHorizontal: Spacing.xl,
  },
  messageLabel: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  messageInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    height: 90,
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 10,
  },
  bottomTotal: {
    fontFamily: Typography.fontDisplay,
    fontSize: 20,
    color: Colors.primary,
  },
  bottomMeta: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 52,
    paddingHorizontal: Spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  confirmBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.textInverse,
  },
  disabledBtn: {
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtnText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 15,
    color: Colors.textTertiary,
  },
});
