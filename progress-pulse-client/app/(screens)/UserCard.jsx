import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";

function UserCardBase({ user = {}, onEdit, onDelete }) {
  const name = (user.name || "Unnamed").trim();
  const email = user.email || "—";
  const role = user.role || "user";

  return (
    <View style={{
      backgroundColor:"#2B2B2B", borderRadius:12, padding:14, gap:8, flex:1, minHeight:140,
      shadowColor:"#000", shadowOpacity:0.2, shadowRadius:6, shadowOffset:{width:0,height:3}, elevation:3
    }}>
      <Text style={{ color:"#FFD100", fontWeight:"800", fontSize:16 }} numberOfLines={1}>{name}</Text>
      <Text style={{ color:"#D1D5DB" }} numberOfLines={1}>{email}</Text>
      {!!role && <Text style={{ color:"#9CA3AF" }} numberOfLines={1}>Role: {role}</Text>}
      <View style={{ flexDirection:"row", gap:8, marginTop:"auto" }}>
        <TouchableOpacity onPress={() => onEdit?.(user)} style={{ flex:1, backgroundColor:"#3B82F6", paddingVertical:10, borderRadius:8, alignItems:"center" }}>
          <Text style={{ color:"#fff", fontWeight:"700" }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete?.(user)} style={{ flex:1, backgroundColor:"#EF4444", paddingVertical:10, borderRadius:8, alignItems:"center" }}>
          <Text style={{ color:"#fff", fontWeight:"700" }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default memo(UserCardBase);
