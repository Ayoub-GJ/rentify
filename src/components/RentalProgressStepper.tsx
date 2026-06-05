import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatutDemande } from '../types';
import { Colors, Typography, Spacing } from '../theme/theme';

type StepState = 'done' | 'active' | 'future';

const STEPS = ['Demande', 'Acceptée', 'En cours', 'Terminée'];

const STEP_INDEX: Partial<Record<StatutDemande, number>> = {
  [StatutDemande.PENDING]:     0,
  [StatutDemande.ACCEPTED]:    1,
  [StatutDemande.IN_PROGRESS]: 2,
  [StatutDemande.COMPLETED]:   3,
};

function getStepState(idx: number, currentIdx: number, isCompleted: boolean): StepState {
  if (isCompleted) return 'done';
  if (idx < currentIdx) return 'done';
  if (idx === currentIdx) return 'active';
  return 'future';
}

interface Props {
  currentStatut: StatutDemande;
}

export default function RentalProgressStepper({ currentStatut }: Props) {
  if (currentStatut === StatutDemande.REJECTED) {
    return (
      <View style={styles.bannerRed}>
        <Ionicons name="close-circle" size={18} color={Colors.rejected} />
        <Text style={styles.bannerRedText}>Demande refusée</Text>
      </View>
    );
  }

  if (currentStatut === StatutDemande.CANCELLED) {
    return (
      <View style={styles.bannerGrey}>
        <Ionicons name="ban-outline" size={18} color={Colors.cancelled} />
        <Text style={styles.bannerGreyText}>Location annulée</Text>
      </View>
    );
  }

  const currentIdx = STEP_INDEX[currentStatut] ?? 0;
  const isCompleted = currentStatut === StatutDemande.COMPLETED;

  return (
    <View style={styles.container}>
      {STEPS.map((label, idx) => {
        const state = getStepState(idx, currentIdx, isCompleted);
        const isLast = idx === STEPS.length - 1;

        return (
          <React.Fragment key={label}>
            {/* Step circle + label */}
            <View style={styles.stepWrapper}>
              <View style={[
                styles.circle,
                state === 'done'   && styles.circleDone,
                state === 'active' && styles.circleActive,
                state === 'future' && styles.circleFuture,
              ]}>
                {state === 'done' ? (
                  <Ionicons name="checkmark" size={14} color={Colors.textInverse} />
                ) : (
                  <Text style={[
                    styles.circleNumber,
                    state === 'active' && styles.circleNumberActive,
                    state === 'future' && styles.circleNumberFuture,
                  ]}>
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.label,
                state === 'done'   && styles.labelDone,
                state === 'active' && styles.labelActive,
                state === 'future' && styles.labelFuture,
              ]} numberOfLines={1}>
                {label}
              </Text>
            </View>

            {/* Connector line */}
            {!isLast && (
              <View style={[
                styles.line,
                state === 'done' ? styles.lineDone : styles.lineFuture,
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  stepWrapper: {
    alignItems: 'center',
    width: 60,
  },

  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  circleDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  circleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  circleFuture: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },

  circleNumber: {
    fontSize: 11,
    fontFamily: Typography.fontHeading,
  },
  circleNumberActive: {
    color: Colors.textInverse,
  },
  circleNumberFuture: {
    color: Colors.textTertiary,
  },

  label: {
    fontSize: Typography.size.xs,
    textAlign: 'center',
  },
  labelDone: {
    fontFamily: Typography.fontBodyMedium,
    color: Colors.success,
  },
  labelActive: {
    fontFamily: Typography.fontHeading,
    color: Colors.primary,
  },
  labelFuture: {
    fontFamily: Typography.fontBody,
    color: Colors.textTertiary,
  },

  line: {
    flex: 1,
    height: 2,
    marginTop: 13,
  },
  lineDone: {
    backgroundColor: Colors.success,
  },
  lineFuture: {
    backgroundColor: Colors.border,
  },

  bannerRed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  bannerRedText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.rejected,
  },

  bannerGrey: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cancelledBg,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  bannerGreyText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.cancelled,
  },
});
