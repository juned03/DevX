import React from 'react';
import { View, Text, Button, ScrollView } from 'react-native';

export default function Dashboard({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor: '#121a2e', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontWeight: '700', color: '#e6e8ef', marginBottom: 8 }}>Quick Links</Text>
        <View style={{ gap: 8 }}>
          <Button title="Policies" onPress={() => navigation.navigate('Policies')} />
          <Button title="Claims" onPress={() => navigation.navigate('Claims')} />
          <Button title="Customers" onPress={() => navigation.navigate('Customers')} />
          <Button title="Underwriting" onPress={() => navigation.navigate('Underwriting')} />
          <Button title="Reports" onPress={() => navigation.navigate('Reports')} />
        </View>
      </View>
      <View style={{ backgroundColor: '#121a2e', borderRadius: 12, padding: 16 }}>
        <Text style={{ fontWeight: '700', color: '#e6e8ef', marginBottom: 8 }}>Welcome</Text>
        <Text style={{ color: '#9aa3b2' }}>Starter template for an Insurance portal built with React Native.</Text>
      </View>
    </ScrollView>
  );
}


