import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView,
  Alert, Animated, Dimensions, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme/Theme';
import { bookingAPI, userAPI, messageAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const STATUS_COLOR = {
  PENDING:   { bg: 'rgba(255,193,7,0.15)',  border: 'rgba(255,193,7,0.4)',  text: '#FFC107' },
  ACCEPTED:  { bg: 'rgba(0,230,118,0.15)',  border: 'rgba(0,230,118,0.4)',  text: '#00E676' },
  REJECTED:  { bg: 'rgba(255,76,76,0.15)',  border: 'rgba(255,76,76,0.4)',  text: '#FF4C4C' },
  COMPLETED: { bg: 'rgba(58,123,213,0.15)', border: 'rgba(58,123,213,0.4)', text: '#E8621A' },
};
const TYPE_COLOR = { URGENT: '#FF4C4C', ADVANCE: '#E8621A', NORMAL: '#F5A623' };

const NAV = [
  { key: 'requests', label: 'Requests', icon: 'clipboard-outline' },
  { key: 'history',  label: 'History',  icon: 'time-outline' },
  { key: 'chats',    label: 'Chats',    icon: 'chatbubble-outline' },
  { key: 'profile',  label: 'Profile',  icon: 'person-outline' },
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
      <LinearGradient colors={['#0A0806', '#0A0806', '#0A0806']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[$.introRing,  { transform: [{ scale }], opacity }]} />
      <Animated.View style={[$.introRing2, { transform: [{ scale }], opacity }]} />
      <View style={$.introGlow} />
      <Animated.View style={{ alignItems: 'center', opacity: textOp }}>
        <View style={$.introIconWrap}>
          <Ionicons name="construct-outline" size={48} color="#F5A623" />
        </View>
        <Text style={$.introTitle}>WORKER</Text>
        <View style={$.introLine} />
        <Text style={$.introDash}>DASHBOARD</Text>
        <Text style={$.introSub}>{workerName ? `Welcome, ${workerName.split(' ')[0]}` : 'HunarHub'}</Text>
      </Animated.View>
    </Animated.View>
  );
};

