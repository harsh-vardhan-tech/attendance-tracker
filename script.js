// ----- JS for College Attendance Tracker -----

// ----- LocalStorage Keys -----
const LS_KEY = 'attendance_subjects_v1';
const LS_SEL = 'attendance_selected_subject_v1';
const LS_SEC = 'attendance_selected_section_v1';
const LS_DATE = 'attendance_selected_date_v1';

// ----- Data -----
let subjects = [];
let selectedSubjectId = null;
let selectedSectionId = null;
let selectedDate = null;

// ----- UI Elements -----
const newSubjectName = document.getElementById('newSubjectName');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const subjectsList = document.getElementById('subjectsList');

const newSectionName = document.getElementById('newSectionName');
const addSectionBtn = document.getElementById('addSectionBtn');
const sectionsList = document.getElementById('sectionsList');

const attendanceDate = document.getElementById('attendanceDate');
const studentsList = document.getElementById('studentsList');
const stats = document.getElementById('stats');

const studentRoll = document.getElementById('studentRoll');
const studentName = document.getElementById('studentName');
const addStudentBtn = document.getElementById('addStudentBtn');

const subjectTpl = document.getElementById('subjectTpl');
const sectionTpl = document.getElementById('sectionTpl');
const studentTpl = document.getElementById('studentTpl');

const darkToggle = document.getElementById('darkToggle');

// ----- Helpers -----
function uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
}
function findSubject(id) { return subjects.find(s => s.id === id) || null; }
function findSection(subj, secId) { return subj.sections.find(s => s.id === secId) || null; }

// ----- LocalStorage -----
function load() {
    try { subjects = JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { subjects = []; }
    selectedSubjectId = localStorage.getItem(LS_SEL);
    selectedSectionId = localStorage.getItem(LS_SEC);
    selectedDate = localStorage.getItem(LS_DATE) || new Date().toISOString().split('T')[0];
    attendanceDate.value = selectedDate;
}
function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(subjects));
    if (selectedSubjectId) localStorage.setItem(LS_SEL, selectedSubjectId); else localStorage.removeItem(LS_SEL);
    if (selectedSectionId) localStorage.setItem(LS_SEC, selectedSectionId); else localStorage.removeItem(LS_SEC);
    if (selectedDate) localStorage.setItem(LS_DATE, selectedDate); else localStorage.removeItem(LS_DATE);
}

// ----- Render Subjects -----
function renderSubjects() {
    subjectsList.innerHTML = '';
    if (subjects.length === 0) {
        const li = document.createElement('li'); li.className = 'muted'; li.textContent = 'No subjects yet.'; subjectsList.appendChild(li); return;
    }
    subjects.forEach(s => {
        const node = subjectTpl.content.cloneNode(true);
        const li = node.querySelector('li'); const nameEl = node.querySelector('.item-name');
        const editBtn = node.querySelector('.edit'); const removeBtn = node.querySelector('.remove');
        nameEl.textContent = s.name;
        if (s.id === selectedSubjectId) { li.style.background = 'rgba(110,231,183,0.12)'; nameEl.style.fontWeight = '700'; }
        nameEl.style.cursor = 'pointer';
        nameEl.addEventListener('click', () => { selectSubject(s.id); });
        editBtn.addEventListener('click', e => {
            e.stopPropagation();
            const nn = prompt('Edit subject name', s.name);
            if (nn && nn.trim()) { s.name = nn.trim(); save(); renderSubjects(); if (s.id === selectedSubjectId) renderSections(); }
        });
        removeBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (!confirm(`Remove subject "${s.name}"?`)) return;
            subjects = subjects.filter(x => x.id !== s.id);
            if (selectedSubjectId === s.id) selectedSubjectId = null;
            save(); renderSubjects(); renderSections();
        });
        subjectsList.appendChild(node);
    });
    if (!selectedSubjectId && subjects.length) selectSubject(subjects[0].id);
}

// ----- Render Sections -----
function renderSections() {
    sectionsList.innerHTML = '';
    const subj = findSubject(selectedSubjectId); if (!subj) { renderStudents(); return; }
    if (!subj.sections || subj.sections.length === 0) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = 'No sections yet.'; sectionsList.appendChild(li); renderStudents(); return; }
    subj.sections.forEach(sec => {
        const node = sectionTpl.content.cloneNode(true);
        const li = node.querySelector('li'); const nameEl = node.querySelector('.item-name'); const removeBtn = node.querySelector('.remove');
        nameEl.textContent = sec.name;
        removeBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (!confirm(`Remove section "${sec.name}"?`)) return;
            subj.sections = subj.sections.filter(x => x.id !== sec.id);
            if (selectedSectionId === sec.id) selectedSectionId = null;
            save(); renderSections(); renderStudents();
        });
        nameEl.style.cursor = 'pointer';
        nameEl.addEventListener('click', () => { selectedSectionId = sec.id; save(); renderSections(); renderStudents(); });
        if (sec.id === selectedSectionId) { li.style.background = 'rgba(59,130,246,0.12)'; nameEl.style.fontWeight = '700'; }
        sectionsList.appendChild(node);
    });
    renderStudents();
}

