// assets/components/screens/admin/CreateUserModal.jsx
import React, { useState } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  Platform, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // ✅ NEW
import { adminCreateUser } from "../../../../assets/api/admin.api";

const ROLES = { ADMIN: 10, TRAINEE: 20, COACH: 30 };

export default function CreateUserModal({ visible, onClose, onCreated }) {
  const insets = useSafeAreaInsets(); // ✅ NEW
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [gender, setGender]         = useState("");
  const [roleLevel, setRoleLevel]   = useState(ROLES.TRAINEE);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  function resetForm() {
    setFirstName(""); setLastName(""); setEmail(""); setPassword("");
    setGender(""); setRoleLevel(ROLES.TRAINEE); setError("");
  }

  async function handleSave() {
    setError("");
    if (!email?.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    try {
      setSaving(true);
      await adminCreateUser({
        firstName, lastName, email: email.trim().toLowerCase(), password, gender, roleLevel
      });
      resetForm();
      onCreated?.();
    } catch (e) {
      setError(e?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const RolePill = ({ label, value, activeColor }) => {
    const active = roleLevel === value;
    return (
      <TouchableOpacity
        onPress={() => setRoleLevel(value)}
        className={`px-3 py-2 rounded-xl border mr-2 ${active ? `${activeColor} border-border` : "bg-card border-border"}`}
      >
        <Text className={active ? "text-onPrimary font-semibold" : "text-text"}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const GenderPill = ({ label, value }) => {
    const active = gender === value;
    return (
      <TouchableOpacity
        onPress={() => setGender(value)}
        className={`px-3 py-2 rounded-xl border mr-2 ${active ? "bg-secondary border-border" : "bg-card border-border"}`}
      >
        <Text className={active ? "text-onPrimary font-semibold" : "text-text"}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 justify-end bg-black/40">
          {/* ✅ KeyboardAvoidingView INSIDE the modal */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={(Platform.OS === "ios" ? 60 : 0) + insets.top}
          >
            <View className="bg-bg rounded-t-3xl p-4 border-t border-border">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xl font-extrabold text-text">Add User</Text>
                <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center rounded-xl bg-card border border-border">
                  <MaterialCommunityIcons name="close" size={20} color="#111" />
                </TouchableOpacity>
              </View>

              {/* ✅ Scrolls when keyboard is open */}
              <ScrollView
                className="max-h-[70vh]"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Names */}
                <View className="flex-row gap-2">
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor="#667085"
                    className="flex-1 px-4 py-3 mb-3 rounded-xl bg-field border border-fieldBorder text-text"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    placeholderTextColor="#667085"
                    className="flex-1 px-4 py-3 mb-3 rounded-xl bg-field border border-fieldBorder text-text"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                {/* Email + Password */}
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#667085"
                  className="w-full px-4 py-3 mb-3 rounded-xl bg-field border border-fieldBorder text-text"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#667085"
                  className="w-full px-4 py-3 mb-3 rounded-xl bg-field border border-fieldBorder text-text"
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                />

                {/* Gender */}
                <Text className="text-sm text-muted mb-2">Gender</Text>
                <View className="flex-row mb-3">
                  <GenderPill label="Male" value="Male" />
                  <GenderPill label="Female" value="Female" />
                </View>

                {/* Role */}
                <Text className="text-sm text-muted mb-2">Role</Text>
                <View className="flex-row mb-3">
                  <RolePill label="Admin"   value={ROLES.ADMIN}   activeColor="bg-secondary" />
                  <RolePill label="Coach"   value={ROLES.COACH}   activeColor="bg-primary" />
                  <RolePill label="Trainee" value={ROLES.TRAINEE} activeColor="bg-success" />
                </View>

                {!!error && <Text className="text-error mb-2">{error}</Text>}

                {/* Actions */}
                <View className="flex-row justify-end">
                  <TouchableOpacity onPress={onClose} className="px-4 py-3 rounded-xl bg-card border border-border mr-2">
                    <Text className="text-text font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} disabled={saving} className="px-4 py-3 rounded-xl bg-primary">
                    {saving ? <ActivityIndicator /> : <Text className="text-onPrimary font-bold">Create</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
