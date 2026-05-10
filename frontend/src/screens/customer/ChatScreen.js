import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';

const ChatScreen = ({ navigation, route }) => {
  const { worker } = route.params || { worker: { name: 'Support' } };
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myUserId, setMyUserId] = useState(null);

  useEffect(() => {
    // Load my user ID and mock messages
    const loadChat = async () => {
      const id = await AsyncStorage.getItem('userId');
      setMyUserId(id);
      
      setMessages([
        { id: 1, senderId: 999, text: 'Hello! How can I help you today?', timestamp: '10:00 AM' },
        { id: 2, senderId: parseInt(id), text: 'I need some plumbing work done.', timestamp: '10:05 AM' }
      ]);
    };
    loadChat();
  }, []);

  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const msg = {
      id: Date.now(),
      senderId: parseInt(myUserId),
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, msg]);
    setNewMessage('');
    
    // TODO: Make actual POST request to backend /api/messages
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === parseInt(myUserId);
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : null]}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{worker.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SIZES.padding, paddingTop: SIZES.extraLarge * 2, backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  backBtn: { padding: SIZES.small },
  backText: { ...FONTS.body, color: COLORS.primary },
  headerTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold' },
  list: { padding: SIZES.padding },
  messageBubble: {
    maxWidth: '80%', padding: SIZES.small, borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
  },
  myMessage: {
    alignSelf: 'flex-end', backgroundColor: COLORS.primary,
    borderBottomRightRadius: 0,
  },
  theirMessage: {
    alignSelf: 'flex-start', backgroundColor: COLORS.card,
    borderBottomLeftRadius: 0, borderWidth: 1, borderColor: COLORS.border,
  },
  messageText: { ...FONTS.body, color: COLORS.text },
  myMessageText: { color: '#FFF' },
  timestamp: { ...FONTS.small, color: COLORS.textSecondary, alignSelf: 'flex-end', marginTop: 4, fontSize: 10 },
  inputContainer: {
    flexDirection: 'row', padding: SIZES.padding, backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center'
  },
  input: {
    flex: 1, backgroundColor: COLORS.background, color: COLORS.text,
    paddingHorizontal: SIZES.padding, paddingVertical: SIZES.small,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: SIZES.base
  },
  sendBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.small, borderRadius: 20,
  },
  sendText: { ...FONTS.body, color: '#FFF', fontWeight: 'bold' },
});

export default ChatScreen;