// ----- Render Students + Attendance -----
function renderStudents() {
    studentsList.innerHTML = '';
    stats.textContent = '';
    const subj = findSubject(selectedSubjectId); if (!subj) return;
    const sec = findSection(subj, selectedSectionId); if (!sec) { studentsList.innerHTML = '<li class="muted">Select a section to see students.</li>'; return; }
    if (!sec.students || sec.students.length === 0) { studentsList.innerHTML = '<li class="muted">No students in this section yet.</li>'; return; }
    if (!sec.attendance) sec.attendance = {};
    if (!sec.attendance[selectedDate]) sec.attendance[selectedDate] = {};

    sec.students.forEach(st => {
        const node = studentTpl.content.cloneNode(true);
        const li = node.querySelector('li'); const nameEl = node.querySelector('.item-name');
        const removeBtn = node.querySelector('.remove'); const tick = node.querySelector('.attendanceTick');
        nameEl.textContent = `${st.roll} — ${st.name}`;
        tick.checked = sec.attendance[selectedDate][st.id] || false;
        tick.addEventListener('change', () => { sec.attendance[selectedDate][st.id] = tick.checked; save(); renderStats(); });
        removeBtn.addEventListener('click', () => { if (!confirm(`Remove student ${st.name}?`)) return; sec.students = sec.students.filter(x => x.id !== st.id); for (let dt in sec.attendance) { delete sec.attendance[dt][st.id]; } save(); renderStudents(); });
        studentsList.appendChild(node);
    });
    renderStats();
}

// ----- Stats -----
function renderStats() {
    const subj = findSubject(selectedSubjectId); if (!subj) return;
    const sec = findSection(subj, selectedSectionId); if (!sec || !sec.students || sec.students.length === 0) { stats.textContent = ''; return; }
    let totalClasses = Object.keys(sec.attendance || {}).length;
    let statText = `Total Classes: ${totalClasses} | `;
    statText += sec.students.map(st => {
        let present = 0;
        for (let dt in sec.attendance) { if (sec.attendance[dt][st.id]) present++; }
        let perc = Math.round((present / totalClasses) * 100) || 0;
        return `${st.roll}: ${perc}%${perc < 75 ? ' ⚠️' : ''}`;
    }).join(' | ');
    stats.textContent = statText;
}

// ----- Actions -----
function addSubject() { const name = (newSubjectName.value || '').trim(); if (!name) { alert('Enter subject'); return; } if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) { alert('Exists'); return; } subjects.push({ id: uid('sub'), name, sections: [] }); newSubjectName.value = ''; save(); renderSubjects(); }
function selectSubject(id) { selectedSubjectId = id; selectedSectionId = null; save(); renderSubjects(); renderSections(); }
function addSection() { const name = (newSectionName.value || '').trim(); if (!name) { alert('Enter section'); return; } const subj = findSubject(selectedSubjectId); if (!subj) { alert('Select subject'); return; } if (subj.sections.some(x => x.name.toLowerCase() === name.toLowerCase())) { alert('Exists'); return; } subj.sections.push({ id: uid('sec'), name, students: [], attendance: {} }); newSectionName.value = ''; save(); renderSections(); renderSubjects(); }
function addStudent() { const roll = (studentRoll.value || '').trim(); const name = (studentName.value || '').trim(); if (!roll || !name) { alert('Enter both roll and name'); return; } const subj = findSubject(selectedSubjectId); if (!subj) return; const sec = findSection(subj, selectedSectionId); if (!sec) return; if (sec.students.some(s => s.roll === roll)) { alert('Roll exists'); return; } sec.students.push({ id: uid('stu'), roll, name }); studentRoll.value = ''; studentName.value = ''; save(); renderStudents(); }

// ----- Event Bindings -----
addSubjectBtn.addEventListener('click', () => { addSubject(); renderSections(); });
addSectionBtn.addEventListener('click', () => { addSection(); });
addStudentBtn.addEventListener('click', () => { addStudent(); });
attendanceDate.addEventListener('change', () => { selectedDate = attendanceDate.value; save(); renderStudents(); });
darkToggle.addEventListener('click', () => { document.body.classList.toggle('dark'); darkToggle.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark'; });

// ----- Init -----
load(); renderSubjects(); renderSections();
