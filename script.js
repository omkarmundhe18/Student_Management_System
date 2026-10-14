const STORAGE_KEY = "studentProRecords";

const form = document.getElementById("studentForm");
const editId = document.getElementById("editId");
const nameInput = document.getElementById("name");
const rollInput = document.getElementById("rollNo");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const courseInput = document.getElementById("course");
const genderInput = document.getElementById("gender");

const studentTable = document.getElementById("studentTable");
const searchInput = document.getElementById("searchInput");
const courseFilter = document.getElementById("courseFilter");
const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");
const cancelEdit = document.getElementById("cancelEdit");

// Load saved data from browser
let students = loadStudents();

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : [];

    return Array.isArray(data)
      ? data.filter(
          (student) =>
            student &&
            typeof student.id === "string" &&
            typeof student.name === "string" &&
            typeof student.rollNo === "string" &&
            typeof student.email === "string" &&
            typeof student.phone === "string" &&
            typeof student.course === "string" &&
            typeof student.gender === "string",
        )
      : [];
  } catch (error) {
    console.error("Could not load student records:", error);
    return [];
  }
}

function saveStudents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    return true;
  } catch (error) {
    alert("Data save zala nahi. Browser storage check kara.");
    console.error(error);
    return false;
  }
}

// Today's date
document.getElementById("today").textContent = new Date().toLocaleDateString(
  "en-IN",
  {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
);

// Add or update student
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const student = {
    id:
      editId.value ||
      (typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString(16).slice(2)),
    name: nameInput.value.trim(),
    rollNo: rollInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    course: courseInput.value,
    gender: genderInput.value,
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

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[6-9][0-9]{9}$/;

  if (!emailPattern.test(student.email)) {
    alert("Please enter a valid Email ID!");
    emailInput.focus();
    return;
  }

  if (!phonePattern.test(student.phone)) {
    alert("Enter a valid 10-digit Indian mobile number!");
    phoneInput.focus();
    return;
  }

  const duplicate = students.some(
    (existing) =>
      existing.rollNo.toLowerCase() === student.rollNo.toLowerCase() &&
      existing.id !== student.id,
  );

  if (duplicate) {
    alert("This Roll Number already exists!");
    rollInput.focus();
    return;
  }

  const existingIndex = students.findIndex(
    (existing) => existing.id === student.id,
  );

  if (existingIndex >= 0) {
    const previous = students[existingIndex];
    students[existingIndex] = student;

    if (!saveStudents()) {
      students[existingIndex] = previous;
      return;
    }

    alert("Student updated successfully!");
  } else {
    students.push(student);

    if (!saveStudents()) {
      students.pop();
      return;
    }

    alert("Student added successfully!");
  }

  resetForm();
  renderStudents();
});

// Display student records safely
function renderStudents() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCourse = courseFilter.value;

  const filteredStudents = students.filter((student) => {
    const searchable = [
      student.name,
      student.rollNo,
      student.email,
      student.phone,
      student.course,
      student.gender,
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchable.includes(query) &&
      (!selectedCourse || student.course === selectedCourse)
    );
  });

  studentTable.replaceChildren();

  if (filteredStudents.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent =
      students.length === 0
        ? "No students yet. Add your first student above."
        : "No matching students found.";

    row.appendChild(cell);
    studentTable.appendChild(row);
  } else {
    filteredStudents.forEach((student) => {
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

  document.getElementById("totalStudents").textContent = students.length;

  document.getElementById("maleStudents").textContent = students.filter(
    (s) => s.gender === "Male",
  ).length;

  document.getElementById("femaleStudents").textContent = students.filter(
    (s) => s.gender === "Female",
  ).length;

  document.getElementById("totalCourses").textContent = new Set(
    students.map((s) => s.course),
  ).size;

  document.getElementById("recordCount").textContent =
    filteredStudents.length + " of " + students.length + " records";
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
}

// Edit student
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

  document.getElementById("student-form").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  nameInput.focus({ preventScroll: true });
}

// Delete student
function deleteStudent(id) {
  const student = students.find((s) => s.id === id);
  if (!student) return;

  const confirmed = confirm(
    "Delete " + student.name + " (" + student.rollNo + ")?",
  );

  if (!confirmed) return;

  const previous = students;
  students = students.filter((s) => s.id !== id);

  if (!saveStudents()) {
    students = previous;
    return;
  }

  if (editId.value === id) {
    resetForm();
  }

  renderStudents();
}

// Reset form after adding or editing
function resetForm() {
  form.reset();
  editId.value = "";
  formTitle.textContent = "Add New Student";
  submitBtn.textContent = "+ Add Student";
  cancelEdit.hidden = true;
}

form.addEventListener("reset", function () {
  // Allow the browser to reset its form controls first.
  setTimeout(() => {
    editId.value = "";
    formTitle.textContent = "Add New Student";
    submitBtn.textContent = "+ Add Student";
    cancelEdit.hidden = true;
  }, 0);
});

cancelEdit.addEventListener("click", resetForm);

// Search and course filter
searchInput.addEventListener("input", renderStudents);
courseFilter.addEventListener("change", renderStudents);

// Initial dashboard render
renderStudents();
