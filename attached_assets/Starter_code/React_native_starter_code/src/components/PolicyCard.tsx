import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PolicyCard({ policy }: { policy: any }) {
  const color = policy.status === 'active' ? '#22c55e' : policy.status === 'pending' ? '#f59e0b' : '#ef4444';
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.title}>{policy.policyNumber}</Text>
          <Text style={styles.muted}>{policy.type} • {policy.customerName}</Text>
        </View>
        <Text style={[styles.tag, { color }]}>{policy.status}</Text>
      </View>
      <View style={styles.row}>
        <Text>Premium: <Text style={styles.bold}>${policy.premium}</Text></Text>
        <Text>Coverage: <Text style={styles.bold}>${policy.coverage}</Text></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#121a2e', borderRadius: 12, padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 16, marginTop: 12 },
  title: { fontWeight: '700', color: '#e6e8ef' },
  muted: { color: '#9aa3b2', fontSize: 12 },
  tag: { fontSize: 12 },
  bold: { fontWeight: '700' }
});


