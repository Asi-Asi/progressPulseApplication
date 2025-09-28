// app/(screens)/admin/index.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View, Text, ScrollView, TextInput, RefreshControl, TouchableOpacity, Alert, Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import AppLogo from "../../../assets/components/ui/AppLogo";
import { listUsers, adminDeleteUser } from "../../../assets/api/admin.api";
import UserEditorModal from "../../../assets/components/screens/admin/UserEditorModal";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";

const ROLES = { ADMIN: 10, TRAINEE: 20, COACH: 30 };
const roleLabel = (n) => (n === ROLES.ADMIN ? "admin" : n === ROLES.COACH ? "coach" : "trainee");

/* Small badge for role */
function RoleBadge({ roleLevel }) {
  const label = roleLabel(roleLevel);
  const cls =
    label === "admin"
      ? "bg-secondary"   // orange for admin
      : label === "coach"
      ? "bg-primary"     // blue for coach
      : "bg-success";    // green for trainee

  return (
    <View className={`px-2 py-1 rounded-lg ${cls}`}>
      <Text className="text-onPrimary text-xs font-bold">{label}</Text>
    </View>
  );
}

/* Single row in the list */
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
  const [all, setAll] = useState([]);              // full list
  const [query, setQuery] = useState("");          // search
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);    // selected user object
  const [error, setError] = useState("");

  /* Derived filtered list */
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

  /* Fetch users (admin) */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const users = await listUsers();                  // should be an array
      const arr = Array.isArray(users) ? users : [];    // guard against null/shape issues

      // Normalize id for rendering/keys
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

  /* Pull-to-refresh */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  /* Cross-platform confirm dialog */
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

  /* Delete handler */
  const handleDelete = useCallback(async (user) => {
    const ok = await confirmDelete(
      "Delete user?",
      `This will permanently remove ${user?.email || "this user"}.`
    );
    if (!ok) return;

    try {
      await adminDeleteUser(String(user.id));
      // Optimistic update
      setAll((prev) => prev.filter((u) => String(u.id) !== String(user.id)));
    } catch (e) {
      Alert.alert("Delete failed", e?.message || "Unexpected error");
    }
  }, []);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" }, // bg color from your palette
        }}
      />

      {/* Search */}
      <View className="p-4">
        <Text className="text-2xl font-extrabold mb-2 text-text">Admin • Users</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, email, or role"
          placeholderTextColor="#667085" // fieldMuted
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
          filtered.map((u) => (
            <UserRow
              key={u.id}
              item={u}
              onEdit={setEditing}
              onDelete={handleDelete}   // ✅ pass the delete handler
            />
          ))
        )}
      </ScrollView>

      {/* Editor modal */}
      <UserEditorModal
        visible={!!editing}
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={load} // refresh after save
      />

      {/* Keep tabs consistent across app; pass admin role to highlight correct tab if needed */}
      <BottomTabs role={ROLES.ADMIN} currentHref="/(screens)/admin" />
    </View>
  );
}
