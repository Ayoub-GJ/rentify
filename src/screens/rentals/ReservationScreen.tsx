import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';
import { HomeStackParamList } from '../../navigation/types';

type NavProp = StackNavigationProp<HomeStackParamList, 'Reservation'>;
type RouteType = RouteProp<HomeStackParamList, 'Reservation'>;

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

function diffDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ReservationScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { item } = route.params;
  const insets = useSafeAreaInsets();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [message, setMessage] = useState('');
  const [dateError, setDateError] = useState('');

  const duration = startDate && endDate ? diffDays(startDate, endDate) : 0;
  const total = duration > 0 ? duration * item.prixParJour : 0;
  const canReserve = startDate !== null && endDate !== null && duration > 0 && !dateError;

  function openPicker(mode: 'start' | 'end') {
    setPickerMode(mode);
    setShowPicker(true);
  }

  function handleDateChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selected) return;

    const picked = new Date(selected);
    picked.setHours(0, 0, 0, 0);

    if (pickerMode === 'start') {
      setStartDate(picked);
      setEndDate(null);
      if (picked < today) {
        setDateError("La date de début doit être aujourd'hui ou plus tard.");
      } else {
        setDateError('');
      }
    } else {
      setEndDate(picked);
      if (startDate && picked <= startDate) {
        setDateError('La date de fin doit être après la date de début.');
      } else {
        setDateError('');
      }
    }
  }

  function handleConfirm() {
    Alert.alert('Demande envoyée !', 'Le propriétaire a été notifié de votre demande.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  const image = item.images?.[0];
  const minEndDate = startDate
    ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
    : today;

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
        <Text style={styles.headerTitle}>Réserver</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120 }}
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
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.titre}</Text>
            <View style={styles.itemCityRow}>
              <Ionicons name="location" size={12} color={Colors.textSecondary} />
              <Text style={styles.itemCity}> {item.ville}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {item.prixParJour} MAD{' '}
              <Text style={styles.itemPriceUnit}>/jour</Text>
            </Text>
          </View>
        </View>

        {/* ── Dates ── */}
        <Text style={styles.sectionTitle}>Dates de location</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateBtn, startDate ? styles.dateBtnActive : null]}
            onPress={() => openPicker('start')}
            activeOpacity={0.8}
          >
            <View style={styles.dateBtnTop}>
              <Text style={styles.dateBtnLabel}>Début</Text>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={[styles.dateBtnValue, !startDate && styles.dateBtnPlaceholder]}>
              {startDate ? formatDate(startDate) : 'Choisir'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateBtn, endDate ? styles.dateBtnActive : null]}
            onPress={() => openPicker('end')}
            activeOpacity={0.8}
          >
            <View style={styles.dateBtnTop}>
              <Text style={styles.dateBtnLabel}>Fin</Text>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={[styles.dateBtnValue, !endDate && styles.dateBtnPlaceholder]}>
              {endDate ? formatDate(endDate) : 'Choisir'}
            </Text>
          </TouchableOpacity>
        </View>

        {!!dateError && <Text style={styles.errorText}>{dateError}</Text>}

        {showPicker && (
          <DateTimePicker
            value={
              pickerMode === 'start'
                ? (startDate ?? today)
                : (endDate ?? minEndDate)
            }
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={pickerMode === 'start' ? today : minEndDate}
            onChange={handleDateChange}
            accentColor={Colors.primary}
          />
        )}

        {/* ── Résumé prix ── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing['2xl'] }]}>Résumé</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Prix par jour</Text>
            <Text style={styles.summaryValue}>{item.prixParJour} MAD</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Durée</Text>
            <Text style={styles.summaryValue}>
              {duration > 0 ? `${duration} jour${duration > 1 ? 's' : ''}` : '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.totalLabel]}>Total</Text>
            <Text style={styles.totalValue}>{total > 0 ? `${total} MAD` : '—'}</Text>
          </View>
        </View>

        {/* ── Message optionnel ── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing['2xl'] }]}>
          Message au propriétaire{' '}
          <Text style={{ color: Colors.textTertiary, fontFamily: Typography.fontBody, fontSize: 13 }}>
            (optionnel)
          </Text>
        </Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Présentez-vous et expliquez votre utilisation..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />
      </ScrollView>

      {/* ── Bottom bar ── */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'android' ? 20 : insets.bottom + 12,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        elevation: 10,
      }}>
        <View>
          <Text style={{ fontSize: 20, fontFamily: Typography.fontDisplay, color: Colors.primary }}>
            {total > 0 ? `${total} MAD` : '—'}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textTertiary, fontFamily: Typography.fontBody }}>
            total
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={canReserve ? 0.88 : 1}
          disabled={!canReserve}
          onPress={handleConfirm}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: Radius.full,
            height: 52,
            paddingHorizontal: 24,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canReserve ? 1 : 0.5,
          }}
        >
          <Text style={{ color: 'white', fontSize: 15, fontFamily: Typography.fontHeading }}>
            Confirmer la réservation
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  // ── Item card ──
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    ...Shadows.sm,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: Radius.md,
  },
  itemTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemCity: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Typography.fontBody,
  },
  itemPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: 16,
    color: Colors.primary,
  },
  itemPriceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textTertiary,
  },

  // ── Dates ──
  sectionTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateBtnActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dateBtnTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateBtnLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: Typography.fontBody,
  },
  dateBtnValue: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  dateBtnPlaceholder: {
    color: Colors.textTertiary,
    fontFamily: Typography.fontBody,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: Typography.fontBody,
    marginBottom: Spacing.md,
  },

  // ── Summary card ──
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing['2xl'],
    ...Shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  totalLabel: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontFamily: Typography.fontDisplay,
    fontSize: 16,
    color: Colors.primary,
  },

  // ── Message ──
  messageInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    height: 100,
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
});