// ── Booking Card ──────────────────────────────────────────────────────────────
const BookingCard = ({ item, onAccept, onReject, onComplete, showActions }) => {
  const sc = STATUS_COLOR[item.status] || STATUS_COLOR.PENDING;
  const tc = TYPE_COLOR[item.type] || '#F5A623';
  return (
    <View style={$.card}>
      <LinearGradient colors={[tc + '10', 'transparent']} style={$.cardGlow} />
      <View style={$.cardHead}>
        <LinearGradient colors={['#F5A62325', '#E8621A20']} style={$.cardAv}>
          <Text style={$.cardAvTxt}>{item.customerName?.charAt(0).toUpperCase() || 'C'}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={$.cardName}>{item.customerName || 'Customer'}</Text>
          {item.customerCity ? (
            <View style={$.cardSubRow}>
              <Ionicons name="location-outline" size={12} color="#6B5D4F" style={{ marginRight: 3 }} />
              <Text style={$.cardSub}>{item.customerCity}</Text>
            </View>
          ) : null}
          {item.customerPhone ? (
            <View style={$.cardSubRow}>
              <Ionicons name="call-outline" size={12} color="#6B5D4F" style={{ marginRight: 3 }} />
              <Text style={$.cardSub}>{item.customerPhone}</Text>
            </View>
          ) : null}
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
        <Ionicons name="calendar-outline" size={14} color="#6B5D4F" style={{ marginRight: 8 }} />
        <Text style={$.detVal}>{item.bookingDate ? String(item.bookingDate).replace('T','  ').slice(0,16) : 'N/A'}</Text>
      </View>
      <View style={$.detRow}>
        <Ionicons name="receipt-outline" size={14} color="#6B5D4F" style={{ marginRight: 8 }} />
        <Text style={$.detVal}>Booking #{item.bookingId}</Text>
      </View>
      {showActions && item.status === 'PENDING' && (
        <View style={$.cardActs}>
          <TouchableOpacity style={[$.actBtn, { backgroundColor: '#00E67614', borderColor: '#00E67640' }]} onPress={() => onAccept(item)} activeOpacity={0.8}>
            <Ionicons name="checkmark-outline" size={16} color="#00E676" style={{ marginRight: 5 }} />
            <Text style={[$.actTxt, { color: '#00E676' }]}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[$.actBtn, { backgroundColor: '#FF4C4C14', borderColor: '#FF4C4C40' }]} onPress={() => onReject(item)} activeOpacity={0.8}>
            <Ionicons name="close-outline" size={16} color="#FF4C4C" style={{ marginRight: 5 }} />
            <Text style={[$.actTxt, { color: '#FF4C4C' }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
      {showActions && item.status === 'ACCEPTED' && (
        <View style={$.cardActs}>
          <TouchableOpacity style={[$.actBtn, { flex: 1, backgroundColor: '#E8621A14', borderColor: '#E8621A40' }]} onPress={() => onComplete(item)} activeOpacity={0.8}>
            <Ionicons name="checkmark-done-outline" size={16} color="#E8621A" style={{ marginRight: 5 }} />
            <Text style={[$.actTxt, { color: '#E8621A' }]}>Mark as Completed</Text>
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
  const [activeChat, setActiveChat]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [msgText, setMsgText]             = useState('');
  const [sending, setSending]             = useState(false);
  const flatRef = useRef(null);

  useEffect(() => { if (workerId) loadConversations(); }, [workerId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const bookings = await bookingAPI.getByWorker(workerId);
      const seen = new Map();
      (Array.isArray(bookings) ? bookings : []).forEach(b => {
        if (b.customerUserId && !seen.has(b.customerUserId))
          seen.set(b.customerUserId, { userId: b.customerUserId, name: b.customerName || 'Customer' });
      });
      setConversations([...seen.values()]);
    } catch (e) { console.error('Failed to load conversations:', e); }
    finally { setLoading(false); }
  };

  const openChat = async (contact) => {
    setActiveChat(contact); setMessages([]);
    try {
      const data = await messageAPI.getConversation(workerId, contact.userId);
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) { console.error('Failed to load messages:', e); }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activeChat) return;
    setSending(true);
    try {
      const saved = await messageAPI.send({ senderId: workerId, receiverId: activeChat.userId, text: msgText.trim() });
      setMessages(prev => [...prev, saved]);
      setMsgText('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) { Alert.alert('Error', 'Failed to send message.'); }
    finally { setSending(false); }
  };

  if (activeChat) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <View style={$.chatHeader}>
          <TouchableOpacity onPress={() => setActiveChat(null)} style={$.chatBack}>
            <Ionicons name="chevron-back" size={20} color="#F5A623" />
            <Text style={$.chatBackTxt}>Back</Text>
          </TouchableOpacity>
          <LinearGradient colors={['#F5A62325', '#E8621A20']} style={$.chatAv}>
            <Text style={$.chatAvTxt}>{activeChat.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={$.chatHeaderName}>{activeChat.name}</Text>
        </View>
        <FlatList
          ref={flatRef} data={messages}
          keyExtractor={(m, i) => (m.messageId ?? i).toString()}
          contentContainerStyle={$.msgList} showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={$.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={48} color="#6B5D4F" />
              <Text style={$.emptyTitle}>No messages yet</Text>
              <Text style={$.emptyTxt}>Start the conversation</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderId === workerId;
            return (
              <View style={[$.bubble, isMe ? $.bubbleMe : $.bubbleThem]}>
                <Text style={[$.bubbleTxt, isMe && $.bubbleTxtMe]}>{item.text}</Text>
                <Text style={$.bubbleTime}>{item.timestamp ? String(item.timestamp).slice(11,16) : ''}</Text>
              </View>
            );
          }}
        />
        <View style={$.msgInputRow}>
          <TextInput style={$.msgInput} placeholder="Type a message..." placeholderTextColor="#6B5D4F" value={msgText} onChangeText={setMsgText} multiline />
          <TouchableOpacity style={[$.msgSendBtn, (!msgText.trim() || sending) && { opacity: 0.4 }]} onPress={sendMessage} disabled={!msgText.trim() || sending} activeOpacity={0.8}>
            <Ionicons name="send" size={20} color="#0F0D0A" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (loading) return <View style={$.emptyWrap}><ActivityIndicator color={COLORS.primary} /><Text style={$.emptyTxt}>Loading chats...</Text></View>;

  return (
    <FlatList
      data={conversations} keyExtractor={(c) => c.userId.toString()}
      contentContainerStyle={[$.list, conversations.length === 0 && $.listEmpty]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={$.listHeader}>
          <Text style={$.listTitle}>Messages</Text>
          <View style={$.listCount}><Text style={$.listCountTxt}>{conversations.length} contacts</Text></View>
        </View>
      }
      ListEmptyComponent={
        <View style={$.emptyWrap}>
          <Ionicons name="chatbubbles-outline" size={48} color="#6B5D4F" />
          <Text style={$.emptyTitle}>No messages yet</Text>
          <Text style={$.emptyTxt}>Customers who book you can message you here</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={$.convCard} onPress={() => openChat(item)} activeOpacity={0.8}>
          <LinearGradient colors={['#F5A62325', '#E8621A20']} style={$.convAv}>
            <Text style={$.convAvTxt}>{item.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={$.convName}>{item.name}</Text>
            <Text style={$.convSub}>Tap to open conversation</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6B5D4F" />
        </TouchableOpacity>
      )}
    />
  );
};

// ── Profile Tab ───────────────────────────────────────────────────────────────
const ProfileTab = ({ profile, workerId, onProfileUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name: '', phone: '', city: '' });

  useEffect(() => {
    if (profile) setForm({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '' });
  }, [profile]);

  if (!profile) return <View style={$.emptyWrap}><ActivityIndicator color={COLORS.primary} /></View>;

  const initials    = profile.name ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'W';
  const statusColor = { APPROVED: '#00E676', PENDING: '#FFC107', REJECTED: '#FF4C4C' }[profile.approvalStatus] || '#FFC107';
  const statusIcon  = { APPROVED: 'shield-checkmark-outline', PENDING: 'time-outline', REJECTED: 'close-circle-outline' }[profile.approvalStatus] || 'time-outline';
  const statusLabel = { APPROVED: 'Verified Worker', PENDING: 'Pending Approval', REJECTED: 'Rejected' }[profile.approvalStatus] || 'Pending';

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Validation', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      await userAPI.updateProfile(workerId, { name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim() });
      Alert.alert('Success', 'Profile updated successfully.');
      setEditing(false); onProfileUpdated();
    } catch (e) { Alert.alert('Error', e.message || 'Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const PROFILE_ROWS_READONLY = [
    { icon: 'mail-outline',    label: 'Email',    value: profile.email },
    { icon: 'logo-whatsapp',   label: 'WhatsApp', value: profile.whatsapp || 'Not set' },
    { icon: 'card-outline',    label: 'CNIC',     value: profile.cnic    || 'N/A' },
    { icon: 'gift-outline',    label: 'DOB',      value: profile.dob     || 'Not set' },
  ];

  return (
    <ScrollView contentContainerStyle={$.profileScroll} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#1C1812', '#0F0D0A']} style={$.profileHero}>
        <LinearGradient colors={['#F5A62325', '#E8621A20']} style={$.profileAv}>
          <Text style={$.profileAvTxt}>{initials}</Text>
        </LinearGradient>
        <Text style={$.profileName}>{profile.name}</Text>
        <Text style={$.profileCat}>{profile.category}</Text>
        <View style={[$.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '50' }]}>
          <Ionicons name={statusIcon} size={13} color={statusColor} style={{ marginRight: 5 }} />
          <Text style={[$.statusBadgeTxt, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {profile.rating > 0 && (
          <View style={$.ratingRow}>
            <Ionicons name="star" size={16} color="#FFC107" style={{ marginRight: 4 }} />
            <Text style={$.profileRating}>{Number(profile.rating).toFixed(1)} Rating</Text>
          </View>
        )}
      </LinearGradient>

      <View style={$.editBtnRow}>
        {editing ? (
          <>
            <TouchableOpacity style={[$.editBtn, { backgroundColor: '#00E67614', borderColor: '#00E67640' }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              <Ionicons name="checkmark-outline" size={16} color="#00E676" style={{ marginRight: 5 }} />
              <Text style={[$.editBtnTxt, { color: '#00E676' }]}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[$.editBtn, { backgroundColor: '#FF4C4C14', borderColor: '#FF4C4C40', marginLeft: 10 }]}
              onPress={() => { setEditing(false); setForm({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '' }); }} activeOpacity={0.8}>
              <Ionicons name="close-outline" size={16} color="#FF4C4C" style={{ marginRight: 5 }} />
              <Text style={[$.editBtnTxt, { color: '#FF4C4C' }]}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[$.editBtn, { backgroundColor: '#F5A62314', borderColor: '#F5A62340' }]} onPress={() => setEditing(true)} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={16} color="#F5A623" style={{ marginRight: 5 }} />
            <Text style={[$.editBtnTxt, { color: '#F5A623' }]}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={$.profileCard}>
        {editing ? (
          [
            { icon: 'person-outline', label: 'NAME',  key: 'name',  keyboard: 'default' },
            { icon: 'call-outline',   label: 'PHONE', key: 'phone', keyboard: 'phone-pad' },
            { icon: 'map-outline',    label: 'CITY',  key: 'city',  keyboard: 'default' },
          ].map((row, i) => (
            <View key={i} style={$.profileRow}>
              <View style={$.profileRowIconBox}><Ionicons name={row.icon} size={18} color="#6B5D4F" /></View>
              <View style={{ flex: 1 }}>
                <Text style={$.profileRowLabel}>{row.label}</Text>
                <TextInput style={$.profileEditInput} value={form[row.key]} onChangeText={v => setForm(f => ({ ...f, [row.key]: v }))} placeholderTextColor="#6B5D4F" keyboardType={row.keyboard} />
              </View>
            </View>
          ))
        ) : (
          [
            { icon: 'person-outline', label: 'Name',  value: profile.name },
            { icon: 'call-outline',   label: 'Phone', value: profile.phone || 'Not set' },
            { icon: 'map-outline',    label: 'City',  value: profile.city  || 'Not set' },
          ].map((row, i) => (
            <View key={i} style={$.profileRow}>
              <View style={$.profileRowIconBox}><Ionicons name={row.icon} size={18} color="#6B5D4F" /></View>
              <View style={{ flex: 1 }}>
                <Text style={$.profileRowLabel}>{row.label.toUpperCase()}</Text>
                <Text style={$.profileRowValue}>{row.value}</Text>
              </View>
            </View>
          ))
        )}
        {PROFILE_ROWS_READONLY.map((row, i) => (
          <View key={'ro' + i} style={$.profileRow}>
            <View style={$.profileRowIconBox}><Ionicons name={row.icon} size={18} color="#6B5D4F" /></View>
            <View style={{ flex: 1 }}>
              <Text style={$.profileRowLabel}>{row.label.toUpperCase()}</Text>
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

  useEffect(() => { loadWorkerData(); }, []);
  useEffect(() => { if (!showIntro && workerId) loadTab(activeTab); }, [activeTab, showIntro, workerId]);

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
    } catch (e) { console.error('Failed to load tab:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const reloadProfile = async () => {
    if (!workerId) return;
    try { const data = await userAPI.getProfile(workerId); setProfile(data); } catch (e) {}
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadTab(activeTab); }, [activeTab, workerId]);

  const handleUpdateStatus = async (item, status) => {
    try {
      await bookingAPI.updateStatus(item.bookingId, status);
      const data = await bookingAPI.getByWorker(workerId);
      const all  = Array.isArray(data) ? data : [];
      setRequests(all.filter(b => b.status === 'PENDING'));
      setHistory(all.filter(b => b.status !== 'PENDING'));
    } catch (e) { Alert.alert('Error', e.message || 'Failed to update booking status.'); }
  };

  const handleAccept   = (item) => Alert.alert('Accept Booking', `Accept booking from ${item.customerName}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Accept', onPress: () => handleUpdateStatus(item, 'ACCEPTED') }]);
  const handleReject   = (item) => Alert.alert('Reject Booking', `Reject booking from ${item.customerName}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Reject', style: 'destructive', onPress: () => handleUpdateStatus(item, 'REJECTED') }]);
  const handleComplete = (item) => Alert.alert('Mark as Completed', `Mark booking #${item.bookingId} as completed?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Complete', onPress: () => handleUpdateStatus(item, 'COMPLETED') }]);
  const handleLogout   = () => Alert.alert('Logout', 'Are you sure you want to logout?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: async () => { await AsyncStorage.multiRemove(['userRole', 'userId', 'userName']); await updateUserRole(null); } }]);

  if (showIntro) return <WorkerIntro workerName={profile?.name} onDone={() => setShowIntro(false)} />;

  const pendingCount = requests.length;

  const renderContent = () => {
    if (loading && !refreshing && activeTab !== 'chats') {
      return <View style={$.emptyWrap}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={$.emptyTxt}>Loading...</Text></View>;
    }
    if (activeTab === 'profile') return <ProfileTab profile={profile} workerId={workerId} onProfileUpdated={reloadProfile} />;
    if (activeTab === 'chats')   return <ChatTab workerId={workerId} />;

    const data        = activeTab === 'requests' ? requests : history;
    const showActions = activeTab === 'requests';
    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.bookingId?.toString() ?? Math.random().toString()}
        contentContainerStyle={[$.list, data.length === 0 && $.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        ListHeaderComponent={
          <View style={$.listHeader}>
            <Text style={$.listTitle}>{activeTab === 'requests' ? 'Pending Requests' : 'Booking History'}</Text>
            <View style={$.listCount}><Text style={$.listCountTxt}>{data.length} total</Text></View>
          </View>
        }
        ListEmptyComponent={
          <View style={$.emptyWrap}>
            <Ionicons name={activeTab === 'requests' ? 'mail-open-outline' : 'clipboard-outline'} size={48} color="#6B5D4F" />
            <Text style={$.emptyTitle}>{activeTab === 'requests' ? 'No pending requests' : 'No booking history'}</Text>
            <Text style={$.emptyTxt}>Pull down to refresh</Text>
          </View>
        }
        renderItem={({ item }) => <BookingCard item={item} showActions={showActions} onAccept={handleAccept} onReject={handleReject} onComplete={handleComplete} />}
      />
    );
  };

  return (
    <View style={$.root}>
      <LinearGradient colors={['#0A0806', '#0A0806']} style={$.header}>
        <View style={$.hLeft}>
          <View style={$.hDot} />
          <View>
            <Text style={$.hTitle}>Worker Dashboard</Text>
            <Text style={$.hSub}>HunarHub</Text>
          </View>
        </View>
        <TouchableOpacity style={$.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={15} color="#FF4C4C" style={{ marginRight: 5 }} />
          <Text style={$.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={$.content}>{renderContent()}</View>

      <View style={$.nav}>
        {NAV.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={$.navItem} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
              {active && <LinearGradient colors={['#F5A62325', 'transparent']} style={$.navGlow} />}
              <View style={[$.navIconWrap, active && $.navIconWrapActive]}>
                <Ionicons name={tab.icon} size={22} color={active ? '#F5A623' : '#6B5D4F'} />
                {tab.key === 'requests' && pendingCount > 0 && (
                  <View style={$.navBadge}><Text style={$.navBadgeTxt}>{pendingCount}</Text></View>
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
  root: { flex: 1, backgroundColor: '#0F0D0A' },
  intro: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 999, backgroundColor: '#0A0806' },
  introRing:  { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1.5, borderColor: '#F5A62350' },
  introRing2: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  borderWidth: 1,   borderColor: '#F5A62380' },
  introGlow:  { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#F5A623', opacity: 0.06 },
  introIconWrap: { marginBottom: 16, alignItems: 'center' },
  introTitle: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', letterSpacing: 14, textAlign: 'center' },
  introLine:  { width: 120, height: 3, backgroundColor: '#F5A623', marginVertical: 12, borderRadius: 2 },
  introDash:  { fontSize: 22, fontWeight: '200', color: '#F5A623', letterSpacing: 10, textAlign: 'center' },
  introSub:   { fontSize: 13, color: '#3D3020', letterSpacing: 2, marginTop: 18, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: SIZES.extraLarge * 2, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#2E2820' },
  hLeft:  { flexDirection: 'row', alignItems: 'center' },
  hDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F5A623', marginRight: 12, shadowColor: '#F5A623', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 8 },
  hTitle: { fontSize: 20, fontWeight: '800', color: '#F5EFE6', letterSpacing: 0.3 },
  hSub:   { fontSize: 12, color: '#4A3D30', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: '#FF4C4C35', backgroundColor: '#FF4C4C10' },
  logoutTxt: { fontSize: 13, color: '#FF4C4C', fontWeight: '700' },
  content: { flex: 1 },
  list: { padding: 20, paddingBottom: 20 },
  listEmpty: { flex: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 20, fontWeight: '800', color: '#F5EFE6' },
  listCount: { backgroundColor: '#1C1812', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#2E2820' },
  listCountTxt: { fontSize: 12, color: '#6B5D4F', fontWeight: '600' },
  emptyWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F5EFE6', marginBottom: 6, marginTop: 12 },
  emptyTxt:   { fontSize: 14, color: '#4A3D30', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: '#1C1812', borderRadius: 20, borderWidth: 1, borderColor: '#2E2820', padding: 18, marginBottom: 14, overflow: 'hidden' },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardAv:   { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1.5, borderColor: '#F5A62330' },
  cardAvTxt:{ fontSize: 20, fontWeight: '800', color: '#F5A623' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#F5EFE6', marginBottom: 3 },
  cardSubRow:{ flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  cardSub:  { fontSize: 13, color: '#6B5D4F' },
  badge:    { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  detRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detVal:   { fontSize: 13, color: '#6B5D4F', flex: 1 },
  cardActs: { flexDirection: 'row', marginTop: 14, borderTopWidth: 1, borderTopColor: '#2E2820', paddingTop: 14, gap: 10 },
  actBtn:   { flex: 1, flexDirection: 'row', paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actTxt:   { fontSize: 14, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12, backgroundColor: '#1C1812', borderBottomWidth: 1, borderBottomColor: '#2E2820' },
  chatBack:   { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  chatBackTxt:{ color: '#F5A623', fontSize: 15, fontWeight: '700', marginLeft: 2 },
  chatAv:     { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#F5A62330' },
  chatAvTxt:  { fontSize: 16, fontWeight: '800', color: '#F5A623' },
  chatHeaderName: { fontSize: 17, fontWeight: '700', color: '#F5EFE6', flex: 1 },
  msgList:    { padding: 16, paddingBottom: 8 },
  bubble:     { maxWidth: '78%', padding: 12, borderRadius: 18, marginBottom: 8 },
  bubbleMe:   { alignSelf: 'flex-end',   backgroundColor: '#F5A623', borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#1C1812', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#2E2820' },
  bubbleTxt:  { fontSize: 14, color: '#F5EFE6' },
  bubbleTxtMe:{ color: '#0F0D0A', fontWeight: '600' },
  bubbleTime: { fontSize: 10, color: '#6B5D4F', alignSelf: 'flex-end', marginTop: 4 },
  msgInputRow:{ flexDirection: 'row', padding: 12, backgroundColor: '#1C1812', borderTopWidth: 1, borderTopColor: '#2E2820', alignItems: 'flex-end' },
  msgInput:   { flex: 1, backgroundColor: '#0F0D0A', color: '#F5EFE6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#2E2820', marginRight: 10, maxHeight: 100, fontSize: 14 },
  msgSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5A623', justifyContent: 'center', alignItems: 'center' },
  convCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1812', borderRadius: 16, borderWidth: 1, borderColor: '#2E2820', padding: 14, marginBottom: 10 },
  convAv:     { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#F5A62330' },
  convAvTxt:  { fontSize: 18, fontWeight: '800', color: '#F5A623' },
  convName:   { fontSize: 15, fontWeight: '700', color: '#F5EFE6', marginBottom: 3 },
  convSub:    { fontSize: 12, color: '#6B5D4F' },
  profileScroll: { paddingBottom: 20 },
  profileHero:   { alignItems: 'center', paddingVertical: SIZES.extraLarge + 8, borderBottomWidth: 1, borderBottomColor: '#2A2018' },
  profileAv:     { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.small, borderWidth: 2, borderColor: '#F5A62340' },
  profileAvTxt:  { fontSize: 34, fontWeight: '800', color: '#F5A623' },
  profileName:   { fontSize: 22, fontWeight: '800', color: '#F5EFE6', marginBottom: 4 },
  profileCat:    { fontSize: 16, color: '#F5A623', marginBottom: 10 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 8 },
  statusBadgeTxt:{ fontSize: 13, fontWeight: '700' },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  profileRating: { fontSize: 16, color: '#FFC107', fontWeight: 'bold' },
  editBtnRow:    { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  editBtn:       { flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtnTxt:    { fontSize: 14, fontWeight: '700' },
  profileCard:   { backgroundColor: '#1C1812', marginHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#2E2820', overflow: 'hidden' },
  profileRow:    { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2E2820' },
  profileRowIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2E2820', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileRowLabel:   { fontSize: 11, color: '#6B5D4F', fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  profileRowValue:   { fontSize: 15, color: '#F5EFE6', fontWeight: '500' },
  profileEditInput:  { fontSize: 15, color: '#F5EFE6', fontWeight: '500', borderBottomWidth: 1, borderBottomColor: '#F5A62340', paddingVertical: 4, paddingHorizontal: 2 },
  nav:              { flexDirection: 'row', backgroundColor: '#0F0D0A', borderTopWidth: 1, borderTopColor: '#2E2820', paddingBottom: 8, paddingTop: 4 },
  navItem:          { flex: 1, alignItems: 'center', paddingVertical: 8, position: 'relative', overflow: 'hidden' },
  navGlow:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  navIconWrap:      { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  navIconWrapActive:{ backgroundColor: '#F5A62315', borderWidth: 1, borderColor: '#F5A62325' },
  navBadge:         { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF4C4C', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  navBadgeTxt:      { color: '#FFF', fontSize: 9, fontWeight: '800' },
  navLbl:           { fontSize: 11, color: '#6B5D4F', fontWeight: '600', marginTop: 3 },
  navLblActive:     { color: '#F5A623', fontWeight: '700' },
  navLine:          { position: 'absolute', bottom: 0, width: 28, height: 2.5, backgroundColor: '#F5A623', borderRadius: 2 },
});

export default WorkerDashboard;
