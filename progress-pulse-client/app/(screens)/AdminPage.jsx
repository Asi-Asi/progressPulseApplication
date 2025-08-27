// app/AdminPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, RefreshControl, Modal,
  TextInput, TouchableOpacity, Alert, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import UserCard from "./UserCard";

const API_HOST =
  process.env.EXPO_PUBLIC_API_BASE ||
  (Platform.OS === "android" ? "http://10.0.2.2:5500"
   : Platform.OS === "ios"   ? "http://127.0.0.1:5500"
                             : "http://localhost:5500");

const API = `${API_HOST}/api`;
const CREATE_ENDPOINT = `${API}/users`; // ← change to `${API}/users/register` if that's your route

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
      const data = await res.json();

      // Normalize: always keep _id as a string
      const list = (Array.isArray(data) ? data : data?.users || []).map(u => ({
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

  useEffect(() => { load(); }, [load]);

  const startEdit = (u) => {
    setEditing(u);
    setName(u.name || "");
    setEmail(u.email || "");
  };

  const saveEdit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email."); return;
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
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Update failed", data?.message || "Try again.");
      } else {
        setUsers((prev) =>
          prev.map((u) => (u._id === editing._id ? { ...u, name, email } : u))
        );
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
            const url = `${API}/users/${encodeURIComponent(userId)}`;
            const res = await fetch(url, {
              method: "DELETE",
              headers: { Authorization: token ? `Bearer ${token}` : "" },
            });

            // success: 200 or 204
            if (res.ok) {
              setUsers(prev => prev.filter(x => String(x._id ?? x.id) !== userId));
              return;
            }

            // not ok: try to read message
            const data = await res.json().catch(() => ({}));
            Alert.alert("Delete failed", data?.message || `Status ${res.status}`);
            console.warn("Delete failed", res.status, data);
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Unable to delete user.");
          }
        },
      },
    ]);
  };

  // -------- CREATE --------
  const openCreate = () => {
    setCName("");
    setCEmail("");
    setCPassword("");
    setCreateOpen(true);
  };

  const saveCreate = async () => {
    if (!cName.trim()) { Alert.alert("Missing name", "Please enter a name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail)) { Alert.alert("Invalid email", "Please enter a valid email."); return; }
    if ((cPassword || "").length < 6) { Alert.alert("Weak password", "Password must be at least 6 characters."); return; }

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

      const data = await res.json().catch(() => ({}));

      if (res.status === 201 || res.status === 200) {
        setCreateOpen(false);
        // keep your state logic simple—re-sync from DB
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
    <View style={{ flex: 1, backgroundColor: "#1E1E1E" }}>
      <Stack.Screen
        options={{
          title: "Admin",
          headerStyle: { backgroundColor: "#1E1E1E" },
          headerTintColor: "#FFD100",
          headerTitleStyle: { fontWeight: "bold", fontSize: 26 },
        }}
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#FFD100" />
        }
        renderItem={({ item }) => (
          <UserCard user={item} onEdit={startEdit} onDelete={deleteUser} />
        )}
        ListEmptyComponent={
          <Text style={{ color: "#CFCFCF", textAlign: "center", marginTop: 32 }}>
            No users yet.
          </Text>
        }
      />

      {/* Floating + button */}
      <TouchableOpacity
        onPress={openCreate}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          right: 20,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#FF5A2C",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 5,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800", marginTop: -2 }}>＋</Text>
      </TouchableOpacity>

      {/* Edit modal */}
      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#2B2B2B", borderRadius: 12, padding: 16, gap: 12 }}>
            <Text style={{ color: "#FFD100", fontWeight: "800", fontSize: 18 }}>Edit User</Text>
            <TextInput
              value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#9CA3AF"
              style={{ backgroundColor: "#1F2937", color: "#fff", borderRadius: 10, paddingHorizontal: 12, height: 44 }}
            />
            <TextInput
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
              placeholder="Email" placeholderTextColor="#9CA3AF"
              style={{ backgroundColor: "#1F2937", color: "#fff", borderRadius: 10, paddingHorizontal: 12, height: 44 }}
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setEditing(null)}
                style={{ flex: 1, backgroundColor: "#6B7280", padding: 12, borderRadius: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={loading}
                style={{ flex: 1, backgroundColor: "#FF5A2C", padding: 12, borderRadius: 10, alignItems: "center", opacity: loading ? 0.6 : 1 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{loading ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create modal */}
      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#2B2B2B", borderRadius: 12, padding: 16, gap: 12 }}>
            <Text style={{ color: "#FFD100", fontWeight: "800", fontSize: 18 }}>Create User</Text>
            <TextInput
              value={cName} onChangeText={setCName} placeholder="Name" placeholderTextColor="#9CA3AF"
              style={{ backgroundColor: "#1F2937", color: "#fff", borderRadius: 10, paddingHorizontal: 12, height: 44 }}
            />
            <TextInput
              value={cEmail} onChangeText={setCEmail} autoCapitalize="none" keyboardType="email-address"
              placeholder="Email" placeholderTextColor="#9CA3AF"
              style={{ backgroundColor: "#1F2937", color: "#fff", borderRadius: 10, paddingHorizontal: 12, height: 44 }}
            />
            <TextInput
              value={cPassword} onChangeText={setCPassword} secureTextEntry
              placeholder="Password" placeholderTextColor="#9CA3AF"
              style={{ backgroundColor: "#1F2937", color: "#fff", borderRadius: 10, paddingHorizontal: 12, height: 44 }}
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setCreateOpen(false)}
                style={{ flex: 1, backgroundColor: "#6B7280", padding: 12, borderRadius: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveCreate}
                disabled={creating}
                style={{ flex: 1, backgroundColor: "#FF5A2C", padding: 12, borderRadius: 10, alignItems: "center", opacity: creating ? 0.6 : 1 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{creating ? "Creating..." : "Create"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
