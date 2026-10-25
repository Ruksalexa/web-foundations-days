const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");
let users = [];

function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0 && users.length > 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No users match your filter.";
    usersList.appendChild(emptyItem);
    return;
  }

  for (let i = 0; i < list.length; i++) {
    const user = list[i];

    const li = document.createElement("li");
    li.textContent =
      user.name + " | " + user.email + " | " + user.address.city + " | " + user.company.name;

    usersList.appendChild(li);
  }
}

// Fetch the users from the API
async function loadUsers() {
  statusMessage.textContent = "Loading...";
  loadBtn.disabled = true;

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }

    users = await response.json();
    renderUsers(users);
    statusMessage.textContent = "Loaded " + users.length + " users.";
  } catch (error) {
    statusMessage.textContent = "Something went wrong: " + error.message;
  } finally {
    loadBtn.disabled = false;
  }
}

function filterUsers() {
  const searchText = filterInput.value.trim().toLowerCase();

  const matches = users.filter(function (user) {
    return user.name.toLowerCase().includes(searchText);
  });

  renderUsers(matches);
}

// Events
loadBtn.addEventListener("click", loadUsers);
filterInput.addEventListener("input", filterUsers);