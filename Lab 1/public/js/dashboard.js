const API = '';
let currentUser = null;

// Theme
function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = saved === 'dark' ? '\u263C' : '\u263E';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('theme-icon').textContent = next === 'dark' ? '\u263C' : '\u263E';
}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
}

window.onload = function() {
    const user = localStorage.getItem('user');
    if (!user) { window.location.href = '/'; return; }
    currentUser = JSON.parse(user);
    document.getElementById('user-display').textContent = currentUser.full_name || currentUser.username;
    initTheme();
    loadItems();
};

function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}

async function loadItems(search, status, category) {
    try {
        let url = `${API}/api/items?`;
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        if (category) params.set('category', category);
        url += params.toString();

        const res = await fetch(url);
        const items = await res.json();
        const container = document.getElementById('items-list');
        const noItems = document.getElementById('no-items');

        if (items.length === 0) {
            container.innerHTML = '';
            noItems.style.display = 'block';
            return;
        }

        noItems.style.display = 'none';
        container.innerHTML = items.map(item => `
            <div class="item-card" onclick="window.location.href='/item/${item.id}'">
                <div class="item-card-header">
                    <span class="item-card-title">${escapeHtml(item.title)}</span>
                    <span class="badge badge-${item.status}">${item.status}</span>
                </div>
                <p class="item-card-desc">${escapeHtml(item.description || 'No description provided.')}</p>
                <div class="item-card-meta">
                    <span>${escapeHtml(item.location || 'Unknown location')}</span>
                    <span>${escapeHtml(item.category || 'Other')}</span>
                    <span>by ${escapeHtml(item.reporter_name || 'Anonymous')}</span>
                </div>
                ${item.status === 'found' && currentUser.id !== item.reported_by ? `
                <div class="item-card-actions">
                    <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); openClaimModal(${item.id})">Claim This Item</button>
                </div>
                ` : ''}
                ${currentUser.id === item.reported_by || currentUser.role === 'admin' ? `
                <div class="item-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openEditModal(${item})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteItem(${item.id})">Delete</button>
                </div>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading items:', err);
    }
}

function searchItems() {
    const search = document.getElementById('search-input').value;
    const status = document.getElementById('filter-status').value;
    const category = document.getElementById('filter-category').value;
    loadItems(search, status, category);
}

async function reportItem(e) {
    e.preventDefault();
    const item = {
        title: document.getElementById('item-title').value,
        description: document.getElementById('item-description').value,
        category: document.getElementById('item-category').value,
        location: document.getElementById('item-location').value,
        status: document.getElementById('item-status').value,
        reported_by: currentUser.id
    };

    try {
        const res = await fetch(`${API}/api/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });

        if (res.ok) {
            showToast('Item reported successfully.', 'success');
            e.target.reset();
            loadItems();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to report item.', 'error');
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

function openEditModal(item) {
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-title').value = item.title;
    document.getElementById('edit-description').value = item.description || '';
    document.getElementById('edit-category').value = item.category;
    document.getElementById('edit-location').value = item.location || '';
    document.getElementById('edit-status').value = item.status;
    document.getElementById('report-modal').classList.add('active');
}

async function updateItem(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const item = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        category: document.getElementById('edit-category').value,
        location: document.getElementById('edit-location').value,
        status: document.getElementById('edit-status').value
    };

    try {
        const res = await fetch(`${API}/api/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });

        if (res.ok) {
            showToast('Item updated.', 'success');
            closeModal('report-modal');
            loadItems();
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
        const res = await fetch(`${API}/api/items/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Item deleted.', 'success');
            loadItems();
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

function openClaimModal(itemId) {
    document.getElementById('claim-item-id').value = itemId;
    document.getElementById('claim-proof').value = '';
    document.getElementById('claim-modal').classList.add('active');
}

async function submitClaim(e) {
    e.preventDefault();
    const claim = {
        item_id: parseInt(document.getElementById('claim-item-id').value),
        claimer_id: currentUser.id,
        proof_text: document.getElementById('claim-proof').value
    };

    try {
        const res = await fetch(`${API}/api/claims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claim)
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Claim submitted. Awaiting admin review.', 'success');
            closeModal('claim-modal');
        } else {
            showToast(data.error || 'Failed to submit claim.', 'error');
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
