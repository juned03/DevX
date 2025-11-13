import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from '@/screens/Dashboard';
import Policies from '@/screens/Policies';
import Claims from '@/screens/Claims';
import Customers from '@/screens/Customers';
import Underwriting from '@/screens/Underwriting';
import Reports from '@/screens/Reports';
import { AuthProvider } from '@/context/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Policies" component={Policies} />
          <Stack.Screen name="Claims" component={Claims} />
          <Stack.Screen name="Customers" component={Customers} />
          <Stack.Screen name="Underwriting" component={Underwriting} />
          <Stack.Screen name="Reports" component={Reports} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}


