// script.js
// Subjects, Sections & Students manager (stored in localStorage)

const LS_KEY = 'attendance_subjects_v1';
const LS_SEL = 'attendance_selected_subject_v1';
const LS_SEC = 'attendance_selected_section_v1';

let subjects = [];
let selectedSubjectId = null;
let selectedSectionId = null;

// UI refs
const newSubjectName = document.getElementById('newSubjectName');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const subjectsList = document.getElementById('subjectsList');

const newSectionName = document.getElementById('newSectionName');
const addSectionBtn = document.getElementById('addSectionBtn');
const sectionsList = document.getElementById('sectionsList');

const selectedSubjectName = document.getElementById('selectedSubjectName');

const subjectTpl = document.getElementById('subjectTpl');
const sectionTpl = document.getElementById('sectionTpl');

const darkToggle = document.getElementById('darkToggle');

// ----- storage -----
function load() {
  try {
    subjects = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch (e) {
    subjects = [];
  }
  selectedSubjectId = localStorage.getItem(LS_SEL);
  selectedSectionId = localStorage.getItem(LS_SEC);
}
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(subjects));
  if (selectedSubjectId) localStorage.setItem(LS_SEL, selectedSubjectId);
  else localStorage.removeItem(LS_SEL);
  if (selectedSectionId) localStorage.setItem(LS_SEC, selectedSectionId);
  else localStorage.removeItem(LS_SEC);
}

// ----- helpers -----
function uid(prefix='id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random()*9000+1000)}`;
}
function findSubject(id) {
  return subjects.find(s => s.id === id) || null;
}

// ----- render -----
function renderSubjects() {
  subjectsList.innerHTML = '';
  if (subjects.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No subjects yet. Add one above.';
    subjectsList.appendChild(li);
    selectedSubjectName.textContent = 'None';
    sectionsList.innerHTML = '';
    return;
  }

  subjects.forEach(s => {
    const node = subjectTpl.content.cloneNode(true);
    const li = node.querySelector('li');
    const nameEl = node.querySelector('.item-name');
    const editBtn = node.querySelector('.edit');
    const removeBtn = node.querySelector('.remove');

    nameEl.textContent = s.name;
    if (s.id === selectedSubjectId) {
      li.style.background = 'linear-gradient(90deg, rgba(110,231,183,0.12), transparent)';
      nameEl.style.fontWeight = '700';
    }

    // click selects subject
    nameEl.style.cursor = 'pointer';
    nameEl.addEventListener('click', () => {
      selectSubject(s.id);
    });

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nn = prompt('Edit subject name', s.name);
      if (nn && nn.trim()) {
        s.name = nn.trim();
        save(); renderSubjects(); if (s.id === selectedSubjectId) renderSections();
      }
    });

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm(`Remove subject "${s.name}" and all its sections?`)) return;
      subjects = subjects.filter(x => x.id !== s.id);
      if (s.id === selectedSubjectId) selectedSubjectId = null;
      save(); renderSubjects(); renderSections();
    });

    subjectsList.appendChild(node);
  });

  // if nothing selected, auto-select first
  if (!selectedSubjectId && subjects.length) {
    selectSubject(subjects[0].id);
  } else {
    selectedSubjectName.textContent = (findSubject(selectedSubjectId) || {name:'None'}).name;
  }
}

function renderSections() {
  sectionsList.innerHTML = '';
  const subject = findSubject(selectedSubjectId);
  if (!subject) {
    selectedSubjectName.textContent = 'None';
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Select a subject to see its sections.';
    sectionsList.appendChild(li);
    renderStudents();
    return;
  }

  selectedSubjectName.textContent = subject.name;

  if (!subject.sections || subject.sections.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No sections yet. Add a section below.';
    sectionsList.appendChild(li);
    renderStudents();
    return;
  }

  subject.sections.forEach(sec => {
    const node = sectionTpl.content.cloneNode(true);
    const li = node.querySelector('li');
    const nameEl = node.querySelector('.item-name');
    const removeBtn = node.querySelector('.remove');

    nameEl.textContent = sec.name;

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm(`Remove section "${sec.name}" from subject "${subject.name}"?`)) return;
      subject.sections = subject.sections.filter(x => x.id !== sec.id);
      if (selectedSectionId === sec.id) selectedSectionId = null;
      save(); renderSections(); renderStudents();
    });

    // click to select this section
    nameEl.style.cursor = 'pointer';
    nameEl.addEventListener('click', () => {
      selectedSectionId = sec.id;
      save();
      renderSections();
      renderStudents();
    });

    if (sec.id === selectedSectionId) {
      li.style.background = 'linear-gradient(90deg, rgba(59,130,246,0.12), transparent)';
      nameEl.style.fontWeight = '700';
    }

    sectionsList.appendChild(node);
  });

  renderStudents();
}

