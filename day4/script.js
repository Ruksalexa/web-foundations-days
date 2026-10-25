
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");


function updateCounts() {
  const text = noteText.value;
  const length = text.length;
  charCount.textContent = length + " / 200 characters";

  const trimmed = text.trim();
  let words = 0;
  if (trimmed !== "") {
    words = trimmed.split(/\s+/).length;
  }
  wordCount.textContent = words + " words";

  // Warning classes
  charCount.classList.remove("warning");
  charCount.classList.remove("over");

  if (length > 200) {
    charCount.classList.add("over");
  } else if (length > 180) {
    charCount.classList.add("warning");
  }
}


function clearNote() {
  noteText.value = "";
  updateCounts();
  localStorage.removeItem("draft");
}


noteText.addEventListener("input", function () {
  updateCounts();
  localStorage.setItem("draft", noteText.value);
});

clearBtn.addEventListener("click", clearNote);
noteText.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearNote();
  }
});

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    themeToggle.textContent = "Light mode";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "Dark mode";
    localStorage.setItem("theme", "light");
  }
});
const savedDraft = localStorage.getItem("draft");
if (savedDraft !== null) {
  noteText.value = savedDraft;
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "Light mode";
}

updateCounts();