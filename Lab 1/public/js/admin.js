const API = '';
let currentUser = null;
let currentClaimId = null;

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

function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

window.onload = function() {
    const user = localStorage.getItem('user');
    if (!user) { window.location.href = '/'; return; }
    currentUser = JSON.parse(user);
    if (currentUser.role !== 'admin') {
        showToast('Access denied. Admin only.', 'error');
        window.location.href = '/dashboard';
        return;
    }
    document.getElementById('user-display').textContent = `${currentUser.full_name || currentUser.username} (Admin)`;
    initTheme();
    loadAll();
};

function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}

async function loadAll() {
    await Promise.all([loadStats(), loadPendingClaims(), loadAllClaims(), loadUsers(), loadAllItems()]);
}

async function loadStats() {
    try {
        const res = await fetch(`${API}/api/admin/stats`);
        const s = await res.json();
        document.getElementById('stats-grid').innerHTML = `
            <div class="stat-card stat-accent"><div class="stat-value">${s.totalItems}</div><div class="stat-label">Total Items</div></div>
            <div class="stat-card stat-danger"><div class="stat-value">${s.lostItems}</div><div class="stat-label">Lost Items</div></div>
            <div class="stat-card stat-success"><div class="stat-value">${s.foundItems}</div><div class="stat-label">Found Items</div></div>
            <div class="stat-card stat-warning"><div class="stat-value">${s.pendingClaims}</div><div class="stat-label">Pending Claims</div></div>
            <div class="stat-card"><div class="stat-value">${s.resolvedItems}</div><div class="stat-label">Resolved</div></div>
            <div class="stat-card"><div class="stat-value">${s.totalUsers}</div><div class="stat-label">Users</div></div>
            <div class="stat-card"><div class="stat-value">${s.totalClaims}</div><div class="stat-label">Total Claims</div></div>
        `;
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

async function loadPendingClaims() {
    try {
        const res = await fetch(`${API}/api/claims/pending`);
        const claims = await res.json();
        const tbody = document.getElementById('pending-claims-tbody');
        const noClaims = document.getElementById('no-pending-claims');

        if (claims.length === 0) {
            tbody.innerHTML = '';
            noClaims.style.display = 'block';
            return;
        }

        noClaims.style.display = 'none';
        tbody.innerHTML = claims.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${escapeHtml(c.item_title)}</td>
                <td>${escapeHtml(c.claimer_name)}<br><small style="color:var(--text-muted)">${escapeHtml(c.claimer_email)}</small></td>
                <td style="max-width:250px;">${escapeHtml(c.proof_text)}</td>
                <td>${formatDate(c.created_at)}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="openReviewModal(${c.id}, ${c.item_id}, '${escapeHtml(c.claimer_full_name)}', '${escapeHtml(c.proof_text)}')">Review</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading pending claims:', err);
    }
}

async function loadAllClaims() {
    try {
        const res = await fetch(`${API}/api/admin/claims`);
        const claims = await res.json();
        const tbody = document.getElementById('all-claims-tbody');

        tbody.innerHTML = claims.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${escapeHtml(c.item_title)}</td>
                <td>${escapeHtml(c.claimer_name)}</td>
                <td>${escapeHtml(c.reporter_name)}</td>
                <td><span class="badge badge-${c.status}">${c.status}</span></td>
                <td>${formatDate(c.created_at)}</td>
                <td>${escapeHtml(c.admin_note || '-')}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading claims:', err);
    }
}

async function loadUsers() {
    try {
        const res = await fetch(`${API}/api/admin/users`);
        const users = await res.json();
        const tbody = document.getElementById('users-tbody');

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(u.full_name || '-')}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(u.phone || '-')}</td>
                <td><span class="badge badge-${u.role === 'admin' ? 'approved' : 'pending'}">${u.role}</span></td>
                <td><span class="badge badge-${u.is_active ? 'approved' : 'rejected'}">${u.is_active ? 'Active' : 'Deactivated'}</span></td>
                <td>${formatDate(u.created_at)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="openEditUserModal(${u.id}, '${u.role}', ${u.is_active})">Edit</button>
                    ${u.username !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Delete</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

async function loadAllItems() {
    try {
        const res = await fetch(`${API}/api/admin/items`);
        const items = await res.json();
        const tbody = document.getElementById('admin-items-tbody');

        tbody.innerHTML = items.map(i => `
            <tr>
                <td>${i.id}</td>
                <td>${escapeHtml(i.title)}</td>
                <td>${escapeHtml(i.category || '-')}</td>
                <td>${escapeHtml(i.location || '-')}</td>
                <td><span class="badge badge-${i.status}">${i.status}</span></td>
                <td>${escapeHtml(i.reporter_name || 'N/A')}</td>
                <td>${i.is_resolved ? '<span class="badge badge-approved">Yes</span>' : '<span class="badge badge-pending">No</span>'}</td>
                <td>${formatDate(i.date_reported)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteItem(${i.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading items:', err);
    }
}

function openReviewModal(claimId, itemId, claimerName, proof) {
    currentClaimId = claimId;
    document.getElementById('review-details').innerHTML = `
        <div class="detail-row"><span class="label">Claim ID:</span><span class="value">${claimId}</span></div>
        <div class="detail-row"><span class="label">Item ID:</span><span class="value">${itemId}</span></div>
        <div class="detail-row"><span class="label">Claimer:</span><span class="value">${escapeHtml(claimerName)}</span></div>
        <div class="detail-row"><span class="label">Proof:</span><span class="value">${escapeHtml(proof)}</span></div>
    `;
    document.getElementById('review-note').value = '';
    document.getElementById('review-modal').classList.add('active');
}

async function reviewClaim(status) {
    if (!currentClaimId) return;
    const note = document.getElementById('review-note').value;

    try {
        const res = await fetch(`${API}/api/claims/${currentClaimId}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, admin_note: note })
        });

        if (res.ok) {
            showToast(`Claim ${status}.`, 'success');
            closeModal('review-modal');
            loadAll();
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

function openEditUserModal(id, role, isActive) {
    document.getElementById('edit-user-id').value = id;
    document.getElementById('edit-user-role').value = role;
    document.getElementById('edit-user-active').value = isActive ? '1' : '0';
    document.getElementById('edit-user-modal').classList.add('active');
}

async function saveUser() {
    const id = document.getElementById('edit-user-id').value;
    const role = document.getElementById('edit-user-role').value;
    const is_active = document.getElementById('edit-user-active').value === '1';

    try {
        const res = await fetch(`${API}/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, is_active })
        });

        if (res.ok) {
            showToast('User updated.', 'success');
            closeModal('edit-user-modal');
            loadUsers();
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
        const res = await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('User deleted.', 'success');
            loadAll();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete user.', 'error');
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item and all its claims?')) return;
    try {
        const res = await fetch(`${API}/api/items/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Item deleted.', 'success');
            loadAll();
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
