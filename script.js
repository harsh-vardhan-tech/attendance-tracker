// Simple Attendance Tracker using localStorage
// Data model stored under key: attendance_app_data

const STORAGE_KEY = 'attendance_app_data_v1';
const state = {
  step: 1,
  meta: { subject:'', teacher:'', date:'', year:'1', semester:'1', classNo:'', section:'' },
  sections: {}, // { sectionName: [ {name, roll} ] }
  students: [], // current section students
  marks: {}, // roll -> present(true)/absent(false)
};

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function saveToStorage(obj){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}
function loadFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return { sections: {}, records: [] };
    return JSON.parse(raw);
  }catch(e){ return { sections:{}, records: [] }; }
}

// initialize storage structure if missing
let store = loadFromStorage();
if(!store.sections) store.sections = {};
if(!store.records) store.records = []; // each record saved

// UI binders
const steps = qsa('.step');
function setStep(n){
  state.step = n;
  qsa('.step-panel').forEach(s=>s.classList.add('hide'));
  qs('#step-'+n).classList.remove('hide');
  steps.forEach(s=> s.classList.toggle('active', +s.dataset.step === n));
}
setStep(1);

// Step 1 controls
qs('#next-1').addEventListener('click', ()=>{
  const subject = qs('#subject').value.trim();
  const teacher = qs('#teacher').value.trim();
  const date = qs('#date').value;
  if(!subject || !teacher || !date){ alert('Please fill subject, teacher and date'); return; }
  state.meta.subject = subject; state.meta.teacher = teacher; state.meta.date = date;
  qs('#metaInfo').textContent = `${subject} • ${date}`;
  setStep(2);
  populateSections();
});

// Step 2 controls
function populateSections(){
  const sel = qs('#sectionSelect');
  sel.innerHTML = '';
  Object.keys(store.sections || {}).forEach(s=>{
    const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });
  // if none exist, create Default
  if(!sel.children.length){
    store.sections['A'] = store.sections['A'] || [];
    saveToStorage(store);
    populateSections();
    return;
  }
  if(!state.meta.section) state.meta.section = sel.value;
}
qs('#addSection').addEventListener('click', ()=>{
  const name = qs('#newSection').value.trim();
  if(!name) return alert('Enter section name');
  if(!store.sections[name]) store.sections[name] = [];
  saveToStorage(store);
  qs('#newSection').value='';
  populateSections();
});
qs('#back-2').addEventListener('click', ()=> setStep(1));
qs('#next-2').addEventListener('click', ()=>{
  state.meta.year = qs('#year').value;
  state.meta.semester = qs('#semester').value;
  state.meta.classNo = qs('#classNo').value.trim();
  state.meta.section = qs('#sectionSelect').value;
  // load students for section
  state.students = (store.sections[state.meta.section] || []).map(s=>({name:s.name, roll:s.roll}));
  renderStudentsList();
  setStep(3);
});

