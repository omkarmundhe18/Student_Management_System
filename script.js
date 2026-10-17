"use strict";

const STORAGE_KEY = "studentProRecords";
const ATTENDANCE_KEY = "studentAttendanceRecords";
const THEME_KEY = "studentProTheme";

const $ = (id) => document.getElementById(id);

const form = $("studentForm");
const editId = $("editId");
const nameInput = $("name");
const rollInput = $("rollNo");
const emailInput = $("email");
const phoneInput = $("phone");
const courseInput = $("course");
const genderInput = $("gender");

const studentTable = $("studentTable");
const searchInput = $("searchInput");
const courseFilter = $("courseFilter");
const sortBy = $("sortBy");
const pageSize = $("pageSize");
const submitBtn = $("submitBtn");
const formTitle = $("formTitle");
const cancelEdit = $("cancelEdit");

let students = loadStudents();
let currentPage = 1;
let attendance = loadAttendanceRecords();

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : [];

    return Array.isArray(data)
      ? data.filter((s) =>
          s &&
          typeof s.id === "string" &&
          typeof s.name === "string" &&
          typeof s.rollNo === "string" &&
          typeof s.email === "string" &&
          typeof s.phone === "string" &&
          typeof s.course === "string" &&
          typeof s.gender === "string"
        )
      : [];
  } catch (error) {
    console.error("Could not load students:", error);
    return [];
  }
}

function saveStudents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    return true;
  } catch (error) {
    console.error(error);
    alert("Student data save zala nahi. Browser storage check kara.");
    return false;
  }
}

function loadAttendanceRecords() {
  try {
    const data = JSON.parse(
      localStorage.getItem(ATTENDANCE_KEY) || "{}"
    );

    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : {};
  } catch (error) {
    console.error("Could not load attendance:", error);
    return {};
  }
}

function saveAttendanceRecords() {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
    return true;
  } catch (error) {
    console.error(error);
    alert("Attendance save zali nahi. Browser storage check kara.");
    return false;
  }
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

$("today").textContent = new Date().toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

// ADD OR UPDATE STUDENT
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const student = {
    id: editId.value || createId(),
    name: nameInput.value.trim(),
    rollNo: rollInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    course: courseInput.value,
    gender: genderInput.value
  };

  if (
    !student.name ||
    !student.rollNo ||
    !student.email ||
    !student.phone ||
    !student.course ||
    !student.gender
  ) {
    alert("Please fill all required fields.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    alert("Please enter a valid Email ID.");
    emailInput.focus();
    return;
  }

  if (!/^[6-9][0-9]{9}$/.test(student.phone)) {
    alert("Enter a valid 10-digit Indian mobile number.");
    phoneInput.focus();
    return;
  }

  const duplicate = students.some(
    (s) =>
      s.rollNo.toLowerCase() === student.rollNo.toLowerCase() &&
      s.id !== student.id
  );

  if (duplicate) {
    alert("This Roll Number already exists!");
    rollInput.focus();
    return;
  }

  const index = students.findIndex((s) => s.id === student.id);
  const previousStudents = [...students];

  if (index >= 0) {
    students[index] = student;
  } else {
    students.push(student);
  }

  if (!saveStudents()) {
    students = previousStudents;
    return;
  }

  alert(index >= 0 ? "Student updated successfully!" : "Student added successfully!");

  resetForm();
  renderStudents();
  renderAttendance();
});

// UNIQUE ID
function createId() {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Date.now().toString() + Math.random().toString(16).slice(2);
}

// SEARCH, FILTER, SORT AND PAGINATION
function getFilteredStudents() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCourse = courseFilter.value;

  const result = students.filter((student) => {
    const searchable = [
      student.name,
      student.rollNo,
      student.email,
      student.phone,
      student.course,
      student.gender
    ].join(" ").toLowerCase();

    return searchable.includes(query) &&
      (!selectedCourse || student.course === selectedCourse);
  });

  const sortMode = sortBy.value;

  result.sort((a, b) => {
    switch (sortMode) {
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "roll-asc":
        return a.rollNo.localeCompare(b.rollNo, undefined, {
          numeric: true,
          sensitivity: "base"
        });
      case "course-asc":
        return a.course.localeCompare(b.course) ||
          a.name.localeCompare(b.name);
      case "name-asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return result;
}

function renderStudents() {
  const filtered = getFilteredStudents();
  const limit = Math.max(1, Number(pageSize.value) || 10);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));

  currentPage = Math.min(currentPage, totalPages);
  currentPage = Math.max(currentPage, 1);

  const start = (currentPage - 1) * limit;
  const visibleStudents = filtered.slice(start, start + limit);

  studentTable.replaceChildren();

  if (visibleStudents.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = students.length === 0
      ? "No students yet. Add your first student above."
      : "No matching students found.";
    row.appendChild(cell);
    studentTable.appendChild(row);
  } else {
    visibleStudents.forEach((student) => {
      const row = document.createElement("tr");

      const studentCell = document.createElement("td");
      const studentName = document.createElement("span");
      const studentEmail = document.createElement("span");

      studentName.className = "student-name";
      studentEmail.className = "student-email";
      studentName.textContent = student.name;
      studentEmail.textContent = student.email;
      studentCell.append(studentName, studentEmail);
      row.appendChild(studentCell);

      addCell(row, student.rollNo);

      const courseCell = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "course-badge";
      badge.textContent = student.course;
      courseCell.appendChild(badge);
      row.appendChild(courseCell);

      addCell(row, student.gender);
      addCell(row, student.phone);

      const actionsCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "action-buttons";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "action-btn edit-btn";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", "Edit " + student.name);
      editButton.addEventListener("click", () => editStudent(student.id));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "action-btn delete-btn";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", "Delete " + student.name);
      deleteButton.addEventListener("click", () => deleteStudent(student.id));

      actions.append(editButton, deleteButton);
      actionsCell.appendChild(actions);
      row.appendChild(actionsCell);

      studentTable.appendChild(row);
    });
  }

  $("totalStudents").textContent = students.length;
  $("maleStudents").textContent =
    students.filter((s) => s.gender === "Male").length;
  $("femaleStudents").textContent =
    students.filter((s) => s.gender === "Female").length;
  $("totalCourses").textContent =
    new Set(students.map((s) => s.course)).size;

  $("recordCount").textContent =
    `${filtered.length} of ${students.length} records`;

  $("pageInfo").textContent =
    `Page ${currentPage} of ${totalPages}`;

  $("prevPage").disabled = currentPage <= 1;
  $("nextPage").disabled = currentPage >= totalPages;

  renderCharts();
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
}

