// assets/components/screens/admin/CreateExerciseModal.jsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Platform } from "react-native";
import { createExerciseAPI } from "../../../api/exercises.api";

// Keep these aligned with your server (labels!)
const MUSCLE_LABELS = ['Abs','Back','Biceps','Chest','Forearms','Legs','Shoulders','Triceps'];
const TYPES = ['Compound', 'Isolation'];
const EQUIPMENT = ['Barbell','Dumbbells','Machine','Cable','Bodyweight','Parallel Bars'];

export default function CreateExerciseModal({ visible, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("Back");   // sensible default
  const [type, setType] = useState("Compound");
  const [equipment, setEquipment] = useState("Dumbbells");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setName("");
      setMuscle("Back");
      setType("Compound");
      setEquipment("Dumbbells");
      setSaving(false);
      setError("");
    }
  }, [visible]);

  async function handleCreate() {
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      await createExerciseAPI({
        name: name.trim(),
        muscle,     // label (server accepts)
        type,
        equipment,
      });
      onCreated?.(); // refresh list
      onClose?.();
    } catch (e) {
      // 409 conflict from server: "Exercise already exists"
      setError(e?.data?.message || e?.message || "Creation failed");
    } finally {
      setSaving(false);
    }
  }

  const Pill = ({ selected, label, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-2 rounded-xl border ${
        selected ? "bg-secondary border-border" : "bg-card border-border"
      }`}
    >
      <Text className={`${selected ? "text-onPrimary" : "text-text"}`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-bg p-4 rounded-t-2xl border border-border">
          <Text className="text-xl font-bold mb-3 text-text">Create Exercise</Text>

          {/* Name */}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Exercise name (e.g., Lat Pulldown)"
            placeholderTextColor="#667085"
            className="w-full px-4 py-3 rounded-xl mb-3 bg-field border border-fieldBorder text-text"
          />

          {/* Muscle */}
          <Text className="text-sm font-semibold text-text mb-2">Muscle</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {MUSCLE_LABELS.map((m) => (
              <Pill key={m} selected={muscle === m} label={m} onPress={() => setMuscle(m)} />
            ))}
          </View>


          {/* Equipment */}
          <Text className="text-sm font-semibold text-text mb-2">Equipment</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {EQUIPMENT.map((e) => (
              <Pill key={e} selected={equipment === e} label={e} onPress={() => setEquipment(e)} />
            ))}
          </View>


          {/* Type */}
          <Text className="text-sm font-semibold text-text mb-2">Type</Text>
          <View className="flex-row gap-2 mb-3">
            {TYPES.map((t) => (
              <Pill key={t} selected={type === t} label={t} onPress={() => setType(t)} />
            ))}
          </View>

          {!!error && <Text className="text-error mb-2">{error}</Text>}

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose} disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-card border border-border">
              <Text className="text-center text-text font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-primary">
              <Text className="text-center text-onPrimary font-bold">{saving ? "Creating…" : "Create"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
