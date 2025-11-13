import React from 'react';
import { ScrollView, View, Text } from 'react-native';

const data = [
  { id:'c1', name:'Alice Johnson', email:'alice@example.com', phone:'+1-555-1111', policies:['POL-10001']},
  { id:'c2', name:'Bob Smith', email:'bob@example.com', phone:'+1-555-2222', policies:['POL-10002']}
];

export default function Customers() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor: '#121a2e', borderRadius: 12, padding: 16 }}>
        <Text style={{ color:'#e6e8ef', fontWeight:'700', marginBottom: 8 }}>Customers</Text>
        {data.map(c => (
          <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1b2440' }}>
            <Text style={{ color:'#e6e8ef' }}>{c.name}</Text>
            <Text style={{ color:'#9aa3b2' }}>{c.email} • {c.phone}</Text>
            <Text style={{ color:'#9aa3b2' }}>{c.policies.join(', ')}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}