// EDIT STUDENT
function editStudent(id) {
  const student = students.find((s) => s.id === id);
  if (!student) return;

  editId.value = student.id;
  nameInput.value = student.name;
  rollInput.value = student.rollNo;
  emailInput.value = student.email;
  phoneInput.value = student.phone;
  courseInput.value = student.course;
  genderInput.value = student.gender;

  formTitle.textContent = "Edit Student";
  submitBtn.textContent = "Update Student";
  cancelEdit.hidden = false;

  $("student-form").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
  nameInput.focus({ preventScroll: true });
}

// DELETE STUDENT
function deleteStudent(id) {
  const student = students.find((s) => s.id === id);
  if (!student) return;

  if (!confirm(`Delete ${student.name} (${student.rollNo})?`)) return;

  const previousStudents = [...students];
  students = students.filter((s) => s.id !== id);

  if (!saveStudents()) {
    students = previousStudents;
    return;
  }

  // Remove the deleted student's attendance from all dates.
  const previousAttendance = JSON.stringify(attendance);

  Object.keys(attendance).forEach((date) => {
    if (attendance[date] && typeof attendance[date] === "object") {
      delete attendance[date][id];
    }
  });

  if (!saveAttendanceRecords()) {
    attendance = JSON.parse(previousAttendance);
  }

  if (editId.value === id) resetForm();

  renderStudents();
  renderAttendance();
}

// RESET FORM
function resetForm() {
  form.reset();
  editId.value = "";
  formTitle.textContent = "Add New Student";
  submitBtn.textContent = "+ Add Student";
  cancelEdit.hidden = true;
}

form.addEventListener("reset", () => {
  setTimeout(() => {
    editId.value = "";
    formTitle.textContent = "Add New Student";
    submitBtn.textContent = "+ Add Student";
    cancelEdit.hidden = true;
  }, 0);
});

cancelEdit.addEventListener("click", resetForm);

// SEARCH / FILTER / SORT
searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderStudents();
});

courseFilter.addEventListener("change", () => {
  currentPage = 1;
  renderStudents();
});

sortBy.addEventListener("change", () => {
  currentPage = 1;
  renderStudents();
});

pageSize.addEventListener("change", () => {
  currentPage = 1;
  renderStudents();
});

$("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderStudents();
  }
});

$("nextPage").addEventListener("click", () => {
  const limit = Math.max(1, Number(pageSize.value) || 10);
  const totalPages = Math.max(
    1,
    Math.ceil(getFilteredStudents().length / limit)
  );

  if (currentPage < totalPages) {
    currentPage++;
    renderStudents();
  }
});

// ATTENDANCE
const attendanceDate = $("attendanceDate");
attendanceDate.value = todayString();

function renderAttendance() {
  const date = attendanceDate.value || todayString();
  const records = attendance[date] || {};

  const tbody = $("attendanceTableBody");
  tbody.replaceChildren();

  let present = 0;
  let absent = 0;

  students.forEach((student) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const rollCell = document.createElement("td");
    const courseCell = document.createElement("td");
    const statusCell = document.createElement("td");

    nameCell.textContent = student.name;
    rollCell.textContent = student.rollNo;
    courseCell.textContent = student.course;

    const select = document.createElement("select");
    select.className = "attendance-status";
    select.setAttribute("aria-label", "Attendance for " + student.name);

    [
      ["Present", "Present"],
      ["Absent", "Absent"],
      ["Unmarked", "Not marked"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });

    select.value = records[student.id] || "Unmarked";

    if (select.value === "Present") present++;
    if (select.value === "Absent") absent++;

    select.addEventListener("change", () => {
      updateAttendanceSummary();
    });

    statusCell.appendChild(select);
    row.append(nameCell, rollCell, courseCell, statusCell);
    tbody.appendChild(row);
  });

  if (students.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "empty-state";
    cell.textContent = "Add students before taking attendance.";
    row.appendChild(cell);
    tbody.appendChild(row);
  }

  $("attendanceTotal").textContent = students.length;
  $("attendancePresent").textContent = present;
  $("attendanceAbsent").textContent = absent;

  renderCharts();
}

