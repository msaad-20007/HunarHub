import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/Theme';
import { AuthContext } from '../context/AuthContext';

import SplashScreen  from '../screens/SplashScreen';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen   from '../screens/auth/LoginScreen';
import SignupScreen  from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

import CustomerHomeScreen  from '../screens/customer/HomeScreen';
import WorkerDetailsScreen from '../screens/customer/WorkerDetailsScreen';
import BookingScreen       from '../screens/customer/BookingScreen';
import ChatScreen          from '../screens/customer/ChatScreen';
import ProfileScreen       from '../screens/customer/ProfileScreen';
import SearchScreen        from '../screens/customer/SearchScreen';

import WorkerDashboard from '../screens/worker/WorkerDashboard';
import AdminDashboard  from '../screens/admin/AdminDashboard';

const Stack = createNativeStackNavigator();

const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
  },
};

const AppNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [userRole, setUserRole]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (role) => {
    try {
      if (role) {
        await AsyncStorage.setItem('userRole', role);
      } else {
        await AsyncStorage.removeItem('userRole');
      }
      setUserRole(role);
    } catch (e) {
      console.error(e);
    }
  };

  // Show animated splash while loading or during splash animation
  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ userRole, updateUserRole }}>
      <NavigationContainer theme={NavigationTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          {userRole === null ? (
            // Not logged in — show landing + auth screens
            <>
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="Signup"
                component={SignupScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{ animation: 'slide_from_right' }}
              />
            </>
          ) : userRole === 'CUSTOMER' ? (
            <>
              <Stack.Screen name="CustomerHome"   component={CustomerHomeScreen} />
              <Stack.Screen name="WorkerDetails"  component={WorkerDetailsScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Booking"        component={BookingScreen}       options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Chat"           component={ChatScreen}          options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Profile"        component={ProfileScreen}       options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Search"         component={SearchScreen}        options={{ animation: 'slide_from_right' }} />
            </>
          ) : userRole === 'WORKER' ? (
            <Stack.Screen name="WorkerDashboard" component={WorkerDashboard} />
          ) : userRole === 'ADMIN' ? (
            <Stack.Screen name="AdminDashboard"  component={AdminDashboard} />
          ) : (
            <Stack.Screen name="Landing" component={LandingScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default AppNavigator;
