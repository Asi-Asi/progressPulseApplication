// app/(screens)/admin/index.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppLogo from "../../../assets/components/ui/AppLogo";
import { listUsers, adminDeleteUser } from "../../../assets/api/admin.api";
import UserEditorModal from "../../../assets/components/screens/admin/UserEditorModal";
import CreateUserModal from "../../../assets/components/screens/admin/CreateUserModal";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";

const ROLES = { ADMIN: 10, TRAINEE: 20, COACH: 30 };
const roleLabel = (n) => (n === ROLES.ADMIN ? "admin" : n === ROLES.COACH ? "coach" : "trainee");

function RoleBadge({ roleLevel }) {
  const label = roleLabel(roleLevel);
  const cls =
    label === "admin"
      ? "bg-secondary"
      : label === "coach"
      ? "bg-primary"
      : "bg-success";
  return (
    <View className={`px-2 py-1 rounded-lg ${cls}`}>
      <Text className="text-onPrimary text-xs font-bold">{label}</Text>
    </View>
  );
}

const StatBadge = ({ label, value }) => (
  <View className="w-20 h-16 rounded-xl bg-card border border-border mb-3 items-center justify-center mx-1">
    <Text className="text-base font-extrabold text-text">{value}</Text>
    <Text className="text-[11px] text-muted mt-0.5">{label}</Text>
  </View>
);

function UserRow({ item, onEdit, onDelete }) {
  return (
    <View className="flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-card border border-border">
      <View className="flex-1 mr-3">
        <Text className="text-base font-bold text-text">
          {(item.firstName || "") + " " + (item.lastName || "")}
        </Text>
        <Text className="text-xs text-muted">{item.email}</Text>
        <Text className="text-xs text-muted mt-1">
          Gender: {item.gender || "-"} • Created: {item.createdAt || "-"}
        </Text>
      </View>

      <View className="items-end gap-2">
        <RoleBadge roleLevel={item.roleLevel} />
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => onEdit(item)}
            className="px-3 py-2 rounded-xl bg-primary"
          >
            <Text className="text-onPrimary font-semibold">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item)}
            className="px-3 py-2 rounded-xl bg-error"
          >
            <Text className="text-onPrimary font-semibold">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [all, setAll] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((u) => {
      const full = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      return (
        full.includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        roleLabel(u.roleLevel).includes(q)
      );
    });
  }, [all, query]);

  const roleStats = useMemo(() => {
    const stats = { Total: 0, Admins: 0, Coaches: 0, Trainees: 0 };
    for (const u of all) {
      stats.Total += 1;
      const label = roleLabel(u.roleLevel);
      if (label === "admin") stats.Admins += 1;
      else if (label === "coach") stats.Coaches += 1;
      else stats.Trainees += 1;
    }
    return stats;
  }, [all]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const users = await listUsers();
      const arr = Array.isArray(users) ? users : [];
      const normalized = arr.map((u) => ({
        id: String(u._id || u.id || ""),
        ...u,
      }));
      setAll(normalized);
    } catch (e) {
      setError(e?.message || "Failed to load users");
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  function confirmDelete(title, message) {
    return new Promise((resolve) => {
      if (Platform.OS === "web") {
        const ok = window.confirm(`${title}\n\n${message}`);
        return resolve(ok);
      }
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Delete", style: "destructive", onPress: () => resolve(true) },
      ]);
    });
  }

  const handleDelete = useCallback(async (user) => {
    const ok = await confirmDelete(
      "Delete user?",
      `This will permanently remove ${user?.email || "this user"}.`
    );
    if (!ok) return;

    try {
      await adminDeleteUser(String(user.id));
      setAll((prev) => prev.filter((u) => String(u.id) !== String(user.id)));
    } catch (e) {
      Alert.alert("Delete failed", e?.message || "Unexpected error");
    }
  }, []);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />

      <View className="flex-1">
        {/* Search */}
        <View className="p-4">
          <Text className="text-2xl font-extrabold mb-2 text-text">Admin • Users</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, email, or role"
            placeholderTextColor="#667085"
            className="w-full px-4 py-3 rounded-xl bg-field border border-fieldBorder text-text"
          />
          {!!error && <Text className="text-error mt-2">{error}</Text>}
        </View>

        {/* List */}
        <ScrollView
          className="px-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {loading ? (
            <Text className="text-center text-muted">Loading…</Text>
          ) : filtered.length === 0 ? (
            <Text className="text-center text-muted">No users found</Text>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setCreateOpen(true)}
                    className="w-11 h-11 rounded-2xl bg-primary items-center justify-center"
                    accessibilityLabel="Add user"
                  >
                    <MaterialCommunityIcons name="plus" size={22} color="#FDFBFA" />
                  </TouchableOpacity>
                  <StatBadge label="Total" value={roleStats.Total} />
                  <StatBadge label="Admins" value={roleStats.Admins} />
                  <StatBadge label="Coaches" value={roleStats.Coaches} />
                  <StatBadge label="Trainees" value={roleStats.Trainees} />
                </View>
              </ScrollView>

              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  item={u}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>

      {/* Modals */}
      <UserEditorModal
        visible={!!editing}
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={load}
      />

      <CreateUserModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
      />

      <BottomTabs role={ROLES.ADMIN} currentHref="/(screens)/admin" />
    </KeyboardAvoidingView>
  );
}
