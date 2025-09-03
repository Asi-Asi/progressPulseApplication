// app/AdminPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert, Platform,
  Modal, ScrollView, RefreshControl,
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
const CREATE_ENDPOINT = `${API}/users`; 


  const safeJson = async (res) => {
  const ct  = res.headers.get('content-type') || '';
  const len = res.headers.get('content-length');
  if (res.status === 204 || len === '0' || !ct.includes('application/json')) return null;
  try { return await res.json(); } catch { return null; }
};

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
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Update failed", data?.message || "Try again.");
      } else {
        setUsers(prev => prev.map(u => (u._id === editing._id ? { ...u, name, email } : u)));
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
              setUsers(prev => prev.filter(x => String(x._id ?? x.id) !== userId));
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
    setCName(""); setCEmail(""); setCPassword(""); setCreateOpen(true);
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

      const data = await safeJson(res);

      if (res.status === 201 || res.status === 200) {
        setCreateOpen(false);
        await load(); // ריענון מהרשימה
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
    <View className="flex-1 bg-[#1E1E1E]">
      <Stack.Screen
        options={{
          title: "Admin",
          headerStyle: { backgroundColor: "#1E1E1E" },
          headerTintColor: "#FFD100",
          headerTitleStyle: { fontWeight: "bold", fontSize: 26 },
        }}
      />

      {/* רשימת משתמשים - גריד 2 עמודות */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#FFD100" />
        }
        className="flex-1"
      >
        {users.length === 0 ? (
          <Text className="text-[#CFCFCF] text-center mt-8">No users yet.</Text>
        ) : (
          <View className="px-4 pb-24">
            <View className="flex-row flex-wrap -mx-1.5">
              {users.map((item) => (
                <View key={item._id} className="w-1/2 px-1.5 mb-3">
                  <UserCard user={item} onEdit={startEdit} onDelete={deleteUser} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* כפתור צף ליצירה */}
      <TouchableOpacity
        onPress={openCreate}
        activeOpacity={0.85}
        className="absolute right-5 bottom-6 w-14 h-14 rounded-full bg-[#FF5A2C] items-center justify-center"
      >
        <Text className="text-white text-2xl font-extrabold -mt-0.5">＋</Text>
      </TouchableOpacity>

      {/* Edit modal */}
      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-[#2B2B2B] rounded-xl p-4 space-y-3">
            <Text className="text-[#FFD100] font-extrabold text-lg">Edit User</Text>

            <TextInput
              value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#9CA3AF"
              className="bg-[#1F2937] text-white rounded-xl px-3 h-11"
            />
            <TextInput
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
              placeholder="Email" placeholderTextColor="#9CA3AF"
              className="bg-[#1F2937] text-white rounded-xl px-3 h-11"
            />

            <View className="flex-row gap-2 mt-1">
              <TouchableOpacity onPress={() => setEditing(null)} className="flex-1 bg-[#6B7280] p-3 rounded-xl items-center">
                <Text className="text-white font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={loading}
                className={`flex-1 p-3 rounded-xl items-center ${loading ? "opacity-60 bg-[#FF5A2C]" : "bg-[#FF5A2C]"}`}
              >
                <Text className="text-white font-bold">{loading ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create modal */}
      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-[#2B2B2B] rounded-xl p-4 space-y-3">
            <Text className="text-[#FFD100] font-extrabold text-lg">Create User</Text>

            <TextInput
              value={cName} onChangeText={setCName} placeholder="Name" placeholderTextColor="#9CA3AF"
              className="bg-[#1F2937] text-white rounded-xl px-3 h-11"
            />
            <TextInput
              value={cEmail} onChangeText={setCEmail} autoCapitalize="none" keyboardType="email-address"
              placeholder="Email" placeholderTextColor="#9CA3AF"
              className="bg-[#1F2937] text-white rounded-xl px-3 h-11"
            />
            <TextInput
              value={cPassword} onChangeText={setCPassword} secureTextEntry
              placeholder="Password" placeholderTextColor="#9CA3AF"
              className="bg-[#1F2937] text-white rounded-xl px-3 h-11"
            />

            <View className="flex-row gap-2 mt-1">
              <TouchableOpacity onPress={() => setCreateOpen(false)} className="flex-1 bg-[#6B7280] p-3 rounded-xl items-center">
                <Text className="text-white font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveCreate}
                disabled={creating}
                className={`flex-1 p-3 rounded-xl items-center ${creating ? "opacity-60 bg-[#FF5A2C]" : "bg-[#FF5A2C]"}`}
              >
                <Text className="text-white font-bold">{creating ? "Creating..." : "Create"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
