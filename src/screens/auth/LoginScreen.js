import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    try {
      dispatch(loginStart());
      const response = await authAPI.login({ email, password });  
      //Extract and store the token
      const token = response.data.token; // Adjust path if different
      // console.log('Login response:', response.data);

      if (token) {
        await AsyncStorage.setItem('token', token);
        const savedToken = await AsyncStorage.getItem('token');
        // console.log('Token saved in AsyncStorage:', savedToken);
      } else {
        throw new Error('Token not found in response');
      }
  
      dispatch(loginSuccess(response.data));
      navigation.replace('Main');
    } catch (error) {
      console.log(error, "error");
      dispatch(loginFailure(error.response?.data?.message || 'Login failed'));
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    }
  };

  const images = {
    logo: require('../../../assets/logo.svg'),
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Image source={images['logo']} style={styles.logo} />
        <Text style={styles.subtitle}>Login to your account</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <View style={styles.linkButton}>
          <Text style={styles.linkLabel}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              Join now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 32,
  },
  titleContainer: {
    gap: 12,
  },
  logo: {
    width: 210,
    height: 70,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
  },
  inputContainer: {
    gap: 12,  
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#F20D33',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  linkLabel: {
    fontSize: 14,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
}); 