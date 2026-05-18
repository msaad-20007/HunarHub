import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView,
  Alert, Animated, Dimensions, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../theme/Theme';
import { bookingAPI, userAPI, messageAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const STATUS_COLOR = {
  PENDING:   { bg: 'rgba(255,193,7,0.15)',  border: 'rgba(255,193,7,0.4)',  text: '#FFC107' },
  ACCEPTED:  { bg: 'rgba(0,230,118,0.15)',  border: 'rgba(0,230,118,0.4)',  text: '#00E676' },
  REJECTED:  { bg: 'rgba(255,76,76,0.15)',  border: 'rgba(255,76,76,0.4)',  text: '#FF4C4C' },
  COMPLETED: { bg: 'rgba(58,123,213,0.15)', border: 'rgba(58,123,213,0.4)', text: '#3A7BD5' },
};
const TYPE_COLOR = { URGENT: '#FF4C4C', ADVANCE: '#3A7BD5', NORMAL: '#00D2FF' };

const NAV = [
  { key: 'requests', label: 'Requests', emoji: '📋' },
  { key: 'history',  label: 'History',  emoji: '🕐' },
  { key: 'chats',    label: 'Chats',    emoji: '💬' },
  { key: 'profile',  label: 'Profile',  emoji: '👤' },
];

// ── Animated intro ────────────────────────────────────────────────────────────
const WorkerIntro = ({ onDone, workerName }) => {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOp  = useRef(new Animated.Value(0)).current;
  const out     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(textOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(out, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View style={[$.intro, { opacity: out }]}>
      <LinearGradient colors={['#010608', '#030D18', '#060F1C']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[$.introRing,  { transform: [{ scale }], opacity }]} />
      <Animated.View style={[$.introRing2, { transform: [{ scale }], opacity }]} />
      <View style={$.introGlow} />
      <Animated.View style={{ alignItems: 'center', opacity: textOp }}>
        <Text style={$.introEmoji}>🔧</Text>
        <Text style={$.introTitle}>WORKER</Text>
        <View style={$.introLine} />
        <Text style={$.introDash}>DASHBOARD</Text>
        <Text style={$.introSub}>
          {workerName ? `Welcome, ${workerName.split(' ')[0]}` : 'HunarHub'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

// ── Booking request card ──────────────────────────────────────────────────────
const BookingCard = ({ item, onAccept, onReject, onComplete, showActions }) => {
  const sc = STATUS_COLOR[item.status] || STATUS_COLOR.PENDING;
  const tc = TYPE_COLOR[item.type] || '#00D2FF';

  return (
    <View style={$.card}>
      <LinearGradient colors={[tc + '10', 'transparent']} style={$.cardGlow} />
      <View style={$.cardHead}>
        <LinearGradient colors={['#00D2FF25', '#3A7BD520']} style={$.cardAv}>
          <Text style={$.cardAvTxt}>
            {item.customerName?.charAt(0).toUpperCase() || 'C'}
          </Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={$.cardName}>{item.customerName || 'Customer'}</Text>
          {item.customerCity  ? <Text style={$.cardSub}>📍 {item.customerCity}</Text>  : null}
          {item.customerPhone ? <Text style={$.cardSub}>📞 {item.customerPhone}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <View style={[$.badge, { backgroundColor: tc + '18', borderColor: tc + '50' }]}>
            <Text style={[$.badgeTxt, { color: tc }]}>{item.type}</Text>
          </View>
          <View style={[$.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[$.badgeTxt, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={$.detRow}>
        <Text style={$.detIc}>📅</Text>
        <Text style={$.detVal}>
          {item.bookingDate ? String(item.bookingDate).replace('T', '  ').slice(0, 16) : 'N/A'}
        </Text>
      </View>
      <View style={$.detRow}>
        <Text style={$.detIc}>#</Text>
        <Text style={$.detVal}>Booking #{item.bookingId}</Text>
      </View>
      {showActions && item.status === 'PENDING' && (
        <View style={$.cardActs}>
          <TouchableOpacity
            style={[$.actBtn, { backgroundColor: '#00E67614', borderColor: '#00E67640' }]}
            onPress={() => onAccept(item)} activeOpacity={0.8}
          >
            <Text style={[$.actTxt, { color: '#00E676' }]}>✓ Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[$.actBtn, { backgroundColor: '#FF4C4C14', borderColor: '#FF4C4C40' }]}
            onPress={() => onReject(item)} activeOpacity={0.8}
          >
            <Text style={[$.actTxt, { color: '#FF4C4C' }]}>✗ Reject</Text>
          </TouchableOpacity>
        </View>
      )}
      {showActions && item.status === 'ACCEPTED' && (
        <View style={$.cardActs}>
          <TouchableOpacity
            style={[$.actBtn, { flex: 1, backgroundColor: '#3A7BD514', borderColor: '#3A7BD540' }]}
            onPress={() => onComplete(item)} activeOpacity={0.8}
          >
            <Text style={[$.actTxt, { color: '#3A7BD5' }]}>✅ Mark as Completed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ── Chat Tab ──────────────────────────────────────────────────────────────────
const ChatTab = ({ workerId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeChat, setActiveChat]       = useState(null); // { userId, name }
  const [messages, setMessages]           = useState([]);
  const [msgText, setMsgText]             = useState('');
  const [sending, setSending]             = useState(false);
  const flatRef = useRef(null);

  // Load unique senders who messaged this worker
  useEffect(() => {
    if (!workerId) return;
    loadConversations();
  }, [workerId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // Build contact list from bookings — any customer who has booked this worker
      const bookings = await bookingAPI.getByWorker(workerId);
      const seen = new Map();
      (Array.isArray(bookings) ? bookings : []).forEach(b => {
        if (b.customerUserId && !seen.has(b.customerUserId)) {
          seen.set(b.customerUserId, { userId: b.customerUserId, name: b.customerName || 'Customer' });
        }
      });
      setConversations([...seen.values()]);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (contact) => {
    setActiveChat(contact);
    setMessages([]);
    try {
      const data = await messageAPI.getConversation(workerId, contact.userId);
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activeChat) return;
    setSending(true);
    try {
      const saved = await messageAPI.send({
        senderId:   workerId,
        receiverId: activeChat.userId,
        text:       msgText.trim(),
      });
      setMessages(prev => [...prev, saved]);
      setMsgText('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // ── Open conversation view ──
  if (activeChat) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        {/* Chat header */}
        <View style={$.chatHeader}>
          <TouchableOpacity onPress={() => setActiveChat(null)} style={$.chatBack}>
            <Text style={$.chatBackTxt}>← Back</Text>
          </TouchableOpacity>
          <LinearGradient colors={['#00D2FF25', '#3A7BD520']} style={$.chatAv}>
            <Text style={$.chatAvTxt}>{activeChat.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={$.chatHeaderName}>{activeChat.name}</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m, i) => (m.messageId ?? i).toString()}
          contentContainerStyle={$.msgList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={$.emptyWrap}>
              <Text style={$.emptyIc}>💬</Text>
              <Text style={$.emptyTitle}>No messages yet</Text>
              <Text style={$.emptyTxt}>Start the conversation</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderId === workerId;
            return (
              <View style={[$.bubble, isMe ? $.bubbleMe : $.bubbleThem]}>
                <Text style={[$.bubbleTxt, isMe && $.bubbleTxtMe]}>{item.text}</Text>
                <Text style={$.bubbleTime}>
                  {item.timestamp ? String(item.timestamp).slice(11, 16) : ''}
                </Text>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={$.msgInputRow}>
          <TextInput
            style={$.msgInput}
            placeholder="Type a message..."
            placeholderTextColor="#2A3D50"
            value={msgText}
            onChangeText={setMsgText}
            multiline
          />
          <TouchableOpacity
            style={[$.msgSendBtn, (!msgText.trim() || sending) && { opacity: 0.4 }]}
            onPress={sendMessage}
            disabled={!msgText.trim() || sending}
            activeOpacity={0.8}
          >
            <Text style={$.msgSendTxt}>{sending ? '...' : '➤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Conversation list ──
  if (loading) {
    return (
      <View style={$.emptyWrap}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={$.emptyTxt}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(c) => c.userId.toString()}
      contentContainerStyle={[$.list, conversations.length === 0 && $.listEmpty]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={$.listHeader}>
          <Text style={$.listTitle}>Messages</Text>
          <View style={$.listCount}>
            <Text style={$.listCountTxt}>{conversations.length} contacts</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={$.emptyWrap}>
          <Text style={$.emptyIc}>💬</Text>
          <Text style={$.emptyTitle}>No messages yet</Text>
          <Text style={$.emptyTxt}>Customers who book you can message you here</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={$.convCard} onPress={() => openChat(item)} activeOpacity={0.8}>
          <LinearGradient colors={['#00D2FF25', '#3A7BD520']} style={$.convAv}>
            <Text style={$.convAvTxt}>{item.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={$.convName}>{item.name}</Text>
            <Text style={$.convSub}>Tap to open conversation</Text>
          </View>
          <Text style={{ color: '#3A5568', fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      )}
    />
  );
};

// ── Profile Tab (with Edit) ───────────────────────────────────────────────────
const ProfileTab = ({ profile, workerId, onProfileUpdated }) => {
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: '', phone: '', city: '' });

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '' });
    }
  }, [profile]);

  if (!profile) return (
    <View style={$.emptyWrap}>
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );

  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'W';

  const statusColor = {
    APPROVED: '#00E676', PENDING: '#FFC107', REJECTED: '#FF4C4C',
  }[profile.approvalStatus] || '#FFC107';

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Validation', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      await userAPI.updateProfile(workerId, {
        name:  form.name.trim(),
        phone: form.phone.trim(),
        city:  form.city.trim(),
      });
      Alert.alert('Success', 'Profile updated successfully.');
      setEditing(false);
      onProfileUpdated(); // reload profile
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={$.profileScroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={['#0A1E32', '#060E18']} style={$.profileHero}>
        <LinearGradient colors={['#00D2FF25', '#3A7BD520']} style={$.profileAv}>
          <Text style={$.profileAvTxt}>{initials}</Text>
        </LinearGradient>
        <Text style={$.profileName}>{profile.name}</Text>
        <Text style={$.profileCat}>{profile.category}</Text>
        <View style={[$.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '50' }]}>
          <Text style={[$.statusBadgeTxt, { color: statusColor }]}>
            {profile.approvalStatus === 'APPROVED' ? '✅ Verified Worker' :
             profile.approvalStatus === 'PENDING'  ? '⏳ Pending Approval' : '❌ Rejected'}
          </Text>
        </View>
        {profile.rating > 0 && (
          <Text style={$.profileRating}>⭐ {Number(profile.rating).toFixed(1)} Rating</Text>
        )}
      </LinearGradient>

      {/* Edit / Save button */}
      <View style={$.editBtnRow}>
        {editing ? (
          <>
            <TouchableOpacity
              style={[$.editBtn, { backgroundColor: '#00E67614', borderColor: '#00E67640' }]}
              onPress={handleSave} disabled={saving} activeOpacity={0.8}
            >
              <Text style={[$.editBtnTxt, { color: '#00E676' }]}>
                {saving ? 'Saving...' : '✓ Save Changes'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[$.editBtn, { backgroundColor: '#FF4C4C14', borderColor: '#FF4C4C40', marginLeft: 10 }]}
              onPress={() => { setEditing(false); setForm({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '' }); }}
              activeOpacity={0.8}
            >
              <Text style={[$.editBtnTxt, { color: '#FF4C4C' }]}>✗ Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[$.editBtn, { backgroundColor: '#00D2FF14', borderColor: '#00D2FF40' }]}
            onPress={() => setEditing(true)} activeOpacity={0.8}
          >
            <Text style={[$.editBtnTxt, { color: '#00D2FF' }]}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info rows */}
      <View style={$.profileCard}>
        {/* Editable fields */}
        {editing ? (
          <>
            <View style={$.profileRow}>
              <Text style={$.profileRowIc}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={$.profileRowLabel}>NAME</Text>
                <TextInput
                  style={$.profileEditInput}
                  value={form.name}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                  placeholderTextColor="#3A5568"
                  placeholder="Your name"
                />
              </View>
            </View>
            <View style={$.profileRow}>
              <Text style={$.profileRowIc}>📞</Text>
              <View style={{ flex: 1 }}>
                <Text style={$.profileRowLabel}>PHONE</Text>
                <TextInput
                  style={$.profileEditInput}
                  value={form.phone}
                  onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                  placeholderTextColor="#3A5568"
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View style={$.profileRow}>
              <Text style={$.profileRowIc}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={$.profileRowLabel}>CITY</Text>
                <TextInput
                  style={$.profileEditInput}
                  value={form.city}
                  onChangeText={v => setForm(f => ({ ...f, city: v }))}
                  placeholderTextColor="#3A5568"
                  placeholder="Your city"
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {[
              { icon: '👤', label: 'Name',     value: profile.name },
              { icon: '📞', label: 'Phone',    value: profile.phone    || 'Not set' },
              { icon: '📍', label: 'City',     value: profile.city     || 'Not set' },
            ].map((row, i) => (
              <View key={i} style={$.profileRow}>
                <Text style={$.profileRowIc}>{row.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={$.profileRowLabel}>{row.label}</Text>
                  <Text style={$.profileRowValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Read-only fields always shown */}
        {[
          { icon: '📧', label: 'Email',    value: profile.email },
          { icon: '💬', label: 'WhatsApp', value: profile.whatsapp || 'Not set' },
          { icon: '🪪', label: 'CNIC',     value: profile.cnic    || 'N/A' },
          { icon: '🎂', label: 'DOB',      value: profile.dob     || 'Not set' },
        ].map((row, i) => (
          <View key={'ro' + i} style={$.profileRow}>
            <Text style={$.profileRowIc}>{row.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={$.profileRowLabel}>{row.label}</Text>
              <Text style={$.profileRowValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const WorkerDashboard = () => {
  const [showIntro, setShowIntro]   = useState(true);
  const [activeTab, setActiveTab]   = useState('requests');
  const [requests, setRequests]     = useState([]);
  const [history, setHistory]       = useState([]);
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [workerId, setWorkerId]     = useState(null);
  const { updateUserRole }          = useAuth();

  useEffect(() => {
    loadWorkerData();
  }, []);

  useEffect(() => {
    if (!showIntro && workerId) loadTab(activeTab);
  }, [activeTab, showIntro, workerId]);

  const loadWorkerData = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) setWorkerId(parseInt(userId, 10));
  };

  const loadTab = async (tab) => {
    if (!workerId) return;
    setLoading(true);
    try {
      if (tab === 'requests' || tab === 'history') {
        const data = await bookingAPI.getByWorker(workerId);
        const all  = Array.isArray(data) ? data : [];
        setRequests(all.filter(b => b.status === 'PENDING'));
        setHistory(all.filter(b => b.status !== 'PENDING'));
      } else if (tab === 'profile') {
        const data = await userAPI.getProfile(workerId);
        setProfile(data);
      }
      // 'chats' tab loads its own data internally
    } catch (e) {
      console.error('Failed to load tab:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const reloadProfile = async () => {
    if (!workerId) return;
    try {
      const data = await userAPI.getProfile(workerId);
      setProfile(data);
    } catch (e) {
      console.error('Failed to reload profile:', e);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTab(activeTab);
  }, [activeTab, workerId]);

  const handleUpdateStatus = async (item, status) => {
    try {
      await bookingAPI.updateStatus(item.bookingId, status);
      const data = await bookingAPI.getByWorker(workerId);
      const all  = Array.isArray(data) ? data : [];
      setRequests(all.filter(b => b.status === 'PENDING'));
      setHistory(all.filter(b => b.status !== 'PENDING'));
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update booking status.');
    }
  };

  const handleAccept = (item) => {
    Alert.alert(
      'Accept Booking',
      `Accept booking from ${item.customerName}? They will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => handleUpdateStatus(item, 'ACCEPTED') },
      ]
    );
  };

  const handleReject = (item) => {
    Alert.alert(
      'Reject Booking',
      `Reject booking from ${item.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => handleUpdateStatus(item, 'REJECTED') },
      ]
    );
  };

  const handleComplete = (item) => {
    Alert.alert(
      'Mark as Completed',
      `Mark booking #${item.bookingId} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => handleUpdateStatus(item, 'COMPLETED') },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['userRole', 'userId', 'userName']);
          await updateUserRole(null);
        },
      },
    ]);
  };

  if (showIntro) {
    return (
      <WorkerIntro
        workerName={profile?.name}
        onDone={() => setShowIntro(false)}
      />
    );
  }

  const pendingCount = requests.length;

  const renderContent = () => {
    if (loading && !refreshing && activeTab !== 'chats') {
      return (
        <View style={$.emptyWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={$.emptyTxt}>Loading...</Text>
        </View>
      );
    }

    if (activeTab === 'profile') {
      return (
        <ProfileTab
          profile={profile}
          workerId={workerId}
          onProfileUpdated={reloadProfile}
        />
      );
    }

    if (activeTab === 'chats') {
      return <ChatTab workerId={workerId} />;
    }

    const data        = activeTab === 'requests' ? requests : history;
    const showActions = activeTab === 'requests';

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.bookingId?.toString() ?? Math.random().toString()}
        contentContainerStyle={[$.list, data.length === 0 && $.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.primary} colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <View style={$.listHeader}>
            <Text style={$.listTitle}>
              {activeTab === 'requests' ? 'Pending Requests' : 'Booking History'}
            </Text>
            <View style={$.listCount}>
              <Text style={$.listCountTxt}>{data.length} total</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={$.emptyWrap}>
            <Text style={$.emptyIc}>{activeTab === 'requests' ? '📭' : '📋'}</Text>
            <Text style={$.emptyTitle}>
              {activeTab === 'requests' ? 'No pending requests' : 'No booking history'}
            </Text>
            <Text style={$.emptyTxt}>Pull down to refresh</Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookingCard
            item={item}
            showActions={showActions}
            onAccept={handleAccept}
            onReject={handleReject}
            onComplete={handleComplete}
          />
        )}
      />
    );
  };

  return (
    <View style={$.root}>
      {/* Header */}
      <LinearGradient colors={['#020810', '#040D1A']} style={$.header}>
        <View style={$.hLeft}>
          <View style={$.hDot} />
          <View>
            <Text style={$.hTitle}>Worker Dashboard</Text>
            <Text style={$.hSub}>HunarHub</Text>
          </View>
        </View>
        <TouchableOpacity style={$.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={$.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <View style={$.content}>{renderContent()}</View>

      {/* Bottom Nav */}
      <View style={$.nav}>
        {NAV.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={$.navItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              {active && (
                <LinearGradient colors={['#00D2FF25', 'transparent']} style={$.navGlow} />
              )}
              <View style={[$.navIconWrap, active && $.navIconWrapActive]}>
                <Text style={$.navEmoji}>{tab.emoji}</Text>
                {tab.key === 'requests' && pendingCount > 0 && (
                  <View style={$.navBadge}>
                    <Text style={$.navBadgeTxt}>{pendingCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[$.navLbl, active && $.navLblActive]}>{tab.label}</Text>
              {active && <View style={$.navLine} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const $ = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060E18' },

  // Intro
  intro:      { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 999, backgroundColor: '#010608' },
  introRing:  { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1.5, borderColor: '#00D2FF50' },
  introRing2: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  borderWidth: 1,   borderColor: '#00D2FF80' },
  introGlow:  { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#00D2FF', opacity: 0.06 },
  introEmoji: { fontSize: 48, marginBottom: 12, textAlign: 'center' },
  introTitle: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', letterSpacing: 14, textAlign: 'center' },
  introLine:  { width: 120, height: 3, backgroundColor: '#00D2FF', marginVertical: 12, borderRadius: 2 },
  introDash:  { fontSize: 22, fontWeight: '200', color: '#00D2FF', letterSpacing: 10, textAlign: 'center' },
  introSub:   { fontSize: 13, color: '#1E3040', letterSpacing: 2, marginTop: 18, textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: SIZES.extraLarge * 2, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#0C1E2E',
  },
  hLeft:  { flexDirection: 'row', alignItems: 'center' },
  hDot:   {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#00D2FF', marginRight: 12,
    shadowColor: '#00D2FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 8,
  },
  hTitle: { fontSize: 20, fontWeight: '800', color: '#D8EAF8', letterSpacing: 0.3 },
  hSub:   { fontSize: 12, color: '#243545', marginTop: 2 },
  logoutBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: '#FF4C4C35', backgroundColor: '#FF4C4C10' },
  logoutTxt: { fontSize: 13, color: '#FF4C4C', fontWeight: '700' },

  content: { flex: 1 },

  // List
  list:         { padding: 20, paddingBottom: 20 },
  listEmpty:    { flex: 1 },
  listHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle:    { fontSize: 20, fontWeight: '800', color: '#D8EAF8' },
  listCount:    { backgroundColor: '#0B1825', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#162535' },
  listCountTxt: { fontSize: 12, color: '#3A5568', fontWeight: '600' },

  // Empty
  emptyWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIc:    { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#C0D8EC', marginBottom: 6 },
  emptyTxt:   { fontSize: 14, color: '#243545', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },

  // Cards
  card: {
    backgroundColor: '#0B1825', borderRadius: 20, borderWidth: 1, borderColor: '#162535',
    padding: 18, marginBottom: 14, overflow: 'hidden',
  },
  cardGlow:  { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  cardHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardAv:    { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1.5, borderColor: '#00D2FF30' },
  cardAvTxt: { fontSize: 20, fontWeight: '800', color: '#00D2FF' },
  cardName:  { fontSize: 16, fontWeight: '700', color: '#D8EAF8', marginBottom: 3 },
  cardSub:   { fontSize: 13, color: '#3A5568', marginTop: 2 },
  badge:     { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:  { fontSize: 11, fontWeight: '700' },
  detRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detIc:     { fontSize: 14, width: 26, color: '#3A5568' },
  detVal:    { fontSize: 13, color: '#3A5568', flex: 1 },
  cardActs:  { flexDirection: 'row', marginTop: 14, borderTopWidth: 1, borderTopColor: '#162535', paddingTop: 14, gap: 10 },
  actBtn:    { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  actTxt:    { fontSize: 14, fontWeight: '700' },

  // Chat tab
  chatHeader:     { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12, backgroundColor: '#0B1825', borderBottomWidth: 1, borderBottomColor: '#162535' },
  chatBack:       { marginRight: 12 },
  chatBackTxt:    { color: '#00D2FF', fontSize: 15, fontWeight: '700' },
  chatAv:         { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#00D2FF30' },
  chatAvTxt:      { fontSize: 16, fontWeight: '800', color: '#00D2FF' },
  chatHeaderName: { fontSize: 17, fontWeight: '700', color: '#D8EAF8', flex: 1 },
  msgList:        { padding: 16, paddingBottom: 8 },
  bubble:         { maxWidth: '78%', padding: 12, borderRadius: 18, marginBottom: 8 },
  bubbleMe:       { alignSelf: 'flex-end',   backgroundColor: '#00D2FF',  borderBottomRightRadius: 4 },
  bubbleThem:     { alignSelf: 'flex-start', backgroundColor: '#0B1825',  borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#162535' },
  bubbleTxt:      { fontSize: 14, color: '#D8EAF8' },
  bubbleTxtMe:    { color: '#060E18', fontWeight: '600' },
  bubbleTime:     { fontSize: 10, color: '#3A5568', alignSelf: 'flex-end', marginTop: 4 },
  msgInputRow:    { flexDirection: 'row', padding: 12, backgroundColor: '#0B1825', borderTopWidth: 1, borderTopColor: '#162535', alignItems: 'flex-end' },
  msgInput:       { flex: 1, backgroundColor: '#060E18', color: '#D8EAF8', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#162535', marginRight: 10, maxHeight: 100, fontSize: 14 },
  msgSendBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00D2FF', justifyContent: 'center', alignItems: 'center' },
  msgSendTxt:     { color: '#060E18', fontSize: 18, fontWeight: '800' },
  convCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1825', borderRadius: 16, borderWidth: 1, borderColor: '#162535', padding: 14, marginBottom: 10 },
  convAv:         { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#00D2FF30' },
  convAvTxt:      { fontSize: 18, fontWeight: '800', color: '#00D2FF' },
  convName:       { fontSize: 15, fontWeight: '700', color: '#D8EAF8', marginBottom: 3 },
  convSub:        { fontSize: 12, color: '#3A5568' },

  // Profile tab
  profileScroll:   { paddingBottom: 20 },
  profileHero:     { alignItems: 'center', paddingVertical: SIZES.extraLarge + 8, borderBottomWidth: 1, borderBottomColor: '#0C2540' },
  profileAv:       { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.small, borderWidth: 2, borderColor: '#00D2FF40' },
  profileAvTxt:    { fontSize: 34, fontWeight: '800', color: '#00D2FF' },
  profileName:     { fontSize: 22, fontWeight: '800', color: '#D8EAF8', marginBottom: 4 },
  profileCat:      { fontSize: 16, color: '#00D2FF', marginBottom: 10 },
  statusBadge:     { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 8 },
  statusBadgeTxt:  { fontSize: 13, fontWeight: '700' },
  profileRating:   { fontSize: 16, color: '#FFC107', fontWeight: 'bold', marginTop: 4 },
  editBtnRow:      { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  editBtn:         { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  editBtnTxt:      { fontSize: 14, fontWeight: '700' },
  profileCard:     { backgroundColor: '#0B1825', marginHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#162535', overflow: 'hidden' },
  profileRow:      { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#162535' },
  profileRowIc:    { fontSize: 18, width: 32, color: '#3A5568' },
  profileRowLabel: { fontSize: 11, color: '#3A5568', fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  profileRowValue: { fontSize: 15, color: '#D8EAF8', fontWeight: '500' },
  profileEditInput:{ fontSize: 15, color: '#D8EAF8', fontWeight: '500', borderBottomWidth: 1, borderBottomColor: '#00D2FF40', paddingVertical: 4, paddingHorizontal: 2 },

  // Bottom Nav
  nav:              { flexDirection: 'row', backgroundColor: '#070E18', borderTopWidth: 1, borderTopColor: '#0C1E2E', paddingBottom: 8, paddingTop: 4 },
  navItem:          { flex: 1, alignItems: 'center', paddingVertical: 8, position: 'relative', overflow: 'hidden' },
  navGlow:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  navIconWrap:      { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  navIconWrapActive:{ backgroundColor: '#00D2FF15', borderWidth: 1, borderColor: '#00D2FF25' },
  navEmoji:         { fontSize: 22 },
  navBadge:         { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF4C4C', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  navBadgeTxt:      { color: '#FFF', fontSize: 9, fontWeight: '800' },
  navLbl:           { fontSize: 11, color: '#2A3D50', fontWeight: '600', marginTop: 3 },
  navLblActive:     { color: '#00D2FF', fontWeight: '700' },
  navLine:          { position: 'absolute', bottom: 0, width: 28, height: 2.5, backgroundColor: '#00D2FF', borderRadius: 2 },
});

export default WorkerDashboard;
