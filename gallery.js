(async () => {
const grid = document.getElementById('grid');
const API_BASE = '/api/paint';
try {
const r = await fetch(`${API_BASE}/gallery?limit=60`);
if (!r.ok) throw new Error('Failed to load gallery');
const items = await r.json();
if (!Array.isArray(items)) throw new Error('Bad response');


for (const it of items) {
const card = document.createElement('article');
card.className = 'card';
const img = new Image();
img.loading = 'lazy';
img.src = `${API_BASE}/image/${encodeURIComponent(it.id)}.png`;
img.alt = it.caption || `Drawing by ${it.author || 'anonymous'}`;
const meta = document.createElement('div'); meta.className = 'meta';
const left = document.createElement('div');
left.textContent = it.author || 'anonymous';
const right = document.createElement('time');
right.dateTime = it.createdAt;
right.textContent = new Date(it.createdAt).toLocaleDateString();
const cap = document.createElement('div'); cap.className = 'cap'; cap.textContent = it.caption || '';
meta.append(left, right);
card.append(img, meta, cap);
grid.append(card);
}
} catch (e) {
grid.textContent = e.message || 'Error';
}
})();