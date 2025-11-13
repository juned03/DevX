import React, { useState } from 'react';
import { ScrollView, View, TextInput, Button, Text } from 'react-native';

export default function Claims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [policyNumber, setPolicyNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor: '#121a2e', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <Text style={{ color: '#e6e8ef', fontWeight: '700', marginBottom: 8 }}>Submit a Claim</Text>
        <TextInput placeholder="Policy Number" placeholderTextColor="#9aa3b2" value={policyNumber} onChangeText={setPolicyNumber} style={{ backgroundColor: '#0f162b', color:'#e6e8ef', padding: 10, borderRadius: 8, marginBottom: 8 }} />
        <TextInput placeholder="Description" placeholderTextColor="#9aa3b2" value={description} onChangeText={setDescription} multiline style={{ backgroundColor: '#0f162b', color:'#e6e8ef', padding: 10, borderRadius: 8, marginBottom: 8, height: 80 }} />
        <TextInput placeholder="Amount" placeholderTextColor="#9aa3b2" value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ backgroundColor: '#0f162b', color:'#e6e8ef', padding: 10, borderRadius: 8, marginBottom: 8 }} />
        <Button title="Submit Claim" onPress={() => {
          setClaims((cs)=>[{ id: 'cl-'+Math.floor(Math.random()*100000), policyNumber, amount: Number(amount), status: 'pending', description }, ...cs]);
          setPolicyNumber(''); setDescription(''); setAmount('');
        }} />
      </View>
      <View style={{ backgroundColor: '#121a2e', padding: 16, borderRadius: 12 }}>
        <Text style={{ color: '#e6e8ef', fontWeight: '700', marginBottom: 8 }}>Recent Claims</Text>
        {claims.map((c)=> (
          <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1b2440' }}>
            <Text style={{ color: '#e6e8ef' }}>{c.policyNumber} • ${c.amount}</Text>
            <Text style={{ color: '#9aa3b2' }}>{c.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}


