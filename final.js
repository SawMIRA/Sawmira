const STORAGE_KEY = "campusFindReports";

const form = document.getElementById("itemForm");
const itemList = document.getElementById("itemList");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");

let items = loadItems();

function loadItems() {
try {
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
return Array.isArray(saved) ? saved : [];
} catch {
return [];
}
}

function saveItems() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
return true;
} catch {
alert("Storage is full. Try using a smaller image.");
return false;
}
}

function escapeHTML(value) {
return String(value).replace(/[&<>"']/g, char => ({
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
'"': "&quot;",
"'": "&#39;"
})[char]);
}

function formatDate(date) {
if (!date) return "Not specified";

const parts = date.split("-");
return parts.length === 3
? `${parts[2]}/${parts[1]}/${parts[0]}`
: date;
}

form.addEventListener("submit", async function(event) {
event.preventDefault();

const imageFile = document.getElementById("itemImage").files[0];
let image = "";

if (imageFile) {
if (!imageFile.type.startsWith("image/")) {
alert("Please choose an image file.");
return;
}

if (imageFile.size > 300 * 1024) {
alert("Please choose an image smaller than 300 KB.");
return;
}

try {
image = await readImage(imageFile);
} catch {
alert("Unable to read the selected image.");
return;
}
}

const newItem = {
id: Date.now().toString() + Math.random().toString(16).slice(2),
type: document.getElementById("reportType").value,
name: document.getElementById("itemName").value.trim(),
category: document.getElementById("category").value,
location: document.getElementById("location").value.trim(),
date: document.getElementById("itemDate").value,
description: document.getElementById("description").value.trim(),
image: image,
status: "Open",
createdAt: new Date().toISOString()
};

if (!newItem.name || !newItem.location ||
!newItem.description || !newItem.date ||
!newItem.category) {
alert("Please complete all required fields.");
return;
}

items.unshift(newItem);

if (!saveItems()) {
items.shift();
return;
}

form.reset();
renderItems();

document.getElementById("items").scrollIntoView({
behavior: "smooth"
});

alert("Your report has been submitted successfully!");
});

function readImage(file) {
return new Promise((resolve, reject) => {
const reader = new FileReader();

reader.onload = () => resolve(reader.result);
reader.onerror = reject;
reader.readAsDataURL(file);
});
}

function renderItems() {
const search = searchInput.value.toLowerCase().trim();
const selectedType = typeFilter.value;
const selectedCategory = categoryFilter.value;

const filtered = items.filter(item => {
const text = [
item.name,
item.location,
item.description,
item.category
].join(" ").toLowerCase();

const matchesSearch = text.includes(search);
const matchesType =
selectedType === "All" || item.type === selectedType;
const matchesCategory =
selectedCategory === "All" ||
item.category === selectedCategory;

return matchesSearch && matchesType && matchesCategory;
});

itemList.innerHTML = filtered.map(item => {
const badgeClass =
item.status === "Returned"
? "returned"
: item.type.toLowerCase();

const imageHTML = item.image
? `<img src="${item.image}" alt="Photo of ${escapeHTML(item.name)}">`
: "📦";

const actionHTML = item.status === "Returned"
? `<button class="small-btn" data-action="reopen"
data-id="${escapeHTML(item.id)}">
Reopen
</button>`
: `<button class="small-btn" data-action="return"
data-id="${escapeHTML(item.id)}">
Mark Returned
</button>`;

return `
<article class="item-card">
<div class="item-image">${imageHTML}</div>

<div class="item-content">
<span class="badge ${badgeClass}">
${escapeHTML(item.type)} ·
${escapeHTML(item.status)}
</span>

<h3>${escapeHTML(item.name)}</h3>

<p>📂 ${escapeHTML(item.category)}</p>
<p>📍 ${escapeHTML(item.location)}</p>
<p>📅 ${escapeHTML(formatDate(item.date))}</p>
<p>${escapeHTML(item.description)}</p>

<div class="item-actions">
${actionHTML}

<button class="small-btn delete"
data-action="delete"
data-id="${escapeHTML(item.id)}">
Delete
</button>
</div>
</div>
</article>
`;
}).join("");

document.getElementById("emptyMessage").classList.toggle(
"hidden",
filtered.length > 0
);

updateStatistics();
}

function updateStatistics() {
document.getElementById("totalItems").textContent =
items.length;

document.getElementById("lostCount").textContent =
items.filter(item =>
item.type === "Lost" && item.status !== "Returned"
).length;

document.getElementById("foundCount").textContent =
items.filter(item =>
item.type === "Found" && item.status !== "Returned"
).length;

document.getElementById("returnedCount").textContent =
items.filter(item => item.status === "Returned").length;
}

itemList.addEventListener("click", function(event) {
const button = event.target.closest("button[data-action]");

if (!button) return;

const id = button.dataset.id;
const action = button.dataset.action;
const item = items.find(entry => entry.id === id);

if (!item) return;

if (action === "delete") {
const confirmed = confirm(
"Are you sure you want to delete this report?"
);

if (!confirmed) return;

items = items.filter(entry => entry.id !== id);
}

if (action === "return") {
const confirmed = confirm(
"Confirm that this item has been returned?"
);

if (!confirmed) return;

item.status = "Returned";
}

if (action === "reopen") {
item.status = "Open";
}

if (!saveItems()) {
items = loadItems();
renderItems();
return;
}

renderItems();
});

searchInput.addEventListener("input", renderItems);
typeFilter.addEventListener("change", renderItems);
categoryFilter.addEventListener("change", renderItems);

renderItems();