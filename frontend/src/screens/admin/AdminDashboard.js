import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView,
  Modal, Animated, Dimensions, StatusBar, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');

const NAV = [
  { key: 'overview',  label: 'Overview',  icon: 'grid-outline' },
  { key: 'pending',   label: 'Pending',   icon: 'hourglass-outline' },
  { key: 'workers',   label: 'Workers',   icon: 'construct-outline' },
  { key: 'customers', label: 'Customers', icon: 'people-outline' },
  { key: 'bookings',  label: 'Bookings',  icon: 'clipboard-outline' },
];

const CAT_ICONS = {
  Plumber:'build-outline', Electrician:'flash-outline', Painter:'color-palette-outline',
  'AC Repair':'snow-outline', Carpenter:'hammer-outline', Mechanic:'settings-outline',
  Welder:'flame-outline', Qasai:'restaurant-outline',
};
const TYPE_COLOR   = { URGENT:'#FF4C4C', ADVANCE:'#FFC107', NORMAL:'#00D2FF' };
const STATUS_COLOR = { APPROVED:'#00E676', REJECTED:'#FF4C4C', PENDING:'#FFC107',
                       ACCEPTED:'#00E676', COMPLETED:'#3A7BD5' };

// ─── Dark Modal ───────────────────────────────────────────────────────────────
const DarkModal = ({ visible, title, message, iconName, iconColor, actions, onClose }) => {
  const scale   = useRef(new Animated.Value(0.82)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1,    useNativeDriver: true, tension: 130, friction: 8 }),
        Animated.timing(opacity, { toValue: 1,    duration: 160, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale,   { toValue: 0.82, duration: 130, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,    duration: 130, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[$.mOverlay, { opacity }]}>
        <Animated.View style={[$.mBox, { transform: [{ scale }] }]}>
          <LinearGradient colors={[iconColor + '30', 'transparent']} style={$.mGlow} />
          <View style={[$.mIconRing, { borderColor: iconColor + '60', backgroundColor: iconColor + '15' }]}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>
          <Text style={$.mTitle}>{title}</Text>
          <Text style={$.mMsg}>{message}</Text>
          <View style={$.mBtns}>
            {actions.map((a, i) => (
              <TouchableOpacity key={i} style={[$.mBtn, { borderColor: a.color + '60', backgroundColor: a.color + '15' }]} onPress={a.onPress} activeOpacity={0.8}>
                <Text style={[$.mBtnTxt, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Portal Entry ─────────────────────────────────────────────────────────────
const PortalEntry = ({ onDone }) => {
  const r1 = useRef(new Animated.Value(0)).current;
  const r2 = useRef(new Animated.Value(0)).current;
  const r3 = useRef(new Animated.Value(0)).current;
  const t1o = useRef(new Animated.Value(0)).current;
  const t1y = useRef(new Animated.Value(30)).current;
  const t2o = useRef(new Animated.Value(0)).current;
  const t2y = useRef(new Animated.Value(20)).current;
  const sub = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(r1, { toValue: 1, useNativeDriver: true, tension: 45, friction: 9 }),
        Animated.spring(r2, { toValue: 1, useNativeDriver: true, tension: 40, friction: 9 }),
        Animated.spring(r3, { toValue: 1, useNativeDriver: true, tension: 35, friction: 9 }),
      ]),
      Animated.parallel([
        Animated.timing(t1o, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(t1y, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }),
      ]),
      Animated.parallel([
        Animated.timing(t2o, { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.spring(t2y, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }),
      ]),
      Animated.timing(sub, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(1100),
      Animated.timing(out, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View style={[$.pWrap, { opacity: out }]}>
      <LinearGradient colors={['#010608', '#030D18', '#060F1C']} style={StyleSheet.absoluteFill} />
      {/* Rings */}
      <Animated.View style={[$.pRing, { width: 420, height: 420, borderRadius: 210, borderColor: '#00D2FF18', transform: [{ scale: r3 }] }]} />
      <Animated.View style={[$.pRing, { width: 300, height: 300, borderRadius: 150, borderColor: '#00D2FF35', transform: [{ scale: r2 }] }]} />
      <Animated.View style={[$.pRing, { width: 190, height: 190, borderRadius: 95,  borderColor: '#00D2FF70', borderWidth: 1.5, transform: [{ scale: r1 }] }]} />
      {/* Center glow */}
      <View style={$.pGlow} />
      {/* Text */}
      <View style={$.pCenter}>
        <Animated.Text style={[$.pAdmin,  { opacity: t1o, transform: [{ translateY: t1y }] }]}>ADMIN</Animated.Text>
        <View style={$.pLine} />
        <Animated.Text style={[$.pPortal, { opacity: t2o, transform: [{ translateY: t2y }] }]}>PORTAL</Animated.Text>
        <Animated.Text style={[$.pSub,    { opacity: sub }]}>HunarHub  ·  Management  System</Animated.Text>
      </View>
    </Animated.View>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ iconName, label, value, color, onPress }) => (
  <TouchableOpacity style={[$.sc, { borderColor: color + '28' }]} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient colors={[color + '20', 'transparent']} style={$.scGlow} />
    <View style={[$.scIcon, { backgroundColor: color + '18', borderColor: color + '30' }]}>
      <Ionicons name={iconName} size={26} color={color} />
    </View>
    <Text style={[$.scVal, { color }]}>{value ?? '—'}</Text>
    <Text style={$.scLbl}>{label}</Text>
  </TouchableOpacity>
);

// ─── Worker Card ──────────────────────────────────────────────────────────────
const WorkerCard = ({ item, onApprove, onReject, onDelete }) => {
  const sc = STATUS_COLOR[item.approvalStatus] || '#FFC107';
  const catIcon = CAT_ICONS[item.category] || 'construct-outline';
  return (
    <View style={$.card}>
      <LinearGradient colors={[sc + '10', 'transparent']} style={$.cardGlow} />
      <View style={$.cardHead}>
        <LinearGradient colors={['#00D2FF25', '#3A7BD520']} style={$.cardAv}>
          <Text style={$.cardAvTxt}>{item.name?.charAt(0).toUpperCase() || 'W'}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={$.cardName}>{item.name}</Text>
          <View style={$.cardSubRow}>
            <Ionicons name={catIcon} size={12} color="#3A5568" style={{ marginRight: 4 }} />
            <Text style={$.cardSub}>{item.category || 'N/A'}</Text>
          </View>
          <View style={$.cardSubRow}>
            <Ionicons name="location-outline" size={12} color="#3A5568" style={{ marginRight: 4 }} />
            <Text style={$.cardSub}>{item.city || 'N/A'}</Text>
          </View>
        </View>
        <View style={[$.badge, { backgroundColor: sc + '18', borderColor: sc + '50' }]}>
          <Text style={[$.badgeTxt, { color: sc }]}>{item.approvalStatus}</Text>
        </View>
      </View>
      <View style={$.cardDet}>
        <View style={$.detRow}><Ionicons name="mail-outline"  size={14} color="#3A5568" style={{ marginRight: 8 }} /><Text style={$.detVal}>{item.email}</Text></View>
        <View style={$.detRow}><Ionicons name="call-outline"  size={14} color="#3A5568" style={{ marginRight: 8 }} /><Text style={$.detVal}>{item.phone || 'N/A'}</Text></View>
        <View style={$.detRow}><Ionicons name="card-outline"  size={14} color="#3A5568" style={{ marginRight: 8 }} /><Text style={$.detVal}>{item.cnic}</Text></View>
        {item.whatsapp ? <View style={$.detRow}><Ionicons name="logo-whatsapp" size={14} color="#3A5568" style={{ marginRight: 8 }} /><Text style={$.detVal}>{item.whatsapp}</Text></View> : null}
      </View>
      <View style={$.cardActs}>
        {item.approvalStatus !== 'APPROVED' && (
          <TouchableOpacity style={[$.actBtn, { backgroundColor: '#00E67614', borderColor: '#00E67640' }]} onPress={() => onApprove(item)} activeOpacity={0.8}>
            <Ionicons name="checkmark-outline" size={15} color="#00E676" style={{ marginRight: 4 }} />
            <Text style={[$.actTxt, { color: '#00E676' }]}>Approve</Text>
          </TouchableOpacity>
        )}
        {item.approvalStatus !== 'REJECTED' && (
          <TouchableOpacity style={[$.actBtn, { backgroundColor: '#FF4C4C14', borderColor: '#FF4C4C40' }]} onPress={() => onReject(item)} activeOpacity={0.8}>
            <Ionicons name="close-outline" size={15} color="#FF4C4C" style={{ marginRight: 4 }} />
            <Text style={[$.actTxt, { color: '#FF4C4C' }]}>Reject</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[$.actBtn, { backgroundColor: '#ffffff08', borderColor: '#162535', flex: 0, paddingHorizontal: 18 }]} onPress={() => onDelete(item)} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={15} color="#4A6070" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Customer Card ────────────────────────────────────────────────────────────
const CustomerCard = ({ item, onDelete }) => (
  <View style={$.card}>
    <View style={$.cardHead}>
      <LinearGradient colors={['#3A7BD525', '#00D2FF18']} style={$.cardAv}>
        <Text style={$.cardAvTxt}>{item.name?.charAt(0).toUpperCase() || 'C'}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={$.cardName}>{item.name || 'Unknown'}</Text>
        <View style={$.cardSubRow}>
          <Ionicons name="location-outline" size={12} color="#3A5568" style={{ marginRight: 4 }} />
          <Text style={$.cardSub}>{item.city || 'N/A'}</Text>
        </View>
      </View>
      <TouchableOpacity style={[$.actBtn, { backgroundColor: '#FF4C4C10', borderColor: '#FF4C4C35', flex: 0, paddingHorizontal: 14 }]} onPress={() => onDelete(item)} activeOpacity={0.8}>
        <Ionicons name="trash-outline" size={15} color="#FF4C4C" />
      </TouchableOpacity>
    </View>
    <View style={$.cardDet}>
      <View style={$.detRow}><Ionicons name="mail-outline" size={14} color="#3A5568" style={{ marginRight: 8 }} /><Text style={$.detVal}>{item.email}</Text></View>
      <View style={$.detRow}><Ionicons name="call-outline" size={14} color="#3A5568" style={{ marginRight: 8 }} /><Text style={$.detVal}>{item.phone || 'N/A'}</Text></View>
      {item.dob ? <View style={$.detRow}><Ionicons name="gift-outline" size={14} color="#3A5568" style={{ marginRight: 8 }} /><Text style={$.detVal}>{item.dob}</Text></View> : null}
    </View>
  </View>
);

// ─── Booking Card ─────────────────────────────────────────────────────────────
const BookingCard = ({ item }) => {
  if (!item) return null;
  const type   = item.type   || 'NORMAL';
  const status = item.status || 'PENDING';
  const tc = TYPE_COLOR[type]     || '#00D2FF';
  const sc = STATUS_COLOR[status] || '#FFC107';
  const catIcon = CAT_ICONS[item.category] || 'clipboard-outline';
  return (
    <View style={$.card}>
      <LinearGradient colors={[tc + '10', 'transparent']} style={$.cardGlow} />
      <View style={$.cardHead}>
        <View style={[$.bkBox, { backgroundColor: tc + '18', borderColor: tc + '35' }]}>
          <Ionicons name={catIcon} size={22} color={tc} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={$.cardName}>{item.customerName || 'Unknown Customer'}</Text>
          <Text style={$.cardSub}>Worker: {item.workerName || 'N/A'}</Text>
          <Text style={$.cardSub}>{item.category || 'N/A'}{item.workerCity ? '  ·  ' + item.workerCity : ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[$.badge, { backgroundColor: tc + '18', borderColor: tc + '50', marginBottom: 5 }]}>
            <Text style={[$.badgeTxt, { color: tc }]}>{type}</Text>
          </View>
          <View style={[$.badge, { backgroundColor: sc + '18', borderColor: sc + '50' }]}>
            <Text style={[$.badgeTxt, { color: sc }]}>{status}</Text>
          </View>
        </View>
      </View>
      <View style={$.cardDet}>
        <View style={$.detRow}>
          <Ionicons name="calendar-outline" size={14} color="#3A5568" style={{ marginRight: 8 }} />
          <Text style={$.detVal}>{item.bookingDate ? String(item.bookingDate).replace('T','  ').slice(0,17) : 'N/A'}</Text>
        </View>
        <View style={$.detRow}>
          <Ionicons name="receipt-outline" size={14} color="#3A5568" style={{ marginRight: 8 }} />
          <Text style={$.detVal}>Booking ID: {item.bookingId || 'N/A'}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [showPortal, setShowPortal] = useState(true);
  const [activeTab, setActiveTab]   = useState('overview');
  const [stats, setStats]           = useState(null);
  const [pending, setPending]       = useState([]);
  const [workers, setWorkers]       = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]           = useState(null);
  const { updateUserRole }          = useAuth();

  useEffect(() => { if (!showPortal) loadTab(activeTab); }, [activeTab, showPortal]);

  const loadTab = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const s = await adminAPI.getStats(); setStats(s);
        const b = await adminAPI.getAllBookings(); setBookings(Array.isArray(b) ? b : []);
      } else if (tab === 'pending') {
        const d = await adminAPI.getPendingWorkers(); setPending(Array.isArray(d) ? d : []);
      } else if (tab === 'workers') {
        const d = await adminAPI.getAllWorkers(); setWorkers(Array.isArray(d) ? d : []);
      } else if (tab === 'customers') {
        const d = await adminAPI.getAllCustomers(); setCustomers(Array.isArray(d) ? d : []);
      } else if (tab === 'bookings') {
        const d = await adminAPI.getAllBookings(); setBookings(Array.isArray(d) ? d : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadTab(activeTab); }, [activeTab]);
  const showModal = (cfg) => setModal(cfg);
  const closeModal = () => setModal(null);

  const handleApprove = (item) => showModal({
    iconName: 'shield-checkmark-outline', iconColor: '#00E676', title: 'Approve Worker',
    message: `Approve ${item.name} as a verified HunarHub worker?`,
    actions: [
      { label: 'Cancel',  color: '#4A6070', onPress: closeModal },
      { label: 'Approve', color: '#00E676', onPress: async () => {
        closeModal();
        try {
          await adminAPI.approveWorker(item.workerId, 'APPROVED');
          showModal({ iconName: 'checkmark-circle-outline', iconColor: '#00E676', title: 'Approved',
            message: `${item.name} is now a verified worker.`,
            actions: [{ label: 'Done', color: '#00E676', onPress: () => { closeModal(); loadTab(activeTab); } }] });
        } catch (e) { showModal({ iconName: 'warning-outline', iconColor: '#FFC107', title: 'Error', message: e.message, actions: [{ label: 'OK', color: '#FFC107', onPress: closeModal }] }); }
      }},
    ],
  });

  const handleReject = (item) => showModal({
    iconName: 'close-circle-outline', iconColor: '#FF4C4C', title: 'Reject Worker',
    message: `Reject ${item.name}'s application? They won't appear on the platform.`,
    actions: [
      { label: 'Cancel', color: '#4A6070', onPress: closeModal },
      { label: 'Reject', color: '#FF4C4C', onPress: async () => {
        closeModal();
        try {
          await adminAPI.approveWorker(item.workerId, 'REJECTED');
          showModal({ iconName: 'close-circle-outline', iconColor: '#FF4C4C', title: 'Rejected',
            message: `${item.name} has been rejected.`,
            actions: [{ label: 'Done', color: '#FF4C4C', onPress: () => { closeModal(); loadTab(activeTab); } }] });
        } catch (e) { showModal({ iconName: 'warning-outline', iconColor: '#FFC107', title: 'Error', message: e.message, actions: [{ label: 'OK', color: '#FFC107', onPress: closeModal }] }); }
      }},
    ],
  });

  const handleDelete = (item) => showModal({
    iconName: 'trash-outline', iconColor: '#FF4C4C', title: 'Delete User',
    message: `Permanently delete ${item.name}? This cannot be undone.`,
    actions: [
      { label: 'Cancel', color: '#4A6070', onPress: closeModal },
      { label: 'Delete', color: '#FF4C4C', onPress: async () => {
        closeModal();
        try {
          await adminAPI.deleteUser(item.id);
          showModal({ iconName: 'checkmark-circle-outline', iconColor: '#00E676', title: 'Deleted',
            message: `${item.name} has been removed.`,
            actions: [{ label: 'Done', color: '#00E676', onPress: () => { closeModal(); loadTab(activeTab); } }] });
        } catch (e) { showModal({ iconName: 'warning-outline', iconColor: '#FFC107', title: 'Error', message: e.message, actions: [{ label: 'OK', color: '#FFC107', onPress: closeModal }] }); }
      }},
    ],
  });

  const handleLogout = () => showModal({
    iconName: 'log-out-outline', iconColor: '#00D2FF', title: 'Logout',
    message: 'Are you sure you want to logout from the Admin Portal?',
    actions: [
      { label: 'Cancel', color: '#4A6070', onPress: closeModal },
      { label: 'Logout', color: '#00D2FF', onPress: async () => {
        closeModal();
        await AsyncStorage.multiRemove(['userRole', 'userId']);
        await updateUserRole(null);
      }},
    ],
  });

  // ── Overview ──────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <ScrollView
      contentContainerStyle={$.ovScroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D2FF" colors={['#00D2FF']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Banner */}
      <LinearGradient colors={['#0A1E32', '#0C2540']} style={$.banner}>
        <LinearGradient colors={['#00D2FF15', 'transparent']} style={StyleSheet.absoluteFill} />
        <View style={$.bannerDot} />
        <View>
          <Text style={$.bannerTitle}>Welcome back, Admin</Text>
          <Text style={$.bannerSub}>HunarHub platform at a glance</Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <Text style={$.secLabel}>PLATFORM STATS</Text>
      <View style={$.statsRow}>
        <StatCard iconName="hourglass-outline" label="PENDING"   value={stats?.pendingWorkers}  color="#FFC107" onPress={() => setActiveTab('pending')} />
        <StatCard iconName="shield-checkmark-outline" label="APPROVED" value={stats?.approvedWorkers} color="#00E676" onPress={() => setActiveTab('workers')} />
      </View>
      <View style={$.statsRow}>
        <StatCard iconName="people-outline"    label="CUSTOMERS" value={stats?.totalCustomers}  color="#00D2FF" onPress={() => setActiveTab('customers')} />
        <StatCard iconName="clipboard-outline" label="BOOKINGS"  value={stats?.totalBookings}   color="#3A7BD5" onPress={() => {}} />
      </View>

      {/* Recent Bookings */}
      <Text style={$.secLabel}>RECENT BOOKINGS</Text>
      {bookings.length === 0 ? (
        <View style={$.emptyInline}>
          <Text style={$.emptyInlineTxt}>No bookings yet</Text>
        </View>
      ) : (
        bookings.slice(0, 5).map(item => <BookingCard key={item.bookingId} item={item} />)
      )}
    </ScrollView>
  );

  // ── List tabs ─────────────────────────────────────────────────────────────
  const renderList = () => {
    const isBookings = activeTab === 'bookings';
    const data = activeTab === 'pending' ? pending
               : activeTab === 'workers' ? workers
               : activeTab === 'customers' ? customers
               : bookings;
    const titles = { pending: 'Pending Approvals', workers: 'All Workers', customers: 'All Customers', bookings: 'All Bookings' };
    return (
      <FlatList
        data={data}
        keyExtractor={item => (item.bookingId || item.id)?.toString() ?? Math.random().toString()}
        contentContainerStyle={[$.list, data.length === 0 && $.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D2FF" colors={['#00D2FF']} />}
        ListHeaderComponent={
          <View style={$.listHeader}>
            <Text style={$.listTitle}>{titles[activeTab]}</Text>
            <View style={$.listCount}>
              <Text style={$.listCountTxt}>{data.length} total</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={$.empty}>
            <Ionicons
              name={activeTab === 'customers' ? 'people-outline' : activeTab === 'bookings' ? 'clipboard-outline' : 'construct-outline'}
              size={48} color="#3A5568"
            />
            <Text style={$.emptyTitle}>Nothing here yet</Text>
            <Text style={$.emptySub}>Pull down to refresh</Text>
          </View>
        }
        renderItem={({ item }) =>
          activeTab === 'customers' ? <CustomerCard item={item} onDelete={handleDelete} />
          : activeTab === 'bookings' ? <BookingCard item={item} />
          : <WorkerCard item={item} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} />
        }
      />
    );
  };

  if (showPortal) return <PortalEntry onDone={() => setShowPortal(false)} />;

  return (
    <View style={$.root}>
      <StatusBar barStyle="light-content" backgroundColor="#020810" />

      {/* ── Header ── */}
      <LinearGradient colors={['#020810', '#040D1A']} style={$.header}>
        <View style={$.hLeft}>
          <View style={$.hDot} />
          <View>
            <Text style={$.hTitle}>Admin Portal</Text>
            <Text style={$.hSub}>HunarHub Management</Text>
          </View>
        </View>
        <TouchableOpacity style={$.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={15} color="#FF4C4C" style={{ marginRight: 5 }} />
          <Text style={$.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Content ── */}
      <View style={$.content}>
        {loading && !refreshing ? (
          <View style={$.empty}>
            <ActivityIndicator size="large" color="#00D2FF" />
            <Text style={$.emptySub}>Loading...</Text>
          </View>
        ) : activeTab === 'overview' ? renderOverview() : renderList()}
      </View>

      {/* ── Bottom Nav ── */}
      <View style={$.nav}>
        {NAV.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={$.navItem} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
              {active && <LinearGradient colors={['#00D2FF25', 'transparent']} style={$.navActiveGlow} />}
              <View style={[$.navIconWrap, active && $.navIconWrapActive]}>
                <Ionicons name={tab.icon} size={22} color={active ? '#00D2FF' : '#2A3D50'} />
                {tab.key === 'pending' && pending.length > 0 && (
                  <View style={$.navBadge}><Text style={$.navBadgeTxt}>{pending.length}</Text></View>
                )}
              </View>
              <Text style={[$.navLbl, active && $.navLblActive]}>{tab.label}</Text>
              {active && <View style={$.navActiveLine} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {modal && (
        <DarkModal visible={!!modal} title={modal.title} message={modal.message}
          iconName={modal.iconName} iconColor={modal.iconColor} actions={modal.actions} onClose={closeModal} />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const $ = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060E18' },

  // Modal
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center' },
  mBox: {
    width: width * 0.88, backgroundColor: '#0B1520',
    borderRadius: 24, borderWidth: 1, borderColor: '#1C3448',
    padding: 28, alignItems: 'center', overflow: 'hidden',
  },
  mGlow:    { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  mIconRing:{ width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  mTitle:   { fontSize: 22, fontWeight: '800', color: '#EEF6FF', marginBottom: 8, textAlign: 'center' },
  mMsg:     { fontSize: 15, color: '#5A7A90', textAlign: 'center', lineHeight: 23, marginBottom: 24 },
  mBtns:    { flexDirection: 'row', gap: 12, width: '100%' },
  mBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  mBtnTxt:  { fontWeight: '700', fontSize: 15 },

  // Portal
  pWrap:   { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 999, backgroundColor: '#010608' },
  pRing:   { position: 'absolute', borderWidth: 1 },
  pGlow:   { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#00D2FF', opacity: 0.06 },
  pCenter: { alignItems: 'center' },
  pAdmin:  { fontSize: 54, fontWeight: '900', color: '#FFFFFF', letterSpacing: 18, textAlign: 'center' },
  pLine:   { width: 140, height: 3, backgroundColor: '#00D2FF', marginVertical: 14, borderRadius: 2 },
  pPortal: { fontSize: 28, fontWeight: '200', color: '#00D2FF', letterSpacing: 14, textAlign: 'center' },
  pSub:    { fontSize: 11, color: '#1E3040', letterSpacing: 2.5, marginTop: 22, textAlign: 'center' },

  // Stat card
  sc:     { flex: 1, backgroundColor: '#0B1825', borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center', overflow: 'hidden' },
  scGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  scIcon: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  scVal:  { fontSize: 36, fontWeight: '800', marginBottom: 4 },
  scLbl:  { fontSize: 11, color: '#3A5568', fontWeight: '700', letterSpacing: 1 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: SIZES.extraLarge * 2, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#0C1E2E',
  },
  hLeft:  { flexDirection: 'row', alignItems: 'center' },
  hDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00D2FF', marginRight: 12,
             shadowColor: '#00D2FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 8 },
  hTitle: { fontSize: 20, fontWeight: '800', color: '#D8EAF8', letterSpacing: 0.3 },
  hSub:   { fontSize: 12, color: '#243545', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: '#FF4C4C35', backgroundColor: '#FF4C4C10' },
  logoutTxt: { fontSize: 13, color: '#FF4C4C', fontWeight: '700' },

  content: { flex: 1 },

  // Overview
  ovScroll: { padding: 20, paddingBottom: 20 },
  banner: {
    borderRadius: 20, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#0C2540', overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
  },
  bannerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00D2FF', marginRight: 14,
               shadowColor: '#00D2FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#D8EAF8', marginBottom: 4 },
  bannerSub:   { fontSize: 13, color: '#2A3D50' },
  secLabel: { fontSize: 11, color: '#243545', fontWeight: '800', letterSpacing: 2, marginBottom: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },

  emptyInline: { backgroundColor: '#0B1825', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#162535', marginBottom: 12 },
  emptyInlineTxt: { fontSize: 14, color: '#2A3D50' },

  // List
  list:      { padding: 20, paddingBottom: 20 },
  listEmpty: { flex: 1 },
  listHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 20, fontWeight: '800', color: '#D8EAF8' },
  listCount: { backgroundColor: '#0B1825', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#162535' },
  listCountTxt: { fontSize: 12, color: '#3A5568', fontWeight: '600' },

  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#C0D8EC', marginBottom: 6, marginTop: 12 },
  emptySub:   { fontSize: 14, color: '#243545', marginTop: 8 },

  // Cards
  card: {
    backgroundColor: '#0B1825', borderRadius: 20, borderWidth: 1, borderColor: '#162535',
    padding: 18, marginBottom: 14, overflow: 'hidden',
  },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardAv: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14, borderWidth: 1.5, borderColor: '#00D2FF30',
  },
  cardAvTxt: { fontSize: 22, fontWeight: '800', color: '#00D2FF' },
  bkBox:     { width: 54, height: 54, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardName:  { fontSize: 16, fontWeight: '700', color: '#D8EAF8', marginBottom: 3 },
  cardSub:   { fontSize: 13, color: '#3A5568', marginTop: 2 },
  cardSubRow:{ flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  badge:     { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:  { fontSize: 11, fontWeight: '700' },
  cardDet:   { borderTopWidth: 1, borderTopColor: '#162535', paddingTop: 14, gap: 8 },
  detRow:    { flexDirection: 'row', alignItems: 'center' },
  detVal:    { fontSize: 13, color: '#3A5568', flex: 1 },
  cardActs:  { flexDirection: 'row', marginTop: 14, borderTopWidth: 1, borderTopColor: '#162535', paddingTop: 14, gap: 10 },
  actBtn:    { flex: 1, flexDirection: 'row', paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actTxt:    { fontSize: 14, fontWeight: '700' },

  // Bottom Nav
  nav: {
    flexDirection: 'row',
    backgroundColor: '#070E18',
    borderTopWidth: 1, borderTopColor: '#0C1E2E',
    paddingBottom: 8, paddingTop: 4,
  },
  navItem:        { flex: 1, alignItems: 'center', paddingVertical: 8, position: 'relative', overflow: 'hidden' },
  navActiveGlow:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  navIconWrap:    { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  navIconWrapActive: { backgroundColor: '#00D2FF15', borderWidth: 1, borderColor: '#00D2FF25' },
  navBadge:       { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF4C4C', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  navBadgeTxt:    { color: '#FFF', fontSize: 9, fontWeight: '800' },
  navLbl:         { fontSize: 11, color: '#2A3D50', fontWeight: '600', marginTop: 3 },
  navLblActive:   { color: '#00D2FF', fontWeight: '700' },
  navActiveLine:  { position: 'absolute', bottom: 0, width: 28, height: 2.5, backgroundColor: '#00D2FF', borderRadius: 2 },
});

export default AdminDashboard;
