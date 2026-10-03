let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

//console.log(notes); for testing
function searchNotes(word) {
  let lowerWord = word.toLowerCase();

  let results = notes.filter(function (note) {
    return note.text.toLowerCase().includes(lowerWord);
  });

  return results;
}

// Tests
console.log(searchNotes("MILK"));
// array with 1 note: { id: 1, text: "Buy milk and bread", category: "personal" }
console.log(searchNotes("xyz"));
// [] (empty array)

function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }

  return longest;
}

// Tests
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

let backup = notes;   // save the real notes
notes = [];           // pretend there are no notes
console.log(longestNote());
// Expected: null
notes = backup;    //restore riginal notes 

function countByCategory() {
  let counts = {};

  for (let i = 0; i < notes.length; i++) {
    let category = notes[i].category;

    if (counts[category] === undefined) {
      counts[category] = 1;
    } else {
      counts[category] = counts[category] + 1;
    }
  }

  return counts;
}

// Tests
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

let backup2 = notes;   // save the real notes
notes = [];            // pretend there are no notes
console.log(countByCategory());
// Expected: {} (empty object)
notes = backup2;

function getSummary() {
  let total = notes.length;

  if (total === 0) {
    return "0 notes.";
  }

  let word = "notes";
  if (total === 1) {
    word = "note";
  }

  let counts = countByCategory();
  let parts = [];

  for (let category in counts) {
    parts.push(`${counts[category]} ${category}`);
  }

  return `${total} ${word}: ${parts.join(", ")}.`;
}

// Tests
console.log(getSummary());
// Expected: "5 notes: 2 personal, 2 study, 1 work."

let backup3 = notes;   // save the real notes
notes = [notes[0]];    // keep only one note
console.log(getSummary());
// Expected: "1 note: 1 personal."
notes = backup3;

function isDuplicate(text) {
  let cleanText = text.trim().toLowerCase();

  return notes.some(function (note) {
    return note.text.trim().toLowerCase() === cleanText;
  });
}

// Tests
console.log(isDuplicate("  BUY MILK and bread  "));
// Expected: true (same text, ignoring case and extra spaces)

console.log(isDuplicate("Walk the dog"));
// Expected: false (no note has this text)

function addNote(text, category) {
  let cleanText = text.trim();
  let validCategories = ["personal", "work", "study"];

  if (cleanText.length < 1 || cleanText.length > 200) {
    console.log("Not added: note must be 1 to 200 characters.");
    return false;
  }

  if (isDuplicate(cleanText)) {
    console.log("Not added: this note already exists.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Not added: category must be personal, work or study.");
    return false;
  }

  let newId = 1;
  if (notes.length > 0) {
    newId = notes[notes.length - 1].id + 1;
  }

  notes.push({ id: newId, text: cleanText, category: category });
  return true;
}
console.log(addNote("  call Mum ", "personal"));
// Expected: logs "Not added: this note already exists." then false
console.log(addNote("Water the plants", "personal"));
// Expected: true

console.log(getSummary());
// Expected: "6 notes: 3 personal, 2 study, 1 work."