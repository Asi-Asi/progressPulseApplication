import React, { useMemo, useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { Stack, useRouter} from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlanDraft } from '../../../assets/lib/planDraft';
import AppLogo from "../../../assets/components/ui/AppLogo";
import BottomTabs from "../../../assets/components/navigation/BottomTabs"; // <-- tabs
import { getMyPlan, saveMyPlan } from '../../../assets/api/plan.api';
import AsyncStorage from '@react-native-async-storage/async-storage';



const ROLE_NUMBER = 20; 

export default function BuildWorkoutPlanScreen() {
  const router = useRouter();
  const { days, selectedDayId, planLocked, dirty, actions } = usePlanDraft();

  const [accessToken, setAccessToken] = useState('');
  const [roleLevel, setRoleLevel] = useState(20);

  useEffect(() => {
    (async () => {
      const [t, r] = await AsyncStorage.multiGet(['token','roleLevel']);
      setAccessToken(t?.[1] || '');
      setRoleLevel(Number(r?.[1] || 20));
    })();
  }, []);

  useEffect(() => {
  if (!accessToken) return;
  if (dirty) return;
  if (days && days.length > 0) return;
  (async () => {
    try {
      const res = await getMyPlan({ token: accessToken }); // מצופה: { days: [...] }
      if (Array.isArray(res?.days)) {
        actions.hydrateFromServer(res.days); // ימפה ל-{id,name,exercises,locked:false}
      }
    } catch (e) {
      // 404 = אין תוכנית קיימת — מתעלמים. כל שגיאה אחרת מדפיסים.
      if (e.status !== 404) console.warn('getMyPlan error:', e.message || e);
    }
  })();
}, [accessToken]);

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

  async function handleSavePlan() {
    try {
      const payload = actions.toServerPayload();
      await saveMyPlan({ token: accessToken, days: payload.days });
      actions.markClean();
      actions.lockPlan();
      Alert.alert('Saved', 'Your plan was saved successfully');
    } catch (e) {
      console.log('saveMyPlan ERROR:', {
        message: e?.message,
        status: e?.status,
        url: e?.url,
        payload: e?.payload, // ⇐ זה ה־JSON המלא שהשרת החזיר (כולל פירוט הוולידציה)
      });
      Alert.alert('Error', e?.message || 'Failed to save plan');
    } 
  }


  return (
    <View className="flex-1 bg-bg">
      {/* Header */}
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo/>,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />

      {/* Master scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 140 }} // space for tabs
      >
        <View className="px-5 pt-5">
          <Text className="text-text text-2xl font-extrabold">Build Workout Plan</Text>
          <Text className="text-muted mt-1">Create days, add exercises, and lock when ready.</Text>
        </View>

        {/* Top controls */}
        <View className="px-5 pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-text font-bold text-lg">Current Plan</Text>

            <View className="flex-row items-center gap-2">
              {!planLocked && canFinishPlan ? (
                <TouchableOpacity
                  onPress={async () => {
                    await handleSavePlan();   // ← קודם שומר לשרת
                    actions.lockPlan();       // ← ואז נועל מקומית (UI)
                  }}
                  className="rounded-xl px-3 py-2 bg-primary"
                >
                  <Text className="text-onPrimary font-bold">Finish Plan</Text>
                </TouchableOpacity>

              ) : planLocked ? (
                <TouchableOpacity
                  onPress={actions.unlockPlan}
                  className="rounded-xl px-3 py-2 bg-card"
                >
                  <Text className="text-text font-bold">Edit Plan</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={onPressPlus}
                className="rounded-full p-3 bg-primary"
                accessibilityLabel="Start building plan"
              >
                <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {days.length === 0 ? (
          <EmptyState onPressPlus={onPressPlus} />
        ) : (
          <>
            {/* Days grid */}
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
              <View className="bg-card rounded-t-2xl px-4 pb-4">
                <View className="flex-row items-center justify-between pt-3 pb-2">
                  <Text className="text-text font-bold text-lg">
                    {selectedDay.name} — Exercises
                  </Text>

                  <View className="flex-row gap-2">
                    {!planLocked && !dayLocked && selectedDay.exercises.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => actions.lockDay(selectedDay.id)}
                        className="rounded-xl px-3 py-2 bg-primary"
                      >
                        <Text className="text-onPrimary font-bold">Finish Day</Text>
                      </TouchableOpacity>
                    ) : !planLocked && dayLocked ? (
                      <TouchableOpacity
                        onPress={() => actions.unlockDay(selectedDay.id)}
                        className="rounded-xl px-3 py-2 bg-bg border border-border"
                      >
                        <Text className="text-text font-bold">Edit Day</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      disabled={!canEditSelectedDay}
                      onPress={() =>
                        router.push({
                          pathname: '/categories',
                          params: { targetDayId: String(selectedDayId) },
                        })
                      }
                      className={`rounded-xl px-3 py-2 bg-primary ${canEditSelectedDay ? 'opacity-100' : 'opacity-50'}`}
                    >
                      <Text className="text-onPrimary font-bold">Add Exercise</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {selectedDay.exercises.length === 0 ? (
                  <Text className="text-muted">No exercises for this day — tap “Add Exercise”.</Text>
                ) : (
                  <View className="mt-2">
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
            <Modal
              visible={askDaysVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setAskDaysVisible(false)} // Android back
            >
        <View className="flex-1 items-center justify-center px-6 bg-black/60">
          <View className="w-full rounded-2xl p-5 bg-card">
            <Text className="text-text text-center font-bold mb-4 text-lg">
              How many days do you train per week?
            </Text>

            {/* Quick-pick chips */}
            <View className="flex-row flex-wrap items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                const picked = daysCountDraft === String(n);
                return (
                  <Pressable
                    key={n}
                    onPress={() => setDaysCountDraft(String(n))}
                    className={`px-3 py-2 rounded-xl ${picked ? 'bg-primary' : 'bg-bg border border-border'} ${picked ? '' : 'opacity-80'}`}
                  >
                    <Text className={`${picked ? 'text-onPrimary' : 'text-text'}`}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Manual input (optional) */}
            <TextInput
              value={daysCountDraft}
              onChangeText={setDaysCountDraft}
              placeholder="1-7"
              keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric', default: 'numeric' })}
              className="rounded-xl px-4 py-3 mb-4 bg-bg text-text border border-border"
              placeholderTextColor="#888888"
              maxLength={1}
            />

            {(() => {
              const n = parseInt(daysCountDraft, 10);
              const valid = Number.isInteger(n) && n >= 1 && n <= 7;
              return (
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    disabled={!valid}
                    className={`flex-1 items-center rounded-xl px-4 py-3 ${valid ? 'bg-primary' : 'bg-card opacity-50'}`}
                    onPress={() => {
                      // Only apply when valid
                      actions.upsertDayCount(n);   // important: pass a number, not a string
                      // optional: mark dirty so hydrate won't overwrite local changes
                      actions.markDirty?.();
                      setAskDaysVisible(false);
                    }}
                  >
                    <Text className={`${valid ? 'text-onPrimary' : 'text-text'} font-bold`}>Start</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 items-center rounded-xl px-4 py-3 bg-bg border border-border"
                    onPress={() => setAskDaysVisible(false)}
                  >
                    <Text className="text-text font-bold">Cancel</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Bottom tabs (role-aware) */}
      <BottomTabs role={roleLevel} currentHref="/(screens)/plan" />
    </View>
  );
}

/** Components **/

function EmptyState({ onPressPlus }) {
  return (
    <View className="items-center justify-center px-8 py-24">
      <MaterialCommunityIcons name="calendar-plus" size={52} color="#007BFF" />
      <Text className="text-text text-center mt-3 font-extrabold text-lg">
        No active plan yet
      </Text>
      <Text className="text-muted text-center mt-1">
        Tap the + button to choose training days and start building
      </Text>
      <TouchableOpacity
        onPress={onPressPlus}
        className="mt-5 rounded-2xl px-5 py-3 bg-primary"
      >
        <Text className="text-onPrimary font-bold">Start now</Text>
      </TouchableOpacity>
    </View>
  );
}

function DayCard({ day, isSelected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 rounded-2xl p-4 bg-card"
      activeOpacity={0.9}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-text font-bold text-lg">{day.name}</Text>
        <View className="flex-row items-center gap-2">
          {day.locked && <MaterialCommunityIcons name="lock" size={16} color="#007BFF" />}
          {isSelected && (
            <View className="rounded-full px-2 py-1 bg-primary">
              <Text className="text-onPrimary font-bold text-[12px]">Selected</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2 mt-3">
        <MaterialCommunityIcons name="dumbbell" size={18} color="#007BFF" />
        <Text className="text-muted">
          {day.exercises.length} exercises {day.locked ? '• locked' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ExerciseRow({ exercise, index, sets = 1, editable, onInc, onDec, onRemove }) {
  const MIN_SETS = 1;
  const MAX_SETS = 20;
  const decDisabled = !editable || sets <= MIN_SETS;
  const incDisabled = !editable || sets >= MAX_SETS;

  return (
    <View className="flex-row items-center rounded-xl px-4 py-3 mb-2 bg-card">
      {/* Left: exercise info */}
      <View className="flex-row items-center gap-3 pr-3 flex-1 min-w-0">
        <MaterialCommunityIcons name="dumbbell" size={20} color="#007BFF" />
        <View className="flex-1 min-w-0">
          <Text numberOfLines={1} ellipsizeMode="tail" className="text-text font-semibold">
            {exercise.name}
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail" className="text-muted text-[12px]">
            {exercise.muscle}
          </Text>
        </View>
      </View>

      {/* Middle: Remove */}
      <TouchableOpacity
        disabled={!editable}
        onPress={onRemove}
        className={`rounded-xl px-3 py-2 items-center justify-center bg-bg border border-border ${editable ? 'opacity-100' : 'opacity-50'}`}
        style={{ width: 92 }}
      >
        <Text className="text-text font-bold">Remove</Text>
      </TouchableOpacity>

      {/* Right: sets stepper */}
      <View className="items-center" style={{ width: 44 }}>
        <TouchableOpacity
          disabled={incDisabled}
          onPress={onInc}
          className={`rounded-md px-2 py-1 mb-1 items-center justify-center bg-card ${incDisabled ? 'opacity-40' : 'opacity-100'}`}
          accessibilityLabel="Increase sets"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-up" size={20} color="#007BFF" />
        </TouchableOpacity>

        <Text className="text-text font-extrabold">{sets}</Text>

        <TouchableOpacity
          disabled={decDisabled}
          onPress={onDec}
          className={`rounded-md px-2 py-1 mt-1 items-center justify-center bg-card ${decDisabled ? 'opacity-40' : 'opacity-100'}`}
          accessibilityLabel="Decrease sets"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-down" size={20} color="#007BFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