function updateAttendanceSummary() {
  let present = 0;
  let absent = 0;

  document.querySelectorAll("#attendanceTableBody .attendance-status")
    .forEach((select) => {
      if (select.value === "Present") present++;
      if (select.value === "Absent") absent++;
    });

  $("attendanceTotal").textContent = students.length;
  $("attendancePresent").textContent = present;
  $("attendanceAbsent").textContent = absent;
}

$("loadAttendance").addEventListener("click", renderAttendance);
attendanceDate.addEventListener("change", renderAttendance);

$("saveAttendance").addEventListener("click", () => {
  const date = attendanceDate.value;

  if (!date) {
    alert("Please select an attendance date.");
    return;
  }

  const dateRecords = {};

  document.querySelectorAll("#attendanceTableBody tr").forEach((row) => {
    const selects = row.querySelectorAll(".attendance-status");
    if (!selects.length) return;

    const index = Array.from(
      $("attendanceTableBody").querySelectorAll("tr")
    ).indexOf(row);

    const student = students[index];
    if (student && selects[0].value !== "Unmarked") {
      dateRecords[student.id] = selects[0].value;
    }
  });

  const previousAttendance = JSON.stringify(attendance);
  attendance[date] = dateRecords;

  if (!saveAttendanceRecords()) {
    attendance = JSON.parse(previousAttendance);
    return;
  }

  alert("Attendance saved successfully!");
  renderAttendance();
});

// CHARTS
function renderCharts() {
  const courseChart = $("courseChart");
  const attendanceChart = $("attendanceChart");

  if (!courseChart || !attendanceChart) return;

  courseChart.replaceChildren();
  attendanceChart.replaceChildren();

  const courseCounts = {};
  students.forEach((student) => {
    courseCounts[student.course] = (courseCounts[student.course] || 0) + 1;
  });

  const courseEntries = Object.entries(courseCounts);
  if (courseEntries.length === 0) {
    courseChart.textContent = "Add students to view course statistics.";
  } else {
    const maxCount = Math.max(...courseEntries.map(([, count]) => count));

    courseEntries.forEach(([course, count]) => {
      const row = document.createElement("div");
      row.className = "chart-row";

      const label = document.createElement("div");
      label.className = "chart-row-label";

      const name = document.createElement("span");
      name.textContent = course;

      const number = document.createElement("strong");
      number.textContent = String(count);

      label.append(name, number);

      const track = document.createElement("div");
      track.className = "chart-track";

      const fill = document.createElement("div");
      fill.className = "chart-fill";
      fill.style.width = `${(count / maxCount) * 100}%`;

      track.appendChild(fill);
      row.append(label, track);
      courseChart.appendChild(row);
    });
  }

  const date = attendanceDate?.value || todayString();
  const records = attendance[date] || {};
  const marked = Object.values(records);
  const present = marked.filter((status) => status === "Present").length;
  const absent = marked.filter((status) => status === "Absent").length;
  const totalMarked = present + absent;

  if (totalMarked === 0) {
    attendanceChart.textContent =
      "Save attendance records to view the attendance chart.";
    return;
  }

  [
    ["Present", present],
    ["Absent", absent]
  ].forEach(([label, count]) => {
    const row = document.createElement("div");
    row.className = "chart-row";

    const title = document.createElement("div");
    title.className = "chart-row-label";

    const labelSpan = document.createElement("span");
    labelSpan.textContent = label;

    const countSpan = document.createElement("strong");
    countSpan.textContent =
      `${count} (${Math.round((count / totalMarked) * 100)}%)`;

    title.append(labelSpan, countSpan);

    const track = document.createElement("div");
    track.className = "chart-track";

    const fill = document.createElement("div");
    fill.className = "chart-fill";
    fill.style.width = `${(count / totalMarked) * 100}%`;

    track.appendChild(fill);
    row.append(title, track);
    attendanceChart.appendChild(row);
  });
}

// DARK MODE
function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark-mode", dark);

  const button = $("themeToggle");
  button.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";
  button.setAttribute("aria-pressed", String(dark));
}

let savedTheme = "light";
try {
  savedTheme = localStorage.getItem(THEME_KEY) || "light";
} catch (error) {
  console.warn("Theme preference unavailable:", error);
}

applyTheme(savedTheme);

$("themeToggle").addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-mode")
    ? "light"
    : "dark";

  applyTheme(nextTheme);

  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    console.warn("Could not save theme preference:", error);
  }
});

// INITIAL RENDER
renderStudents();
renderAttendance();