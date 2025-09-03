import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlanDraft } from '../../../assets/lib/planDraft';

const COLORS = {
  bg: '#1E1E1E',
  text: '#F4F4F4',
  primary: '#FFD100',
  cta: '#FF5733',
  card: '#333533',
  divider: '#000000',
  muted: '#AAAAAA',
};

export default function BuildWorkoutPlanScreen() {
  const router = useRouter();
  const { days, selectedDayId, planLocked, actions } = usePlanDraft();

  const [askDaysVisible, setAskDaysVisible] = useState(false);
  const [daysCountDraft, setDaysCountDraft] = useState('');

  const createDays = (count) => actions.createDays(count);
  const onPressPlus = () => setAskDaysVisible(true);

  const selectedDay = useMemo(
    () => days.find((d) => d.id === selectedDayId) || null,
    [days, selectedDayId]
  );

  const canFinishPlan =
    days.length > 0 && days.every((d) => d.exercises.length > 0);

  const dayLocked = !!selectedDay?.locked;
  const canEditSelectedDay = !!selectedDay && !dayLocked && !planLocked;

  const removeExerciseFromSelectedDay = (index) => {
    if (!selectedDayId) return;
    actions.removeExercise(selectedDayId, index);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <Stack.Screen
        options={{
          title: 'Build Workout Plan',
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.primary,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
        }}
      />

      {/* One master scroll for the entire page */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Top controls: Finish Plan / Edit Plan */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold" style={{ color: COLORS.text, fontSize: 20 }}>
              Current Plan
            </Text>

            <View className="flex-row items-center gap-2">
              {!planLocked && canFinishPlan ? (
                <TouchableOpacity
                  onPress={actions.lockPlan}
                  className="rounded-xl px-3 py-2"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Text className="font-bold" style={{ color: '#1E1E1E' }}>
                    Finish Plan
                  </Text>
                </TouchableOpacity>
              ) : planLocked ? (
                <TouchableOpacity
                  onPress={actions.unlockPlan}
                  className="rounded-xl px-3 py-2"
                  style={{ backgroundColor: COLORS.card }}
                >
                  <Text className="font-bold" style={{ color: COLORS.text }}>
                    Edit Plan
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={onPressPlus}
                className="rounded-full p-3"
                style={{ backgroundColor: COLORS.cta }}
                accessibilityLabel="Start building plan"
              >
                <MaterialCommunityIcons name="plus" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {days.length === 0 ? (
          <EmptyState onPressPlus={onPressPlus} />
        ) : (
          <>
            {/* Days grid (not scrollable; master ScrollView handles scrolling) */}
            <FlatList
              data={days}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
              contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <DayCard
                  day={item}
                  isSelected={item.id === selectedDayId}
                  onPress={() => actions.setSelectedDayId(item.id)}
                />
              )}
            />

            {/* Selected day panel */}
            {selectedDay && (
              <View className="rounded-t-2xl px-4 pb-4" style={{ backgroundColor: COLORS.card }}>
                <View className="flex-row items-center justify-between pt-3 pb-2">
                  <Text className="font-bold" style={{ color: COLORS.text, fontSize: 18 }}>
                    {selectedDay.name} — Exercises
                  </Text>

                  <View className="flex-row gap-2">
                    {/* Finish/Edit Day */}
                    {!planLocked && !dayLocked && selectedDay.exercises.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => actions.lockDay(selectedDay.id)}
                        className="rounded-xl px-3 py-2"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        <Text className="font-bold" style={{ color: '#1E1E1E' }}>
                          Finish Day
                        </Text>
                      </TouchableOpacity>
                    ) : !planLocked && dayLocked ? (
                      <TouchableOpacity
                        onPress={() => actions.unlockDay(selectedDay.id)}
                        className="rounded-xl px-3 py-2"
                        style={{ backgroundColor: COLORS.bg }}
                      >
                        <Text className="font-bold" style={{ color: COLORS.text }}>
                          Edit Day
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {/* Add Exercise (disabled when locked) */}
                    <TouchableOpacity
                      disabled={!canEditSelectedDay}
                      onPress={() =>
                        router.push({
                          pathname: '/categories',
                          params: { targetDayId: String(selectedDayId) },
                        })
                      }
                      className="rounded-xl px-3 py-2"
                      style={{
                        backgroundColor: COLORS.primary,
                        opacity: canEditSelectedDay ? 1 : 0.5,
                      }}
                    >
                      <Text className="font-bold" style={{ color: '#1E1E1E' }}>
                        Add Exercise
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {selectedDay.exercises.length === 0 ? (
                  <Text style={{ color: COLORS.muted }}>
                    No exercises for this day — tap “Add Exercise”
                  </Text>
                ) : (
                  // Not a ScrollView: keep a single page scroller
                  <View style={{ marginTop: 8 }}>
                    {selectedDay.exercises.map((ex, idx) => (
                      <ExerciseRow
                        key={`${ex.id}-${idx}`}
                        index={idx}
                        exercise={ex}
                        sets={ex.sets ?? 1}
                        editable={canEditSelectedDay}
                        onInc={() => actions.incrementSets(selectedDayId, idx, +1)}
                        onDec={() => actions.incrementSets(selectedDayId, idx, -1)}
                        onRemove={() => removeExerciseFromSelectedDay(idx)}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal: how many days? */}
      <Modal visible={askDaysVisible} transparent animationType="fade">
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View className="w-full rounded-2xl p-5" style={{ backgroundColor: COLORS.card }}>
            <Text className="text-center font-bold mb-4" style={{ color: COLORS.text, fontSize: 18 }}>
              How many days do you train per week?
            </Text>

            <View className="flex-row flex-wrap items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setDaysCountDraft(String(n))}
                  className={`px-3 py-2 rounded-xl ${
                    daysCountDraft === String(n) ? 'opacity-100' : 'opacity-70'
                  }`}
                  style={{ backgroundColor: daysCountDraft === String(n) ? COLORS.primary : COLORS.bg }}
                >
                  <Text style={{ color: daysCountDraft === String(n) ? '#1E1E1E' : COLORS.text }}>{n}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={daysCountDraft}
              onChangeText={setDaysCountDraft}
              placeholder="1-7"
              keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric', default: 'numeric' })}
              className="rounded-xl px-4 py-3 mb-4"
              placeholderTextColor={COLORS.muted}
              style={{ backgroundColor: COLORS.bg, color: COLORS.text }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 items-center rounded-xl px-4 py-3"
                style={{ backgroundColor: COLORS.primary }}
                onPress={() => {
                  createDays(daysCountDraft);
                  setAskDaysVisible(false);
                }}
              >
                <Text className="font-bold" style={{ color: '#1E1E1E' }}>Start</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 items-center rounded-xl px-4 py-3"
                style={{ backgroundColor: COLORS.bg }}
                onPress={() => setAskDaysVisible(false)}
              >
                <Text className="font-bold" style={{ color: COLORS.text }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Components **/

function EmptyState({ onPressPlus }) {
  // Not flex-1 inside a ScrollView; use padding to center-ish
  return (
    <View className="items-center justify-center px-8 py-24">
      <MaterialCommunityIcons name="calendar-plus" size={52} color={COLORS.primary} />
      <Text className="text-center mt-3" style={{ color: COLORS.text, fontSize: 18, fontWeight: '700' }}>
        No active plan yet
      </Text>
      <Text className="text-center mt-1" style={{ color: COLORS.muted }}>
        Tap the + button to choose training days and start building
      </Text>
      <TouchableOpacity
        onPress={onPressPlus}
        className="mt-5 rounded-2xl px-5 py-3"
        style={{ backgroundColor: COLORS.primary }}
      >
        <Text className="font-bold" style={{ color: '#1E1E1E' }}>Start now</Text>
      </TouchableOpacity>
    </View>
  );
}

function DayCard({ day, isSelected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 rounded-2xl p-4"
      style={{ backgroundColor: COLORS.card }}
      activeOpacity={0.9}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-bold" style={{ color: COLORS.text, fontSize: 18 }}>{day.name}</Text>
        <View className="flex-row items-center gap-2">
          {day.locked && <MaterialCommunityIcons name="lock" size={16} color={COLORS.primary} />}
          {isSelected && (
            <View className="rounded-full px-2 py-1" style={{ backgroundColor: COLORS.primary }}>
              <Text className="font-bold" style={{ color: '#1E1E1E', fontSize: 12 }}>Selected</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2 mt-3">
        <MaterialCommunityIcons name="dumbbell" size={18} color={COLORS.primary} />
        <Text style={{ color: COLORS.muted }}>
          {day.exercises.length} exercises {day.locked ? '• locked' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ExerciseRow({ exercise, index, sets = 1, editable, onInc, onDec, onRemove }) {
  const MIN_SETS = 1;
  const MAX_SETS = 20; // optional, matches the clamp in planDraft
  const decDisabled = !editable || sets <= MIN_SETS;
  const incDisabled = !editable || sets >= MAX_SETS;

  return (
    <View
      className="flex-row items-center rounded-xl px-4 py-3 mb-2"
      style={{ backgroundColor: '#2A2B2A' }}
    >
      {/* Left: exercise info (flexible) */}
      <View className="flex-row items-center gap-3 pr-3" style={{ flex: 1, minWidth: 0 }}>
        <MaterialCommunityIcons name="dumbbell" size={20} color={COLORS.primary} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: COLORS.text, fontWeight: '600' }}>
            {exercise.name}
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: COLORS.muted, fontSize: 12 }}>
            {exercise.muscle}
          </Text>
        </View>
      </View>

      {/* Middle: Remove (fixed width keeps position) */}
      <TouchableOpacity
        disabled={!editable}
        onPress={onRemove}
        className="rounded-xl px-3 py-2 items-center justify-center"
        style={{
          backgroundColor: COLORS.bg,
          opacity: editable ? 1 : 0.5,
          width: 92, // fixed width
        }}
      >
        <Text className="font-bold" style={{ color: COLORS.text }}>Remove</Text>
      </TouchableOpacity>

      {/* Right: sets stepper (fixed width) */}
      <View className="items-center" style={{ width: 44 }}>
        <TouchableOpacity
          disabled={incDisabled}
          onPress={onInc}
          className="rounded-md px-2 py-1 mb-1 items-center justify-center"
          style={{ backgroundColor: COLORS.card, opacity: incDisabled ? 0.4 : 1 }}
          accessibilityLabel="Increase sets"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-up" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={{ color: COLORS.text, fontWeight: '700' }}>{sets}</Text>

        <TouchableOpacity
          disabled={decDisabled}
          onPress={onDec}
          className="rounded-md px-2 py-1 mt-1 items-center justify-center"
          style={{ backgroundColor: COLORS.card, opacity: decDisabled ? 0.4 : 1 }}
          accessibilityLabel="Decrease sets"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