// ----- actions -----
function addSubject() {
  const name = (newSubjectName.value || '').trim();
  if (!name) { alert('Enter subject name'); return; }
  if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    alert('Subject with this name already exists');
    return;
  }
  const s = { id: uid('sub'), name, sections: [] };
  subjects.push(s);
  newSubjectName.value = '';
  save();
  selectSubject(s.id);
  renderSubjects();
}

function selectSubject(id) {
  selectedSubjectId = id;
  selectedSectionId = null;
  save();
  renderSubjects();
  renderSections();
}

function addSection() {
  const name = (newSectionName.value || '').trim();
  if (!name) { alert('Enter section name'); return; }
  const subj = findSubject(selectedSubjectId);
  if (!subj) { alert('Select a subject first'); return; }
  if (!subj.sections) subj.sections = [];
  if (subj.sections.some(x => x.name.toLowerCase() === name.toLowerCase())) {
    alert('Section with this name already exists in selected subject');
    return;
  }
  subj.sections.push({ id: uid('sec'), name, students: [] });
  newSectionName.value = '';
  save();
  renderSections();
  renderSubjects();
}

// ----- Students -----
const studentRoll = document.getElementById('studentRoll');
const studentName = document.getElementById('studentName');
const addStudentBtn = document.getElementById('addStudentBtn');
const studentsList = document.getElementById('studentsList');

function renderStudents() {
  studentsList.innerHTML = '';
  const subj = findSubject(selectedSubjectId);
  if (!subj) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Select a subject first.';
    studentsList.appendChild(li);
    return;
  }
  const sec = subj.sections.find(x => x.id === selectedSectionId);
  if (!sec) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Select a section to see students.';
    studentsList.appendChild(li);
    return;
  }
  if (!sec.students || sec.students.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No students in this section yet.';
    studentsList.appendChild(li);
    return;
  }

  sec.students.forEach(st => {
    const li = document.createElement('li');
    li.className = 'item-row';
    li.innerHTML = `
      <span class="item-name">${st.roll} — ${st.name}</span>
      <span class="item-actions">
        <button class="btn small danger">Remove</button>
      </span>
    `;
    li.querySelector('button').addEventListener('click', () => {
      if (!confirm(`Remove student ${st.name}?`)) return;
      sec.students = sec.students.filter(x => x.id !== st.id);
      save(); renderStudents();
    });
    studentsList.appendChild(li);
  });
}

function addStudent() {
  const roll = (studentRoll.value || '').trim();
  const name = (studentName.value || '').trim();
  if (!roll || !name) {
    alert('Enter both roll no and name');
    return;
  }
  const subj = findSubject(selectedSubjectId);
  if (!subj) { alert('Select a subject first'); return; }
  const sec = subj.sections.find(x => x.id === selectedSectionId);
  if (!sec) { alert('Select a section first'); return; }
  if (!sec.students) sec.students = [];
  if (sec.students.some(s => s.roll === roll)) {
    alert('Roll no already exists in this section');
    return;
  }
  sec.students.push({ id: uid('stu'), roll, name });
  studentRoll.value = '';
  studentName.value = '';
  save(); renderStudents();
}

addStudentBtn.addEventListener('click', addStudent);
studentRoll.addEventListener('keydown', (e) => { if (e.key==='Enter') addStudent(); });
studentName.addEventListener('keydown', (e) => { if (e.key==='Enter') addStudent(); });

// ----- bindings -----
addSubjectBtn.addEventListener('click', addSubject);
addSectionBtn.addEventListener('click', addSection);

newSubjectName.addEventListener('keydown', (e) => { if (e.key === 'Enter') addSubject(); });
newSectionName.addEventListener('keydown', (e) => { if (e.key === 'Enter') addSection(); });

darkToggle && darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  darkToggle.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark';
});

// ----- init -----
load();
renderSubjects();
renderSections();
