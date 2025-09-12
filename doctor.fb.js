// Minimal Firebase glue for Doctor Portal (ES module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where, setDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6gvn7RRTxlFLN9kqMzrn3hS26b9vCMYM",
  authDomain: "ayursutra-f90d2.firebaseapp.com",
  projectId: "ayursutra-f90d2",
  storageBucket: "ayursutra-f90d2.appspot.com",
  messagingSenderId: "1014791978312",
  appId: "1:1014791978312:web:938b6861c94f0a3a81477d",
  measurementId: "G-Y0CDSS5NWD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

async function getUserEmailById(uid){
  try {
    const s = await getDoc(doc(db, 'users', uid));
    return s.exists() ? (s.data().email || '') : '';
  } catch { return ''; }
}

async function getUserNameById(uid){
  try {
    const s = await getDoc(doc(db, 'users', uid));
    return s.exists() ? (s.data().name || s.data().email || '') : '';
  } catch { return ''; }
}

// Subscribe to all appointments (doctor view). Optionally filter status.
function subscribeAppointments(callback, statusFilter = null){
  const setup = (uid) => {
    if (!uid) return () => {};
    const qRef = query(
      collection(db, 'appointments'),
      where('doctorId', '==', uid),
      orderBy('date', 'desc')
    );
    return onSnapshot(qRef, async snap => {
      const items = [];
      for (const d of snap.docs) {
        const appt = { id: d.id, ...d.data() };
        if (statusFilter && appt.status !== statusFilter) continue;
        const patientName = appt.userId ? await getUserNameById(appt.userId) : '';
        const patientEmail = appt.userId ? await getUserEmailById(appt.userId) : '';
        items.push({ ...appt, patientName, patientEmail });
      }
      callback(items);
    });
  };
  if (auth.currentUser) {
    return setup(auth.currentUser.uid);
  }
  let unsub = () => {};
  const off = onAuthStateChanged(auth, (u) => {
    off();
    unsub = setup(u?.uid);
  });
  return () => { try { off(); } catch(_){} try { unsub(); } catch(_){} };
}

async function updateAppointment(apptId, patch){
  await updateDoc(doc(db,'appointments', apptId), patch);
}

async function uploadProfilePhoto(uid, file){
  const r = ref(storage, `doctorProfiles/${uid}.jpg`);
  await uploadBytes(r, file, { contentType: file.type || 'image/jpeg' });
  return await getDownloadURL(r);
}

async function saveDoctorProfile(uid, data){
  const refDoc = doc(db, 'doctorProfiles', uid);
  const existing = await getDoc(refDoc);
  if (existing.exists()) {
    await setDoc(refDoc, { ...existing.data(), ...data }, { merge: true });
  } else {
    await setDoc(refDoc, { ...data }, { merge: true });
  }
}

async function getDoctorProfile(uid){
  const s = await getDoc(doc(db, 'doctorProfiles', uid));
  return s.exists() ? s.data() : null;
}

// expose minimal API
window.DoctorFB = {
  auth,
  db,
  subscribeAppointments,
  updateAppointment,
  uploadProfilePhoto,
  saveDoctorProfile,
  getDoctorProfile
};

// Keep a reference so other scripts can wait for auth user if needed
onAuthStateChanged(auth, () => {});


