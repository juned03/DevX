import React, { useState } from 'react';
import { ScrollView, View, TextInput, Button, Text } from 'react-native';

export default function Underwriting() {
  const [age, setAge] = useState('35');
  const [product, setProduct] = useState('auto');
  const [priorClaims, setPriorClaims] = useState('0');
  const [result, setResult] = useState<any>(null);

  function evaluate() {
    let risk = (Number(age) || 0) / 10 + (Number(priorClaims) || 0) * 5;
    if (product === 'life') risk += 10; if (product === 'home') risk += 5;
    const decision = risk < 10 ? 'approve' : risk < 20 ? 'review' : 'decline';
    setResult({ riskScore: Math.round(risk), decision });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor:'#121a2e', borderRadius: 12, padding: 16 }}>
        <Text style={{ color:'#e6e8ef', fontWeight:'700', marginBottom:8 }}>Risk Evaluation</Text>
        <TextInput placeholder="Age" placeholderTextColor="#9aa3b2" keyboardType="numeric" value={age} onChangeText={setAge} style={{ backgroundColor:'#0f162b', color:'#e6e8ef', padding:10, borderRadius:8, marginBottom:8 }} />
        <TextInput placeholder="Product (auto/home/life)" placeholderTextColor="#9aa3b2" value={product} onChangeText={setProduct} style={{ backgroundColor:'#0f162b', color:'#e6e8ef', padding:10, borderRadius:8, marginBottom:8 }} />
        <TextInput placeholder="Prior Claims" placeholderTextColor="#9aa3b2" keyboardType="numeric" value={priorClaims} onChangeText={setPriorClaims} style={{ backgroundColor:'#0f162b', color:'#e6e8ef', padding:10, borderRadius:8, marginBottom:8 }} />
        <Button title="Evaluate" onPress={evaluate} />
        {result && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color:'#e6e8ef' }}>Risk Score: {result.riskScore}</Text>
            <Text style={{ color:'#e6e8ef' }}>Decision: {result.decision}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}


