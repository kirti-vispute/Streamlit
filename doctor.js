/* doctor.js — ensure at least 3 demo appointments exist and keep app features working
   - Defensive: avoids errors if optional elements are missing
   - Preserves existing stored appointments; only adds demo ones if there are fewer than 3
*/

const STORAGE = {
  PROFILE: "doc_profile_v1",
  TREATMENTS: "doc_treatments_v1",
  APPTS: "doc_appts_v1",
  PATIENTS: "doc_patients_v1",
  CASES: "doc_cases_v1",
  FEEDBACK: "doc_feedback_v1",
  INCIDENTS: "doc_incidents_v1",
  PROGRESS: "doc_progress_v1"
};

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, fallback = null) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
};
const genId = () => Math.random().toString(36).slice(2,9);
const toast = (msg, type = "success", ms = 2500) => {
  const root = document.getElementById("toast-root");
  if (!root) { console.log("TOAST:", msg); return; }
  const el = document.createElement("div");
  el.className = `toast ${type === 'error' ? 'error' : ''}`;
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(()=> el.style.opacity = "0", ms - 300);
  setTimeout(()=> el.remove(), ms);
};

// Doctor display name helper — ensures "Dr." prefix appears once
function getDoctorDisplayName() {
  const profile = load(STORAGE.PROFILE) || {};
  const raw = (profile.name || "Doctor").trim();
  return /^dr\.?\s/i.test(raw) ? raw.replace(/^dr\.?\s*/i, 'Dr. ') : `Dr. ${raw}`;
}

