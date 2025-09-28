// assets/components/screens/admin/UserEditorModal.jsx
import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Platform } from "react-native";
import { adminUpdateUser } from "../../../api/admin.api";

// Simple Role helper
const ROLES = { ADMIN: 10, TRAINEE: 20, COACH: 30 };
const roleLabel = (n) => (n === ROLES.ADMIN ? "admin" : n === ROLES.COACH ? "coach" : "trainee");

export default function UserEditorModal({ visible, onClose, user, onSaved }) {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [gender, setGender] = useState((user?.gender || "").toLowerCase());
  const [roleLevel, setRoleLevel] = useState(user?.roleLevel ?? ROLES.TRAINEE);
  const [password, setPassword] = useState(""); // optional reset
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset state when opening for a new user
  useEffect(() => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setEmail(user?.email || "");
    setGender((user?.gender || "").toLowerCase());
    setRoleLevel(user?.roleLevel ?? ROLES.TRAINEE);
    setPassword("");
    setError("");
  }, [user, visible]);

  async function handleSave() {
    setError("");
    // Basic validations (mirror server)
    if (!email) return setError("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase())) {
      return setError("Invalid email format");
    }

    const patch = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      gender: gender || undefined, // "male"/"female" or omitted
      email: String(email).trim().toLowerCase(),
      roleLevel,
    };
    if (password?.length) patch.password = password; // server will hash if raw

    setSaving(true);
    try {
      await adminUpdateUser(String(user.id || user._id), patch);
      onSaved?.(); // let parent refresh list
      onClose?.();
    } catch (e) {
      setError(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-bg p-4 rounded-t-2xl border border-border">
          <Text className="text-xl font-bold mb-3 text-text">Edit User</Text>

          {/* First name */}
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor="#667085" // fieldMuted
            className="w-full px-4 py-3 rounded-xl mb-3 bg-field border border-fieldBorder text-text"
          />

          {/* Last name */}
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor="#667085"
            className="w-full px-4 py-3 rounded-xl mb-3 bg-field border border-fieldBorder text-text"
          />

          {/* Email */}
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#667085"
            className="w-full px-4 py-3 rounded-xl mb-3 bg-field border border-fieldBorder text-text"
          />

          {/* Gender selector */}
          <View className="flex-row gap-3 mb-3">
            {["male", "female"].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                className={`px-4 py-2 rounded-xl border ${
                  gender === g ? "bg-secondary border-border" : "bg-card border-border"
                }`}
              >
                <Text className={`${gender === g ? "text-onPrimary" : "text-text"}`}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Role selector */}
          <View className="flex-row gap-3 mb-3">
            {[
              { k: "Admin", v: ROLES.ADMIN },
              { k: "Coach", v: ROLES.COACH },
              { k: "Trainee", v: ROLES.TRAINEE },
            ].map((r) => (
              <TouchableOpacity
                key={r.k}
                onPress={() => setRoleLevel(r.v)}
                className={`px-4 py-2 rounded-xl border ${
                  roleLevel === r.v ? "bg-primary border-border" : "bg-card border-border"
                }`}
              >
                <Text className={`${roleLevel === r.v ? "text-onPrimary" : "text-text"}`}>
                  {r.k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Optional password reset */}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New Password (optional)"
            placeholderTextColor="#667085"
            secureTextEntry
            className="w-full px-4 py-3 rounded-xl mb-1 bg-field border border-fieldBorder text-text"
          />
          <Text className="text-xs text-muted mb-3">
            Leave empty to keep current password (server hashes if provided).
          </Text>

          {!!error && <Text className="text-error mb-2">{error}</Text>}

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose} disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-card border border-border">
              <Text className="text-center text-text font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-primary">
              <Text className="text-center text-onPrimary font-bold">
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}