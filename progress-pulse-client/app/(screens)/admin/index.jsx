// app/AdminPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppLogo from "../../../assets/components/ui/AppLogo";

const API_HOST =
  process.env.EXPO_PUBLIC_API_BASE ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:5500"
    : Platform.OS === "ios"
    ? "http://127.0.0.1:5500"
    : "http://localhost:5500");

const API = `${API_HOST}/api`;
const CREATE_ENDPOINT = `${API}/users`;

const safeJson = async (res) => {
  const ct = res.headers.get("content-type") || "";
  const len = res.headers.get("content-length");
  if (res.status === 204 || len === "0" || !ct.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
};

// --- Small helpers ---
const formatDateEN = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
};

// --- A compact user card used in the grid ---
function AdminUserCard({ user, onEdit, onDelete }) {
  const initials = String(user.name || user.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="bg-card rounded-xl border border-border p-4">
      <View className="flex-row items-start gap-3">
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} className="w-12 h-12 rounded-full" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-field border border-fieldBorder items-center justify-center">
            <Text className="text-primary font-extrabold">{initials}</Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-text font-bold" numberOfLines={1}>
            {user.name || "—"}
          </Text>
          <Text className="text-muted" numberOfLines={1}>
            {user.email || "—"}
          </Text>

          <View className="flex-row gap-3 mt-2">
            {user.createdAt && (
              <Text className="text-muted text-xs">
                Since <Text className="text-text font-bold">{formatDateEN(user.createdAt)}</Text>
              </Text>
            )}
            {user.role != null && (
              <Text className="text-muted text-xs">Role <Text className="text-text font-bold">{user.role}</Text></Text>
            )}
          </View>
        </View>
      </View>

      <View className="flex-row gap-2 mt-3">
        <TouchableOpacity
          onPress={() => onEdit?.(user)}
          className="flex-1 h-10 rounded-lg bg-field border border-fieldBorder items-center justify-center"
        >
          <Text className="text-text font-bold">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete?.(user)}
          className="w-10 h-10 rounded-lg bg-secondary items-center justify-center"
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // EDIT state
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // CREATE state
  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API}/users`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await safeJson(res);

      const list = (Array.isArray(data) ? data : data?.users || []).map((u) => ({
        ...u,
        _id: String(u._id ?? u.id ?? ""),
      }));

      if (res.ok) setUsers(list);
      else Alert.alert("Error", data?.message || "Failed to fetch users");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to reach server.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (u) => {
    setEditing(u);
    setName(u.name || "");
    setEmail(u.email || "");
  };

  const saveEdit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API}/users/${editing._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ name, email }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        Alert.alert("Update failed", data?.message || "Try again.");
      } else {
        setUsers((prev) => prev.map((u) => (u._id === editing._id ? { ...u, name, email } : u)));
        setEditing(null);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to update user.");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (u) => {
    const userId = String(u?._id ?? u?.id ?? "");
    if (!userId) {
      Alert.alert("Cannot delete", "User id is missing.");
      console.warn("Delete clicked with missing id:", u);
      return;
    }

    Alert.alert("Delete user", `Delete ${u.email || u.name || userId}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${API}/users/${encodeURIComponent(userId)}`, {
              method: "DELETE",
              headers: { Authorization: token ? `Bearer ${token}` : "" },
            });
            if (res.ok) {
              setUsers((prev) => prev.filter((x) => String(x._id ?? x.id) !== userId));
              return;
            }
            const data = await safeJson(res);
            Alert.alert("Delete failed", data?.message || `Status ${res.status}`);
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Unable to delete user.");
          }
        },
      },
    ]);
  };

  // CREATE
  const openCreate = () => {
    setCName("");
    setCEmail("");
    setCPassword("");
    setCreateOpen(true);
  };

  const saveCreate = async () => {
    if (!cName.trim()) {
      Alert.alert("Missing name", "Please enter a name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email.");
      return;
    }
    if ((cPassword || "").length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setCreating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(CREATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          name: cName.trim(),
          email: cEmail.trim().toLowerCase(),
          password: cPassword,
        }),
      });

      const data = await safeJson(res);

      if (res.status === 201 || res.status === 200) {
        setCreateOpen(false);
        await load();
      } else if (res.status === 409) {
        Alert.alert("Email already exists", "Try a different email.");
      } else {
        Alert.alert("Create failed", data?.message || `Status ${res.status}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to create user.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" }, // bg
        }}
      />

      {/* Page title */}
      <View className="px-4 pt-5">
        <Text className="text-text text-2xl font-extrabold">Admin</Text>
        <Text className="text-muted mt-1">Manage users in your workspace.</Text>
      </View>

      {/* Grid of users */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#007BFF" />
        }
      >
        {users.length === 0 ? (
          <Text className="text-muted text-center mt-10">No users yet.</Text>
        ) : (
          <View className="py-4">
            <View className="flex-row flex-wrap -mx-1.5">
              {users.map((item) => (
                <View key={item._id} className="w-1/2 px-1.5 mb-3">
                  <AdminUserCard user={item} onEdit={startEdit} onDelete={deleteUser} />
                </View>
              ))}
            </View>
          </View>
        )}
        <View className="h-16" />
      </ScrollView>

      {/* Floating create button */}
      <TouchableOpacity
        onPress={openCreate}
        activeOpacity={0.9}
        className="absolute right-5 bottom-6 w-14 h-14 rounded-full bg-secondary items-center justify-center shadow"
      >
        <Text className="text-white text-2xl font-extrabold -mt-0.5">＋</Text>
      </TouchableOpacity>

      {/* Edit modal */}
      <Modal
        visible={!!editing}
        animationType="fade"
        transparent
        onRequestClose={() => setEditing(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-5">
          <View className="w-full max-w-[560px] bg-card rounded-2xl border border-border p-4">
            <Text className="text-primary font-extrabold text-lg mb-3">Edit User</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor="#667085"
              className="bg-field border border-fieldBorder text-text rounded-xl px-3 h-11 mb-2"
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor="#667085"
              className="bg-field border border-fieldBorder text-text rounded-xl px-3 h-11"
            />

            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity
                onPress={() => setEditing(null)}
                className="flex-1 h-11 rounded-lg bg-field border border-fieldBorder items-center justify-center"
              >
                <Text className="text-text font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={loading}
                className={`flex-1 h-11 rounded-lg items-center justify-center ${
                  loading ? "opacity-60 bg-primary" : "bg-primary"
                }`}
              >
                <Text className="text-onPrimary font-extrabold">
                  {loading ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create modal */}
      <Modal
        visible={createOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setCreateOpen(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-5">
          <View className="w-full max-w-[560px] bg-card rounded-2xl border border-border p-4">
            <Text className="text-primary font-extrabold text-lg mb-3">Create User</Text>

            <TextInput
              value={cName}
              onChangeText={setCName}
              placeholder="Name"
              placeholderTextColor="#667085"
              className="bg-field border border-fieldBorder text-text rounded-xl px-3 h-11 mb-2"
            />
            <TextInput
              value={cEmail}
              onChangeText={setCEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor="#667085"
              className="bg-field border border-fieldBorder text-text rounded-xl px-3 h-11 mb-2"
            />
            <TextInput
              value={cPassword}
              onChangeText={setCPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor="#667085"
              className="bg-field border border-fieldBorder text-text rounded-xl px-3 h-11"
            />

            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity
                onPress={() => setCreateOpen(false)}
                className="flex-1 h-11 rounded-lg bg-field border border-fieldBorder items-center justify-center"
              >
                <Text className="text-text font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveCreate}
                disabled={creating}
                className={`flex-1 h-11 rounded-lg items-center justify-center ${
                  creating ? "opacity-60 bg-primary" : "bg-primary"
                }`}
              >
                <Text className="text-onPrimary font-extrabold">
                  {creating ? "Creating…" : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