/* ---------- Seed/demo data (robust) ----------
   Guarantees:
     - Patients/treatments/profile/cases exist for demo
     - Appointments: if there are fewer than 3 stored, create demo appointments to reach 3
*/
function seedDemoData() {
  // profile
  if (!load(STORAGE.PROFILE)) {
    save(STORAGE.PROFILE, {
      name: "Dr. Anjali Verma",
      email: "anjali@example.com",
      phone: "+91-9876543210",
      specialization: "Ayurveda Physician",
      hours: "10:00–18:00",
      bio: "Experienced practitioner in Panchakarma",
      photo: ""
    });
  }

  // treatments
  if (!load(STORAGE.TREATMENTS)) {
    save(STORAGE.TREATMENTS, [
      { id: 1, name: "Abhyanga", duration_min: 60, price: 1200, description: "Full-body oil massage", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", category: "panchakarma" },
      { id: 2, name: "Shirodhara", duration_min: 45, price: 2500, description: "Oil poured on forehead", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", category: "panchakarma" }
    ]);
  }

  // patients
  if (!load(STORAGE.PATIENTS)) {
    save(STORAGE.PATIENTS, [
      { email: "patient1@example.com", name: "Ramesh Kumar", phone: "+91-9000000001", allergies: ["Penicillin"], notes: "Knee pain", dob: "1980-01-01", history: ["Hypertension"] },
      { email: "patient2@example.com", name: "Priya Sharma", phone: "+91-9000000002", allergies: [], notes: "", dob: "1990-05-10", history: ["Insomnia"] }
    ]);
  }

  // cases (if none)
  if (!load(STORAGE.CASES)) {
    save(STORAGE.CASES, [
      {
        id: genId(),
        patientEmail: "patient1@example.com",
        createdAt: new Date().toISOString(),
        subjective: "Patient complains of knee pain when climbing stairs.",
        objective: "Mild swelling and tenderness at medial joint line.",
        assessment: "Early degenerative changes likely; suspect patellofemoral involvement.",
        plan: "Trial Abhyanga + strengthen quadriceps; physio referral; follow-up in 2 weeks.",
        attachments: []
      }
    ]);
  }

  // progress: generate simple weekly series for each patient (Pain/Sleep/Stress)
  if (!load(STORAGE.PROGRESS)) {
    const patients = load(STORAGE.PATIENTS, []);
    const progressStore = {};
    const weeks = 10;
    const now = Date.now();
    patients.forEach((p, idx) => {
      const labels = Array.from({length: weeks}, (_, i) => {
        const d = new Date(now - (weeks-1-i)*7*24*3600*1000);
        return `${d.getMonth()+1}/${d.getDate()}`;
      });
      const pain   = Array.from({length: weeks}, (_, i) => Math.max(0, Math.round((6 + (Math.sin(i/2 + idx) * 1.4) - i*0.25) * 10)/10));
      const sleep  = Array.from({length: weeks}, (_, i) => Math.max(3, Math.round((6 + (Math.cos(i/3 + idx) * 1.1) + i*0.12) * 10)/10));
      const stress = Array.from({length: weeks}, (_, i) => Math.max(1, Math.round((5 + (Math.sin(i/1.6 + idx) * 1.0) - i*0.18) * 10)/10));
      progressStore[p.email] = { labels, pain, sleep, stress };
    });
    save(STORAGE.PROGRESS, progressStore);
  }

  // appointments: if key missing or length < 8, add demo appointments without deleting existing ones
  let appts = load(STORAGE.APPTS, []);
  if (!Array.isArray(appts)) appts = [];

  if (appts.length < 8) {
    // We'll create demo appts and append them (keep existing)
    const now = new Date();

    // Helper to create a date with specific hour:minute (local time)
    function makeLocalDate(base, offsetDays, hour, minute) {
      const d = new Date(base);
      d.setDate(d.getDate() + (offsetDays || 0));
      d.setHours(hour, minute || 0, 0, 0);
      return d;
    }

    // Candidate demo appointments (times chosen to be reasonable)
    const candidates = [
      { treatments:["Abhyanga"],  start: makeLocalDate(now, 0, 9,  0).toISOString(),  duration:60, patientEmail:"patient1@example.com", patientName:"Ramesh Kumar",  notes:"Initial consult — knee pain",   status:"confirmed" },
      { treatments:["Shirodhara"],start: makeLocalDate(now, 0, 11, 30).toISOString(), duration:45, patientEmail:"patient2@example.com", patientName:"Priya Sharma",  notes:"Sleep therapy follow-up",       status:"confirmed" },
      { treatments:["Nasya"],     start: makeLocalDate(now, 0, 14, 0).toISOString(),  duration:30, patientEmail:"patient3@example.com", patientName:"Asha Patel",    notes:"Back pain consult",            status:"confirmed" },
      { treatments:["Abhyanga"],  start: makeLocalDate(now, 0, 16, 0).toISOString(),  duration:60, patientEmail:"patient4@example.com", patientName:"Vikram Singh",  notes:"Digestive care",               status:"confirmed" },
      { treatments:["Shirodhara"],start: makeLocalDate(now, 1, 9, 30).toISOString(),  duration:45, patientEmail:"patient2@example.com", patientName:"Priya Sharma",  notes:"Second session",               status:"confirmed" },
      { treatments:["Abhyanga"],  start: makeLocalDate(now, 1, 11, 0).toISOString(),  duration:60, patientEmail:"patient1@example.com", patientName:"Ramesh Kumar",  notes:"Therapy session — package",    status:"confirmed" },
      { treatments:["Nasya"],     start: makeLocalDate(now, 1, 14, 30).toISOString(), duration:30, patientEmail:"patient3@example.com", patientName:"Asha Patel",    notes:"Follow-up treatment",           status:"confirmed" },
      { treatments:["Abhyanga"],  start: makeLocalDate(now, 1, 16, 30).toISOString(), duration:60, patientEmail:"patient4@example.com", patientName:"Vikram Singh",  notes:"Digestive therapy",            status:"confirmed" },
      { treatments:["Shirodhara"],start: makeLocalDate(now, 2, 10, 0).toISOString(),  duration:45, patientEmail:"patient2@example.com", patientName:"Priya Sharma",  notes:"Third session",                status:"confirmed" },
      { treatments:["Abhyanga"],  start: makeLocalDate(now, 2, 12, 0).toISOString(),  duration:60, patientEmail:"patient1@example.com", patientName:"Ramesh Kumar",  notes:"Progress check",               status:"confirmed" }
    ];

    // Add only as many as needed to reach 8 appointments
    let needed = 8 - appts.length;
    for (let i = 0; i < candidates.length && needed > 0; i++) {
      // avoid duplicating an appointment with same start & patientName
      const exists = appts.some(a => a.start === candidates[i].start && a.patientName === candidates[i].patientName);
      if (!exists) {
        appts.push({ id: genId(), ...candidates[i] });
        needed--;
      }
    }
    // If still need, shift times by +2 days to avoid duplicates
    let idx = 0;
    while (appts.length < 8 && idx < candidates.length) {
      const c = candidates[idx];
      const shifted = { ...c, start: new Date(new Date(c.start).getTime() + 2*24*3600*1000).toISOString() };
      appts.push({ id: genId(), ...shifted });
      idx++;
    }

    save(STORAGE.APPTS, appts);
  }
}

/* ---------- small helpers ---------- */
function escapeHtml(s) { return String(s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }

/* ---------- UI show/hide ---------- */
function hideAllFeaturePages() {
  $$(".page-content").forEach(el => {
    el.classList.remove("visible");
    el.classList.add("hidden");
    el.style.display = "none";
  });
}
function showPage(id, title = "") {
  const dashboardEl = document.getElementById('dashboard');
  if (dashboardEl) dashboardEl.style.display = (id === 'dashboard' ? 'block' : 'none');

  hideAllFeaturePages();
  if (id === 'dashboard') {
    if (dashboardEl) dashboardEl.style.display = 'block';
    if (title) {
      const wt = document.getElementById("welcome-text");
      if (wt) wt.textContent = title;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
  el.classList.remove('hidden');
  el.classList.add('visible');
  if (title) {
    const wt = document.getElementById("welcome-text");
    if (wt) wt.textContent = title;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Profile rendering (unchanged) ---------- */
function loadProfileToForm(){
  const p = load(STORAGE.PROFILE) || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
  set('profile-name', p.name || "");
  set('profile-email', p.email || "");
  set('profile-phone', p.phone || "");
  set('profile-spec', p.specialization || "");
  set('profile-hours', p.hours || "");
  set('profile-age', (p.age!=null ? String(p.age) : ""));
  const g = document.getElementById('profile-gender'); if (g) g.value = p.gender || "";
  const bioEl = document.getElementById('profile-bio'); if (bioEl) bioEl.value = p.bio || "";
  const photo = document.getElementById('profile-photo'); if (photo) photo.src = p.photo || "https://via.placeholder.com/240x240.png?text=Doctor";
}
function renderProfilePreview(){ const welcome = document.getElementById("welcome-text"); if (welcome) welcome.textContent = `Welcome, ${getDoctorDisplayName()} !`; }

/* ---------- Treatments ---------- */
function renderTreatments(filter="all", search=""){
  const grid = document.getElementById('treatments-grid');
  if (!grid) return;
  grid.innerHTML = "";
  const all = load(STORAGE.TREATMENTS) || [];
  const list = all.filter(t => (filter==="all" || t.category===filter) && (search==="" || (t.name + " " + (t.description||"")).toLowerCase().includes(search.toLowerCase())));
  if (list.length===0) { grid.innerHTML = `<div class="p-6">No treatments found.</div>`; return; }
  list.forEach(t=> {
    const card = document.createElement('div');
    card.className = "treatment-card bg-white rounded-2xl shadow-md overflow-hidden flex flex-col cursor-pointer";
    card.innerHTML = `
      <div class="relative w-full h-48 overflow-hidden"><img src="${t.image||''}" alt="${escapeHtml(t.name)}" class="w-full h-full object-cover"></div>
      <div class="p-6 flex-1">
        <h3 class="text-2xl font-serif text-sage-900 mb-2">${escapeHtml(t.name)}</h3>
        <p class="text-sage-500 font-body text-sm mb-2 uppercase">${escapeHtml(t.category||'')}</p>
        <p class="text-gray-600 font-text leading-relaxed text-sm mb-4">${escapeHtml(t.description||'')}</p>
      </div>
      <div class="bg-sage-50 p-6 border-t border-sage-100 mt-auto flex justify-between items-center">
        <span class="text-xl font-bold text-sage-800">₹${t.price}</span>
        <button class="add-to-appointment-btn bg-sage-600 text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-sage-700 transition" data-id="${t.id}">Add to Appointment</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.add-to-appointment-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = button.dataset.id;
      const treatment = (load(STORAGE.TREATMENTS)||[]).find(x => String(x.id) === String(id));
      toast(`${treatment ? treatment.name : "Treatment"} selected — use booking flow to confirm.`);
    });
  });

  grid.querySelectorAll('.treatment-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const btn = card.querySelector('.add-to-appointment-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      const treatmentDetail = (load(STORAGE.TREATMENTS)||[]).find(t => String(t.id) === String(id));
      if (treatmentDetail) {
        renderTreatmentDetail(treatmentDetail);
        showPage('treatment-detail-section', treatmentDetail.name);
      }
    });
  });
}

function renderTreatmentDetail(t){
  const c = document.getElementById('treatment-detail-content');
  if (!c) return;
  c.innerHTML = `<h4 class="text-xl font-semibold">${escapeHtml(t.name)}</h4><p class="text-sage-600 text-sm mb-2">${escapeHtml(t.category||'')} • ${t.duration_min || t.duration || ''} mins • ₹${t.price}</p><p class="text-gray-700 mb-3">${escapeHtml(t.description||"")}</p><div class="flex gap-2"><button id="detail-book" class="px-4 py-2 bg-sage-600 text-white rounded">Book Now</button><button id="detail-close" class="px-4 py-2 btn-back">Close</button></div>`;
  const detailBook = document.getElementById('detail-book');
  if (detailBook) detailBook.addEventListener('click', ()=> toast("Open Book flow to schedule appointment."));
  const detailClose = document.getElementById('detail-close');
  if (detailClose) detailClose.addEventListener('click', ()=> showPage('treatments-section','Treatments'));
}

/* ---------- Appointments (renders appointments-list) ---------- */
function renderAppointments(filterDate=null){
  const container = document.getElementById('appointments-list');
  if (!container) return;
  container.innerHTML = "";
  let appts = load(STORAGE.APPTS) || [];
  if (!Array.isArray(appts)) appts = [];
  if (filterDate) appts = appts.filter(a => (a.start || "").split("T")[0] === filterDate);
  if (appts.length === 0) { container.innerHTML = "<p class='text-gray-500'>No appointments.</p>"; return; }

  appts = appts.slice().sort((a,b)=> new Date(a.start) - new Date(b.start));
  appts.forEach(a=>{
    const el = document.createElement('div');
    el.className = "bg-sage-50 p-4 rounded-xl flex justify-between items-center mb-3";
    el.innerHTML = `<div><div class="font-semibold text-sage-800">${escapeHtml(a.patientName || a.patientEmail)} • ${escapeHtml((a.treatments || []).join(", "))}</div><div class="text-sm text-gray-700">${new Date(a.start).toLocaleString()} • ${a.duration || "-"} min</div><div class="text-sm text-gray-600">Notes: ${escapeHtml(a.notes || "-")}</div></div><div class="flex flex-col gap-2"><button class="start-btn px-3 py-1 bg-sage-600 text-white rounded" data-id="${a.id}">Start</button><button class="reschedule-btn px-3 py-1 bg-white border rounded" data-id="${a.id}">Reschedule</button><button class="cancel-btn px-3 py-1 bg-red-100 text-red-700 rounded" data-id="${a.id}">Cancel</button></div>`;
    container.appendChild(el);
  });

  // wiring buttons safely
  container.querySelectorAll('.start-btn').forEach(b => b.addEventListener('click', ev => {
    const id = ev.currentTarget.dataset.id;
    let appts = load(STORAGE.APPTS) || [];
    const ap = appts.find(x => x.id === id);
    if (!ap) return toast("Appointment not found", "error");
    ap.status = "in_session";
    save(STORAGE.APPTS, appts);
    // Sync to Firestore if available
    try { if (window.DoctorFB && window.DoctorFB.updateAppointment) window.DoctorFB.updateAppointment(id, { status: 'In Session' }); } catch(_){ }
    toast("Session started for " + (ap.patientName || ap.patientEmail));
    renderAppointments();
  }));

  container.querySelectorAll('.reschedule-btn').forEach(b => b.addEventListener('click', ev => {
    const id = ev.currentTarget.dataset.id;
    const newDate = prompt("New date (YYYY-MM-DD):");
    if (!newDate) return;
    const newTime = prompt("New time (HH:MM):");
    if (!newTime) return;
    let appts = load(STORAGE.APPTS) || [];
    const ap = appts.find(x => x.id === id);
    if (!ap) return toast("Appointment not found", "error");
    const newStart = new Date(newDate + "T" + newTime).toISOString();
    // naive conflict detection
    const conflict = appts.find(x => x.id !== id && (Math.max(new Date(x.start).getTime(), new Date(newStart).getTime()) < Math.min(new Date(x.start).getTime() + (x.duration||0)*60000, new Date(newStart).getTime() + (ap.duration||0)*60000)));
    if (conflict) return toast("Conflict with another appointment", "error");
    ap.start = newStart;
    ap.status = "confirmed";
    save(STORAGE.APPTS, appts);
    // Sync to Firestore if available (update date/time fields)
    try { if (window.DoctorFB && window.DoctorFB.updateAppointment) window.DoctorFB.updateAppointment(id, { date: newDate, time: newTime, status: 'Confirmed' }); } catch(_){ }
    toast("Appointment rescheduled");
    renderAppointments();
  }));

  container.querySelectorAll('.cancel-btn').forEach(b => b.addEventListener('click', ev => {
    const id = ev.currentTarget.dataset.id;
    if (!confirm("Cancel appointment?")) return;
    let appts = load(STORAGE.APPTS) || [];
    appts = appts.map(a => a.id === id ? { ...a, status: "cancelled" } : a);
    save(STORAGE.APPTS, appts);
    // Sync to Firestore if available
    try { if (window.DoctorFB && window.DoctorFB.updateAppointment) window.DoctorFB.updateAppointment(id, { status: 'Cancelled' }); } catch(_){ }
    toast("Appointment cancelled");
    renderAppointments();
  }));
}

/* ---------- Patients list & detail (simplified) ---------- */
function renderPatients(search = "") {
  const listEl = document.getElementById('patients-list');
  if (!listEl) return;
  const patients = load(STORAGE.PATIENTS) || [];
  const q = (search || "").trim().toLowerCase();
  const filtered = patients.filter(p => {
    if (!q) return true;
    return (p.name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q) || (p.phone || "").toLowerCase().includes(q);
  });
  listEl.innerHTML = "";
  if (filtered.length === 0) { listEl.innerHTML = `<div class="p-3 text-gray-500">No patients found.</div>`; return; }
  filtered.forEach(p => {
    const el = document.createElement('div');
    el.className = "p-3 bg-white rounded-lg border flex items-center gap-3 hover:bg-sage-50 cursor-pointer";
    el.innerHTML = `<div class="flex-1"><div class="font-semibold text-sage-800">${escapeHtml(p.name || p.email)}</div><div class="text-sm text-gray-600">${escapeHtml(p.email || "")}</div></div><div class="text-sm text-gray-600">${(p.allergies && p.allergies.length) ? `<span class="small-pill">${p.allergies.length} allergy</span>` : ''}</div>`;
    el.addEventListener('click', () => showPatientDetail(p.email));
    listEl.appendChild(el);
  });
}

function showPatientDetail(email) {
  const patients = load(STORAGE.PATIENTS) || [];
  const p = patients.find(x => x.email === email);
  if (!p) {
    const empty = document.getElementById('patient-detail-empty');
    if (empty) empty.style.display = 'block';
    const detail = document.getElementById('patient-detail');
    if (detail) detail.style.display = 'none';
    return;
  }
  document.getElementById('patient-detail-empty')?.style && (document.getElementById('patient-detail-empty').style.display = 'none');
  const pd = document.getElementById('patient-detail'); if (pd) pd.style.display = 'block';
  document.getElementById('pd-name') && (document.getElementById('pd-name').textContent = p.name || "(no name)");
  document.getElementById('pd-contact') && (document.getElementById('pd-contact').textContent = `${p.email || ''}${p.phone ? ' • ' + p.phone : ''}`);
  const histEl = document.getElementById('pd-history'); if (histEl) { histEl.innerHTML = ""; (p.history || []).forEach(h=>{ const li = document.createElement('li'); li.textContent = h; histEl.appendChild(li); }); if ((p.history||[]).length===0) histEl.innerHTML = "<li class='text-gray-500'>No recorded history</li>"; }
  const allergiesEl = document.getElementById('pd-allergies'); if (allergiesEl) { allergiesEl.innerHTML = ""; (p.allergies||[]).forEach((a, idx)=>{ const pill = document.createElement('div'); pill.className="small-pill"; pill.textContent = a; const del = document.createElement('button'); del.className="ml-2 text-xs"; del.textContent="✕"; del.style.marginLeft="8px"; del.title = "Remove allergy"; del.addEventListener('click', ev=>{ ev.stopPropagation(); removePatientAllergy(p.email, idx);}); pill.appendChild(del); allergiesEl.appendChild(pill); }); if ((p.allergies||[]).length===0) allergiesEl.innerHTML = `<div class="text-gray-500">No known allergies</div>`; }
  const notesEl = document.getElementById('pd-notes'); if (notesEl) notesEl.value = p.notes || "";
  const appts = (load(STORAGE.APPTS)||[]).filter(a => a.patientEmail === p.email).sort((a,b)=>new Date(b.start)-new Date(a.start));
  const apptsEl = document.getElementById('pd-appts'); if (apptsEl) {
    if (!appts || appts.length === 0) apptsEl.innerHTML = "<div class='text-gray-500'>No appointments found.</div>";
    else apptsEl.innerHTML = appts.map(a=>`<div class="p-2 border rounded mb-2 bg-white"><div class="font-semibold text-sage-800">${escapeHtml((a.treatments||[]).join(", "))}</div><div class="text-sm text-gray-600">${new Date(a.start).toLocaleString()} • ${a.duration} min • ${escapeHtml(a.status || '')}</div><div class="text-sm text-gray-700">Notes: ${escapeHtml(a.notes || '')}</div></div>`).join("");
  }
  // wire patient controls safely (add allergy, save, close)
  const addAllergy = document.getElementById('pd-add-allergy');
  if (addAllergy) {
    addAllergy.replaceWith(addAllergy.cloneNode(true));
    document.getElementById('pd-add-allergy').addEventListener('click', ()=>{ const tx = document.getElementById('pd-new-allergy'); const val = (tx.value||"").trim(); if(!val) return toast("Enter an allergy","error"); addPatientAllergy(p.email, val); tx.value=""; showPatientDetail(p.email); });
  }
  const saveBtn = document.getElementById('pd-save');
  if (saveBtn) {
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    document.getElementById('pd-save').addEventListener('click', ()=>{ const notes = (document.getElementById('pd-notes') ? document.getElementById('pd-notes').value.trim() : ""); updatePatient(p.email, { notes }); toast("Patient updated"); renderPatients(document.getElementById('patients-search') ? document.getElementById('patients-search').value : ""); showPatientDetail(p.email); });
  }
  const closeBtn = document.getElementById('pd-close');
  if (closeBtn) {
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    document.getElementById('pd-close').addEventListener('click', ()=>{ document.getElementById('patient-detail-empty') && (document.getElementById('patient-detail-empty').style.display='block'); document.getElementById('patient-detail') && (document.getElementById('patient-detail').style.display='none'); });
  }
}
function addPatientAllergy(email, allergy){ const patients = load(STORAGE.PATIENTS)||[]; const p = patients.find(x=>x.email===email); if(!p) return; p.allergies = p.allergies || []; if(!p.allergies.includes(allergy)) p.allergies.push(allergy); save(STORAGE.PATIENTS, patients); toast("Allergy added"); }
function removePatientAllergy(email, idx){ const patients = load(STORAGE.PATIENTS)||[]; const p = patients.find(x=>x.email===email); if(!p) return; p.allergies = p.allergies || []; p.allergies.splice(idx,1); save(STORAGE.PATIENTS, patients); toast("Allergy removed"); showPatientDetail(email); }
function updatePatient(email, patch){ const patients = load(STORAGE.PATIENTS)||[]; const idx = patients.findIndex(x=>x.email===email); if(idx===-1) return; patients[idx] = { ...patients[idx], ...patch }; save(STORAGE.PATIENTS, patients); }

/* ---------- Case Study (SOAP) minimal wiring ---------- */
function getAllCases() { return load(STORAGE.CASES, []); }
function saveAllCases(arr) { save(STORAGE.CASES, arr); }

function renderCasePatientFilter() {
  const sel = document.getElementById('case-patient-filter');
  const selDetail = document.getElementById('case-patient');
  const patients = load(STORAGE.PATIENTS) || [];
  if (sel) {
    sel.innerHTML = `<option value="">— All patients —</option>`;
    patients.forEach(p => { const opt = document.createElement('option'); opt.value = p.email; opt.textContent = `${p.name} — ${p.email}`; sel.appendChild(opt); });
  }
  if (selDetail) {
    selDetail.innerHTML = `<option value="">— Select patient —</option>`;
    patients.forEach(p => { const opt = document.createElement('option'); opt.value = p.email; opt.textContent = `${p.name} — ${p.email}`; selDetail.appendChild(opt); });
  }
}

function renderCasesList(filterPatient = "") {
  const list = document.getElementById('cases-list');
  if (!list) return;
  list.innerHTML = "";
  const cases = getAllCases().slice().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = filterPatient ? cases.filter(c => c.patientEmail === filterPatient) : cases;
  if (filtered.length === 0) { list.innerHTML = `<div class="p-3 text-gray-500">No case notes.</div>`; return; }
  filtered.forEach(c => {
    const item = document.createElement('div');
    item.className = "p-3 bg-white rounded-lg border hover:bg-sage-50 cursor-pointer";
    const patient = (load(STORAGE.PATIENTS)||[]).find(p=>p.email===c.patientEmail);
    const patientName = patient ? patient.name : c.patientEmail;
    item.innerHTML = `<div class="flex justify-between items-start"><div><div class="font-semibold text-sage-800">${escapeHtml(patientName)}</div><div class="text-sm text-gray-600">${new Date(c.createdAt).toLocaleString()}</div></div><div><span class="small-pill">SOAP</span></div></div><div class="text-sm text-gray-700 mt-2">${escapeHtml((c.subjective||"").slice(0,120))}${(c.subjective||"").length>120?"...":""}</div>`;
    item.addEventListener('click', ()=> openCaseDetail(c.id));
    list.appendChild(item);
  });
}

/* ----- small case helpers (only minimal features used in UI) ----- */
function openCaseDetail(caseId) {
  const cases = getAllCases();
  const c = cases.find(x => x.id === caseId);
  if (!c) return;
  document.getElementById('case-empty') && (document.getElementById('case-empty').style.display = 'none');
  document.getElementById('case-detail') && (document.getElementById('case-detail').style.display = 'block');
  document.getElementById('case-title') && (document.getElementById('case-title').textContent = `Case — ${ (load(STORAGE.PATIENTS)||[]).find(p=>p.email===c.patientEmail)?.name || c.patientEmail }`);
  document.getElementById('case-meta') && (document.getElementById('case-meta').textContent = `Created: ${ new Date(c.createdAt).toLocaleString() }`);
  if (document.getElementById('case-patient')) document.getElementById('case-patient').value = c.patientEmail || "";
  if (document.getElementById('case-subjective')) document.getElementById('case-subjective').value = c.subjective || "";
  if (document.getElementById('case-objective')) document.getElementById('case-objective').value = c.objective || "";
  if (document.getElementById('case-assessment')) document.getElementById('case-assessment').value = c.assessment || "";
  if (document.getElementById('case-plan')) document.getElementById('case-plan').value = c.plan || "";
  // attachments list - keep simple (download/remove not required for demo)
}

/* ---------- Init wiring (DOMContentLoaded) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // seed demo data (ensures appointments exist)
  seedDemoData();

  // If coming from login, inject the email into profile (without overwriting name if set)
  try {
    const loginEmail = localStorage.getItem('doc_login_email');
    if (loginEmail) {
      const profile = load(STORAGE.PROFILE) || {};
      if (!profile.email) { profile.email = loginEmail; save(STORAGE.PROFILE, profile); }
      // clear the temp value
      localStorage.removeItem('doc_login_email');
    }
  } catch(_){}

  // tiles click handlers
  $$('.feature-tile').forEach(btn => btn.addEventListener('click', (e) => {
    const target = btn.dataset.target;
    if (!target) return;
    if (target === "profile-section") { loadProfileToForm(); showPage(target, `My Profile`); }
    else if (target === "treatments-section") { renderTreatments(); showPage(target, "Treatments"); }
    else if (target === "booking-section") { renderPatients(); showPage(target, "My Patients"); }
    else if (target === "appointments-section") { renderAppointments(); showPage(target, "My Appointments"); }
    else if (target === "plans-section") { renderCasePatientFilter(); renderCasesList(); showPage(target, "Case Study — SOAP Notes"); }
    else if (target === "charts-section") { renderCharts(); showPage(target, "Progress Charts"); }
    else if (target === "feedback-section") { showPage(target, "Feedback"); }
    else { showPage(target); }
  }));

  // go to dashboard buttons
  $$('.go-dashboard').forEach(btn => btn.addEventListener('click', ()=> {
    const welcome = `Welcome, ${getDoctorDisplayName()} !`;
    showPage('dashboard', welcome);
    const db = document.getElementById('dashboard'); if (db) db.style.display = 'block';
  }));

  // header profile quick open
  document.getElementById('btn-open-profile-mini')?.addEventListener('click', ()=> { loadProfileToForm(); showPage('profile-section', 'My Profile'); });

  // back buttons
  $$('.btn-back').forEach(b => { if (b) b.addEventListener('click', ()=> showPage('dashboard','Welcome back!')); });

  // logout
  document.getElementById('logout-button')?.addEventListener('click', ()=> { if (confirm("Log out?")) window.location.href = "index.html"; });

  // search inputs
  document.getElementById('treatment-search')?.addEventListener('input', (e)=> renderTreatments('all', e.target.value));
  document.getElementById('patients-search')?.addEventListener('input', (e)=> renderPatients(e.target.value));

  // initial renders
  renderProfilePreview();
  renderTreatments();
  renderAppointments();
  renderPatients();
  renderCasePatientFilter();
  renderCasesList();
  // Render charts on load so charts appear when opening section
  if (typeof renderCharts === 'function') { try { renderCharts(); } catch(_){} }

  // ensure dashboard visible with updated welcome
  const db = document.getElementById('dashboard'); if (db) db.style.display = 'block';
  const wt = document.getElementById('welcome-text'); if (wt) wt.textContent = `Welcome, ${getDoctorDisplayName()} !`;

  // profile form save -> persist name and refresh welcome
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', function(ev){
      ev.preventDefault();
      const current = load(STORAGE.PROFILE) || {};
      const updated = {
        ...current,
        name: (document.getElementById('profile-name')?.value || '').trim(),
        email: (document.getElementById('profile-email')?.value || '').trim(),
        phone: (document.getElementById('profile-phone')?.value || '').trim(),
        specialization: (document.getElementById('profile-spec')?.value || '').trim(),
        hours: (document.getElementById('profile-hours')?.value || '').trim(),
        age: (()=>{ const v = document.getElementById('profile-age')?.value; return v? Number(v) : null; })(),
        gender: (document.getElementById('profile-gender')?.value || '').trim(),
        bio: (document.getElementById('profile-bio')?.value || '').trim()
      };
      save(STORAGE.PROFILE, updated);
      // Sync to Firestore profile if available
      try {
        if (window.DoctorFB && window.DoctorFB.auth?.currentUser) {
          const uid = window.DoctorFB.auth.currentUser.uid;
          window.DoctorFB.saveDoctorProfile(uid, {
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            specialization: updated.specialization,
            hours: updated.hours,
            age: updated.age,
            gender: updated.gender,
            bio: updated.bio
          });
        }
      } catch(_){ }
      toast('Profile saved');
      // refresh welcome text everywhere
      const wt = document.getElementById('welcome-text'); if (wt) wt.textContent = `Welcome, ${getDoctorDisplayName()} !`;
      // also refresh inputs to reflect normalized values
      loadProfileToForm();
    });
  }
  // Photo upload -> upload to Storage if available and save URL
  const photoInput = document.getElementById('photo-input');
  if (photoInput) {
    photoInput.addEventListener('change', async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      try {
        if (window.DoctorFB && window.DoctorFB.auth?.currentUser) {
          const uid = window.DoctorFB.auth.currentUser.uid;
          const url = await window.DoctorFB.uploadProfilePhoto(uid, file);
          const p = load(STORAGE.PROFILE) || {};
          p.photo = url;
          save(STORAGE.PROFILE, p);
          const img = document.getElementById('profile-photo'); if (img) img.src = url;
          await window.DoctorFB.saveDoctorProfile(uid, { photo: url });
          toast('Profile photo updated');
        } else {
          toast('Logged in required to upload photo', 'error');
        }
      } catch(e){ toast('Photo upload failed', 'error'); }
    });
  }

  // Live appointments from Firestore (if available)
  try {
    if (window.DoctorFB && window.DoctorFB.subscribeAppointments) {
      window.DoctorFB.subscribeAppointments((items) => {
        // Map Firestore appointments to local model used by renderer
        const mapped = items.map(a => {
          // Patient name/email already enriched in doctor.fb.js
          const startIso = (()=>{
            // Combine patient portal's date & time into ISO
            if (a.date && a.time) {
              const iso = new Date(`${a.date}T${(a.time||'').replace(/\s*(AM|PM)/i,'')}`).toISOString();
              return iso;
            }
            return a.start || new Date().toISOString();
          })();
          const treatmentsList = Array.isArray(a.treatments) ? a.treatments.map(t => t.name || t).filter(Boolean) : [];
          return {
            id: a.id,
            treatments: treatmentsList,
            start: startIso,
            duration: 60,
            patientEmail: a.patientEmail || '',
            patientName: a.patientName || a.patientEmail || '',
            notes: a.center ? `${a.center}${a.practitioner ? ' • ' + a.practitioner : ''}` : (a.notes || ''),
            status: (a.status || 'Confirmed').toLowerCase()
          };
        });
        save(STORAGE.APPTS, mapped);
        // If appointments page is visible, re-render
        renderAppointments();
      });
    }
  } catch(_){ }
});

/* ---------- Progress Charts (Chart.js with graceful fallback) ---------- */
function renderCharts() {
  const patientCanvas = document.getElementById('chart-patient');
  const therapyCanvas = document.getElementById('chart-therapy');
  if (!patientCanvas) return;

  const patients = load(STORAGE.PATIENTS, []);
  const first = patients[0];
  const series = load(STORAGE.PROGRESS, {});
  const pdata = first ? series[first.email] : null;

  const labels = pdata?.labels || ["-3w","-2w","-1w","This"];
  const pain   = pdata?.pain   || [6,5,4,3];
  const sleep  = pdata?.sleep  || [6,6.2,6.5,7];
  const stress = pdata?.stress || [5,4.4,3.8,3];

  // If Chart.js available
  if (typeof Chart !== 'undefined' && patientCanvas.getContext) {
    try {
      // Patient progress line chart
      new Chart(patientCanvas, {
        type: 'line',
        data: { labels, datasets: [
          { label: 'Pain (0-10)',   data: pain,   borderColor: '#567a3e', backgroundColor: 'rgba(86,122,62,0.12)', tension: 0.35, fill: true, yAxisID: 'y' },
          { label: 'Sleep (hrs)',   data: sleep,  borderColor: '#2b6b5a', backgroundColor: 'rgba(43,107,90,0.08)', tension: 0.35, fill: false, yAxisID: 'y1' },
          { label: 'Stress (1-10)', data: stress, borderColor: '#8b2d2d', backgroundColor: 'rgba(139,45,45,0.08)', tension: 0.35, fill: false, yAxisID: 'y' }
        ]},
        options: {
          responsive: true,
          interaction: { mode: 'index', intersect: false },
          stacked: false,
          scales: {
            y:  { type: 'linear', position: 'left',  beginAtZero: true, suggestedMax: 10, ticks: { stepSize: 1 } },
            y1: { type: 'linear', position: 'right', beginAtZero: true, suggestedMax: 10, grid: { drawOnChartArea: false }, ticks: { stepSize: 1 } }
          },
          plugins: { legend: { position: 'top' } }
        }
      });

      // Therapy effectiveness bar chart (static comparison)
      if (therapyCanvas && therapyCanvas.getContext) {
        new Chart(therapyCanvas, {
          type: 'bar',
          data: {
            labels: ['Abhyanga','Shirodhara','Nasya','Combined'],
            datasets: [{
              label: 'Effectiveness (1-10)',
              data: [8.2, 7.7, 6.5, 9.0],
              backgroundColor: [
                'rgba(86,122,62,0.8)',
                'rgba(43,107,90,0.8)',
                'rgba(139,45,45,0.8)',
                'rgba(86,122,62,0.6)'
              ],
              borderColor: [
                'rgba(86,122,62,1)',
                'rgba(43,107,90,1)',
                'rgba(139,45,45,1)',
                'rgba(86,122,62,1)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true, suggestedMax: 10, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
          }
        });
      }
      return;
    } catch (e) {
      console.warn('Chart.js failed, falling back to canvas', e);
    }
  }

  // Fallback: draw simple lines on canvas
  const ctx = patientCanvas.getContext && patientCanvas.getContext('2d');
  if (!ctx) return;
  const w = patientCanvas.width || 640, h = patientCanvas.height || 320;
  patientCanvas.width = w; patientCanvas.height = h;
  ctx.clearRect(0,0,w,h);
  const pad = 32, plotW = w - pad*2, plotH = h - pad*2;
  const maxVal = 10, minVal = 0;
  ctx.strokeStyle = '#e6e6e6'; ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h-pad); ctx.lineTo(w-pad, h-pad); ctx.stroke();
  function plot(series, color){
    ctx.beginPath();
    series.forEach((v,i)=>{
      const x = pad + (i/Math.max(1,series.length-1))*plotW;
      const y = pad + ((maxVal - v)/(maxVal-minVal))*plotH;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  }
  plot(pain,'#567a3e'); plot(sleep,'#2b6b5a'); plot(stress,'#8b2d2d');
}