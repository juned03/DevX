import React from 'react';
import { ScrollView, View, Text } from 'react-native';

export default function Reports() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor:'#121a2e', borderRadius:12, padding:16, marginBottom:16 }}>
        <Text style={{ color:'#e6e8ef', fontWeight:'700', marginBottom:8 }}>Analytics</Text>
        <Text style={{ color:'#9aa3b2' }}>Integrate charts library (e.g., Victory Native) here.</Text>
      </View>
      <View style={{ backgroundColor:'#121a2e', borderRadius:12, padding:16 }}>
        <Text style={{ color:'#e6e8ef', fontWeight:'700', marginBottom:8 }}>Compliance Notes</Text>
        <Text style={{ color:'#9aa3b2' }}>Placeholder for regulatory reports and exports.</Text>
      </View>
    </ScrollView>
  );
}