// Step 3 - Student management
function renderStudentsList(filter=''){
  const list = qs('#studentsList');
  list.innerHTML = '';
  const f = filter.trim().toLowerCase();
  state.students.forEach(s=>{
    if(f && !(s.name.toLowerCase().includes(f) || (s.roll||'').toLowerCase().includes(f))) return;
    const item = document.createElement('div'); item.className='item';
    const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<strong>${s.name}</strong><div class="muted">${s.roll || ''}</div>`;
    const actions = document.createElement('div'); actions.className='actions';
    const del = document.createElement('button'); del.textContent='Delete'; del.className='btn ghost';
    del.addEventListener('click', ()=>{
      if(!confirm('Remove student?')) return;
      state.students = state.students.filter(x=> x.roll !== s.roll);
      saveSection();
      renderStudentsList();
    });
    actions.appendChild(del);
    item.appendChild(meta); item.appendChild(actions);
    list.appendChild(item);
  });
  if(!list.children.length) list.innerHTML = '<div class="muted">No students. Add using form above.</div>';
}
function saveSection(){
  store.sections[state.meta.section] = state.students.map(x=>({name:x.name, roll:x.roll}));
  saveToStorage(store);
}
qs('#addStudent').addEventListener('click', ()=>{
  const name = qs('#studentName').value.trim();
  const roll = qs('#studentRoll').value.trim();
  if(!name) return alert('Enter student name');
  // avoid duplicate roll
  if(roll && state.students.some(s=>s.roll===roll)) return alert('Roll already exists');
  state.students.push({name, roll});
  qs('#studentName').value=''; qs('#studentRoll').value='';
  saveSection();
  renderStudentsList();
});
qs('#searchStudent').addEventListener('input', (e)=> renderStudentsList(e.target.value));
qs('#back-3').addEventListener('click', ()=> setStep(2));
qs('#next-3').addEventListener('click', ()=>{
  // prepare marks for each student default present=false
  state.marks = {};
  state.students.forEach(s=> state.marks[s.roll || s.name] = false);
  renderMarkList();
  qs('#metaInfo').textContent = `${state.meta.subject} • ${state.meta.classNo} • Sec ${state.meta.section} • ${state.meta.date}`;
  setStep(4);
});

// Step 4 - Marking UI
function renderMarkList(filter=''){
  const list = qs('#markList'); list.innerHTML='';
  const f = filter.trim().toLowerCase();
  state.students.forEach(s=>{
    if(f && !(s.name.toLowerCase().includes(f) || (s.roll||'').toLowerCase().includes(f))) return;
    const key = s.roll || s.name;
    const item = document.createElement('div'); item.className='item ' + (state.marks[key] ? 'present' : 'absent');
    const meta = document.createElement('div'); meta.className='meta';
    meta.innerHTML = `<strong>${s.name}</strong><div class="muted">${s.roll || ''}</div>`;
    const actions = document.createElement('div'); actions.className='actions';
    const toggle = document.createElement('button'); toggle.textContent = state.marks[key] ? 'Present' : 'Absent'; toggle.className='btn';
    toggle.addEventListener('click', ()=>{
      state.marks[key] = !state.marks[key];
      renderMarkList(qs('#searchMark').value);
    });
    actions.appendChild(toggle);
    item.appendChild(meta); item.appendChild(actions);
    list.appendChild(item);
  });
  if(!list.children.length) list.innerHTML = '<div class="muted">No students to mark.</div>';
}
qs('#searchMark').addEventListener('input', (e)=> renderMarkList(e.target.value));
qs('#markAllPresent').addEventListener('click', ()=>{
  state.students.forEach(s=> state.marks[s.roll || s.name] = true); renderMarkList();
});
qs('#markAllAbsent').addEventListener('click', ()=>{
  state.students.forEach(s=> state.marks[s.roll || s.name] = false); renderMarkList();
});
qs('#back-4').addEventListener('click', ()=> setStep(3));
qs('#next-4').addEventListener('click', ()=>{
  // compute summary
  setSummary();
  setStep(5);
});

// Step 5 - Summary & Save
function setSummary(){
  const total = state.students.length;
  let presentCount = 0;
  const rows = [];
  state.students.forEach(s=>{
    const key = s.roll || s.name;
    const pres = !!state.marks[key];
    if(pres) presentCount++;
    rows.push({ name:s.name, roll:s.roll, present: pres ? 1 : 0 });
  });
  const pct = total ? Math.round((presentCount/total)*100) : 0;
  const summaryEl = qs('#summary');
  summaryEl.innerHTML = `<div>Total Students: ${total}</div>
                         <div>Present: ${presentCount}</div>
                         <div>Percentage: <strong style="color:${pct<75 ? '#fff' : '#a3e635'}">${pct}%</strong></div>
                         ${pct<75 ? '<div style="color:#fda4af">Warning: less than 75%</div>' : ''}`;
  // Keep last computed for download/save
  state._lastExport = { meta: {...state.meta}, total, presentCount, pct, rows };
}
qs('#back-5').addEventListener('click', ()=> setStep(4));
qs('#save').addEventListener('click', ()=>{
  // push record to store.records
  const rec = {
    id: 'rec_' + Date.now(),
    meta: {...state.meta},
    rows: state._lastExport.rows,
    total: state._lastExport.total,
    present: state._lastExport.presentCount,
    pct: state._lastExport.pct,
    savedAt: new Date().toISOString()
  };
  store.records = store.records || [];
  store.records.unshift(rec);
  saveToStorage(store);
  alert('Saved locally');
  populateSavedRecords();
});
qs('#downloadCSV').addEventListener('click', ()=> {
  const exp = state._lastExport;
  if(!exp) return alert('No summary to download');
  const lines = [];
  lines.push(['Subject', exp.meta.subject]);
  lines.push(['Teacher', exp.meta.teacher]);
  lines.push(['Date', exp.meta.date]);
  lines.push(['Class', exp.meta.classNo]);
  lines.push([]);
  lines.push(['Name','Roll','Present(1/0)']);
  exp.rows.forEach(r=> lines.push([r.name || '', r.roll || '', r.present]));
  // convert to CSV
  const csv = lines.map(r => r.map(cell => `"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${exp.meta.subject}_${exp.meta.date}.csv`; a.click();
});

// populate saved records dropdown
function populateSavedRecords(){
  const sel = qs('#savedRecords'); sel.innerHTML='';
  (store.records || []).forEach(r=>{
    const opt = document.createElement('option'); opt.value = r.id; opt.textContent = `${r.meta.date} • ${r.meta.subject} • ${r.meta.classNo} • Sec ${r.meta.section}`;
    sel.appendChild(opt);
  });
}
qs('#loadRecord').addEventListener('click', ()=>{
  const id = qs('#savedRecords').value;
  if(!id) return alert('Choose saved record');
  const rec = (store.records || []).find(r=>r.id === id);
  if(!rec) return alert('Record not found');
  // show record rows in summary area
  const total = rec.total, present = rec.present;
  const pct = rec.pct;
  qs('#summary').innerHTML = `<div>Loaded record savedAt: ${rec.savedAt}</div>
    <div>Total: ${total}</div><div>Present: ${present}</div><div>Percent: ${pct}%</div>
    <div style="margin-top:8px"><strong>Students:</strong></div>
    ${rec.rows.map(rr=>`<div>${rr.name} (${rr.roll||''}) - ${rr.present ? 'Present' : 'Absent'}</div>`).join('')}`;
});
qs('#deleteRecord').addEventListener('click', ()=>{
  const id = qs('#savedRecords').value;
  if(!id) return alert('Choose saved record');
  if(!confirm('Delete record?')) return;
  store.records = (store.records||[]).filter(r=>r.id!==id);
  saveToStorage(store);
  populateSavedRecords();
});

// initial populate
(function init(){
  // default date = today
  const d = new Date(); qs('#date').value = d.toISOString().slice(0,10);
  // load sections into state
  state.sections = store.sections || {};
  populateSections();
  populateSavedRecords();
})();