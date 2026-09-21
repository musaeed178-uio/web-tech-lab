const API = '';
let currentUser = null;
let currentItem = null;
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
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getItemId() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1];
}

window.onload = function() {
    const user = localStorage.getItem('user');
    if (!user) { window.location.href = '/'; return; }
    currentUser = JSON.parse(user);
    document.getElementById('user-display').textContent = currentUser.full_name || currentUser.username;
    initTheme();
    loadItem();
};

function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}

async function loadItem() {
    const itemId = getItemId();
    try {
        const res = await fetch(`${API}/api/items/${itemId}`);
        if (!res.ok) { showToast('Item not found.', 'error'); return; }
        currentItem = await res.json();

        document.title = `${currentItem.title} - COMSATS Lost & Found`;
        document.getElementById('item-title').textContent = currentItem.title;
        document.getElementById('item-badge').innerHTML = `<span class="badge badge-${currentItem.status}">${currentItem.status}</span>`;

        document.getElementById('item-details').innerHTML = `
            <div class="detail-row"><span class="label">Description</span><span class="value">${escapeHtml(currentItem.description || 'No description provided.')}</span></div>
            <div class="detail-row"><span class="label">Category</span><span class="value">${escapeHtml(currentItem.category || 'Other')}</span></div>
            <div class="detail-row"><span class="label">Location</span><span class="value">${escapeHtml(currentItem.location || 'Unknown')}</span></div>
            <div class="detail-row"><span class="label">Reported by</span><span class="value">${escapeHtml(currentItem.reporter_name || 'Anonymous')}</span></div>
            <div class="detail-row"><span class="label">Date</span><span class="value">${formatDate(currentItem.date_reported)}</span></div>
            <div class="detail-row"><span class="label">Status</span><span class="value"><span class="badge badge-${currentItem.status}">${currentItem.status}</span></span></div>
            ${currentItem.is_resolved ? '<div class="detail-row"><span class="label">Resolved</span><span class="value"><span class="badge badge-approved">Yes - Item Claimed</span></span></div>' : ''}
        `;

        // Actions
        let actionsHtml = '';
        if (currentItem.status === 'found' && !currentItem.is_resolved && currentUser.id !== currentItem.reported_by) {
            const hasClaim = currentItem.claims.some(c => c.claimer_id === currentUser.id && (c.status === 'pending' || c.status === 'approved'));
            if (!hasClaim) {
                actionsHtml += `<button class="btn btn-success" onclick="openClaimModal()">Claim This Item</button>`;
            }
        }

        if ((currentUser.id === currentItem.reported_by || currentUser.role === 'admin') && !currentItem.is_resolved) {
            actionsHtml += `<button class="btn btn-secondary" onclick="openEditModal()">Edit Report</button>`;
            actionsHtml += `<button class="btn btn-danger" onclick="deleteItem()">Delete Report</button>`;
        }

        document.getElementById('item-actions').innerHTML = actionsHtml;

        // Claims
        renderClaims();
    } catch (err) {
        console.error('Error loading item:', err);
        showToast('Error loading item details.', 'error');
    }
}

function renderClaims() {
    const container = document.getElementById('claims-list');
    const claims = currentItem.claims || [];

    if (claims.length === 0) {
        container.innerHTML = '<p class="no-items">No claims have been submitted yet.</p>';
        return;
    }

    container.innerHTML = claims.map(c => `
        <div style="padding:14px; border-bottom:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <strong style="font-size:14px; color:var(--text-primary);">${escapeHtml(c.claimer_full_name || c.claimer_name)}</strong>
                <span class="badge badge-${c.status}">${c.status}</span>
            </div>
            <p style="font-size:13px; color:var(--text-secondary); margin-bottom:6px;">${escapeHtml(c.proof_text)}</p>
            <p style="font-size:11px; color:var(--text-muted);">${formatDate(c.created_at)}</p>
            ${c.admin_note ? `<p style="font-size:12px; color:var(--warning); margin-top:4px;"><em>Admin note: ${escapeHtml(c.admin_note)}</em></p>` : ''}
            ${c.status === 'approved' && (currentUser.id === currentItem.reported_by || currentUser.id === c.claimer_id || currentUser.role === 'admin') ? `
            <button class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="openChat(${c.id}, '${escapeHtml(c.claimer_name)}', '${escapeHtml(currentItem.reporter_name)}')">Open Chat</button>
            ` : ''}
        </div>
    `).join('');
}

function openClaimModal() {
    document.getElementById('claim-item-id').value = currentItem.id;
    document.getElementById('claim-proof').value = '';
    document.getElementById('claim-modal').classList.add('active');
}

async function submitClaim(e) {
    e.preventDefault();
    const claim = {
        item_id: currentItem.id,
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
            loadItem();
        } else {
            showToast(data.error || 'Failed to submit claim.', 'error');
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

async function openChat(claimId, claimerName, reporterName) {
    currentClaimId = claimId;
    document.getElementById('chat-title').textContent = `Chat - ${escapeHtml(currentItem.title)}`;

    // Load contact info
    try {
        const res = await fetch(`${API}/api/messages/contact/${claimId}`);
        if (res.ok) {
            const contact = await res.json();
            const contactDiv = document.getElementById('contact-info');
            contactDiv.style.display = 'block';
            contactDiv.innerHTML = `
                <strong>Contact Information (Approved Claim):</strong><br>
                Reporter: ${escapeHtml(contact.reporter.full_name || contact.reporter.username)} | ${escapeHtml(contact.reporter.email)} | ${escapeHtml(contact.reporter.phone || 'N/A')}<br>
                Claimer: ${escapeHtml(contact.claimer.full_name || contact.claimer.username)} | ${escapeHtml(contact.claimer.email)} | ${escapeHtml(contact.claimer.phone || 'N/A')}
            `;
        }
    } catch (err) {}

    // Load messages
    await loadMessages(claimId);
    document.getElementById('chat-modal').classList.add('active');
}

async function loadMessages(claimId) {
    try {
        const res = await fetch(`${API}/api/messages/${claimId}`);
        const messages = await res.json();
        const container = document.getElementById('chat-messages');

        if (messages.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:40px 0;">No messages yet. Start the conversation.</p>';
            return;
        }

        container.innerHTML = messages.map(m => `
            <div class="chat-message ${m.sender_id === currentUser.id ? 'sent' : ''}">
                <div class="sender">${escapeHtml(m.sender_full_name || m.sender_name)}</div>
                <div class="text">${escapeHtml(m.content)}</div>
                <div class="time">${formatDate(m.created_at)}</div>
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
    } catch (err) {
        console.error('Error loading messages:', err);
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content || !currentClaimId) return;

    try {
        const res = await fetch(`${API}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                claim_id: currentClaimId,
                sender_id: currentUser.id,
                content: content
            })
        });

        if (res.ok) {
            input.value = '';
            await loadMessages(currentClaimId);
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to send message.', 'error');
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

function openEditModal() {
    document.getElementById('edit-id').value = currentItem.id;
    document.getElementById('edit-title').value = currentItem.title;
    document.getElementById('edit-description').value = currentItem.description || '';
    document.getElementById('edit-category').value = currentItem.category;
    document.getElementById('edit-location').value = currentItem.location || '';
    document.getElementById('edit-status').value = currentItem.status;
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
            loadItem();
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

async function deleteItem() {
    if (!confirm('Are you sure you want to delete this item and all its claims?')) return;
    try {
        const res = await fetch(`${API}/api/items/${currentItem.id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Item deleted.', 'success');
            window.location.href = '/dashboard';
        }
    } catch (err) {
        showToast('Connection error.', 'error');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
