let students = JSON.parse(localStorage.getItem("students")) || [];

function saveData() {
  localStorage.setItem("students", JSON.stringify(students));
}

function renderTable() {
  const tbody = document.querySelector("#studentTable tbody");
  tbody.innerHTML = "";

  let search = document.getElementById("search").value.toLowerCase();

  students
    .filter(s => s.name.toLowerCase().includes(search) || s.roll.includes(search))
    .forEach((s, i) => {
      let percent = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
      let row = `
        <tr class="${percent < 75 ? 'low' : 'high'}">
          <td>${s.roll}</td>
          <td>${s.name}</td>
          <td>${s.present}</td>
          <td>${s.total}</td>
          <td>${percent}%</td>
          <td>
            <button onclick="markPresent(${i})">✔ Present</button>
            <button onclick="markAbsent(${i})">✖ Absent</button>
          </td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
}

function addStudent() {
  let roll = document.getElementById("roll").value;
  let name = document.getElementById("name").value;

  if (roll && name) {
    students.push({ roll, name, present: 0, total: 0 });
    saveData();
    renderTable();
    document.getElementById("roll").value = "";
    document.getElementById("name").value = "";
  }
}

function markPresent(i) {
  students[i].present++;
  students[i].total++;
  saveData();
  renderTable();
}

function markAbsent(i) {
  students[i].total++;
  saveData();
  renderTable();
}

document.getElementById("addStudent").addEventListener("click", addStudent);
document.getElementById("search").addEventListener("input", renderTable);
document.getElementById("sortByRoll").addEventListener("click", () => {
  students.sort((a,b) => a.roll.localeCompare(b.roll));
  renderTable();
});
document.getElementById("sortByAttendance").addEventListener("click", () => {
  students.sort((a,b) => ((b.present/b.total)||0) - ((a.present/a.total)||0));
  renderTable();
});
document.getElementById("exportCSV").addEventListener("click", () => {
  let csv = "Roll,Name,Present,Total,Percentage\n";
  students.forEach(s => {
    let percent = s.total>0 ? Math.round((s.present/s.total)*100) : 0;
    csv += `${s.roll},${s.name},${s.present},${s.total},${percent}%\n`;
  });
  let blob = new Blob([csv], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "attendance.csv";
  link.click();
});
document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

renderTable();
