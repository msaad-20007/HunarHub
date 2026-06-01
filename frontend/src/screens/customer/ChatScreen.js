import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import { messageAPI } from '../../services/api';

const ChatScreen = ({ navigation, route }) => {
  const { worker } = route.params || {};
  // worker.id is the users table PK (used by messages); worker.workerId is the workers table PK
  const workerUserId = worker?.id ?? worker?.userId ?? null;
  const workerName   = worker?.name ?? 'Worker';

  const [messages, setMessages]   = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myUserId, setMyUserId]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const flatRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const id = await AsyncStorage.getItem('userId');
      setMyUserId(parseInt(id, 10));
      if (id && workerUserId) {
        await loadMessages(parseInt(id, 10));
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadMessages = async (userId) => {
    setLoading(true);
    try {
      const data = await messageAPI.getConversation(userId, workerUserId);
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !myUserId || !workerUserId) return;
    setSending(true);
    try {
      const saved = await messageAPI.send({
        senderId:   myUserId,
        receiverId: workerUserId,
        text:       newMessage.trim(),
      });
      setMessages(prev => [...prev, saved]);
      setNewMessage('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === myUserId;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : null]}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp ? String(item.timestamp).slice(11, 16) : ''}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={['#F5A62325', '#E8621A20']} style={styles.headerAv}>
            <Text style={styles.headerAvTxt}>{workerName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.headerTitle}>{workerName}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingTxt}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item, i) => (item.messageId ?? i).toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={48} color="#6B5D4F" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyTxt}>Say hello to {workerName}</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxHeight={100}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newMessage.trim() || sending) && { opacity: 0.4 }]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
          activeOpacity={0.8}
        >
          <Ionicons name={sending ? 'ellipsis-horizontal' : 'send'} size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SIZES.padding, paddingTop: SIZES.extraLarge * 2,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:      { flexDirection: 'row', alignItems: 'center', padding: SIZES.small, minWidth: 60 },
  backText:     { ...FONTS.body, color: COLORS.primary, fontWeight: '700', marginLeft: 2 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  headerAv:     { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#F5A62330' },
  headerAvTxt:  { fontSize: 15, fontWeight: '800', color: '#F5A623' },
  headerTitle:  { ...FONTS.large, color: COLORS.text, fontWeight: 'bold' },
  loadingWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt:   { color: COLORS.textSecondary, marginTop: 12, fontSize: 14 },
  emptyWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptyTxt:     { fontSize: 14, color: COLORS.textSecondary },
  list:         { padding: SIZES.padding, paddingBottom: 8, flexGrow: 1 },
  messageBubble:{
    maxWidth: '80%', padding: SIZES.small + 2, borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
  },
  myMessage:    { alignSelf: 'flex-end',   backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: COLORS.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  messageText:  { ...FONTS.body, color: COLORS.text },
  myMessageText:{ color: '#FFF' },
  timestamp:    { fontSize: 10, color: COLORS.textSecondary, alignSelf: 'flex-end', marginTop: 4 },
  inputContainer:{
    flexDirection: 'row', padding: SIZES.padding, backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'flex-end',
  },
  input:        {
    flex: 1, backgroundColor: COLORS.background, color: COLORS.text,
    paddingHorizontal: SIZES.padding, paddingVertical: SIZES.small,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    marginRight: SIZES.base, fontSize: 14,
  },
  sendBtn:      { backgroundColor: COLORS.secondary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});

export default ChatScreen;
