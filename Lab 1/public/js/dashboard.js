const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// Check authentication
window.onload = function() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = '/';
        return;
    }
    currentUser = JSON.parse(user);
    document.getElementById('user-display').textContent = `👤 ${currentUser.username}`;
    
    // Show admin button for admin users
    if (currentUser.role === 'admin') {
        document.getElementById('admin-btn').style.display = 'inline-block';
    }
    
    loadItems();
};

// Logout
function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Go to admin panel
function goToAdmin() {
    window.location.href = '/admin';
}

// Show message
function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = 'message ' + type;
    setTimeout(() => {
        msg.className = 'message';
    }, 3000);
}

// Load items
async function loadItems(search = '', status = '') {
    try {
        let url = `${API_URL}/items?`;
        if (search) url += `search=${search}&`;
        if (status) url += `status=${status}`;
        
        const response = await fetch(url);
        const items = await response.json();
        
        const container = document.getElementById('items-list');
        const noItems = document.getElementById('no-items');
        
        if (items.length === 0) {
            container.innerHTML = '';
            noItems.style.display = 'block';
            return;
        }
        
        noItems.style.display = 'none';
        container.innerHTML = items.map(item => `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-title">${escapeHtml(item.title)}</span>
                    <span class="item-status status-${item.status}">${item.status}</span>
                </div>
                <p class="item-desc">${escapeHtml(item.description || 'No description')}</p>
                <div class="item-meta">
                    <span>📍 ${escapeHtml(item.location || 'Unknown')}</span>
                    <span>📂 ${escapeHtml(item.category || 'Other')}</span>
                    <span>👤 ${escapeHtml(item.reporter || 'Anonymous')}</span>
                </div>
                ${currentUser.id === item.reported_by || currentUser.role === 'admin' ? `
                <div class="item-actions">
                    <button class="btn btn-edit" onclick="editItem(${item.id}, '${escapeAttr(item.title)}', '${escapeAttr(item.description || '')}', '${escapeAttr(item.category)}', '${escapeAttr(item.location)}', '${item.status}')">Edit</button>
                    <button class="btn btn-delete" onclick="deleteItem(${item.id})">Delete</button>
                </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Search items
function searchItems() {
    const search = document.getElementById('search-input').value;
    const status = document.getElementById('filter-status').value;
    loadItems(search, status);
}

// Report new item
async function reportItem(e) {
    e.preventDefault();
    
    const item = {
        title: document.getElementById('item-title').value,
        description: document.getElementById('item-description').value,
        category: document.getElementById('item-category').value,
        location: document.getElementById('item-location').value,
        status: document.getElementById('item-status').value,
        reported_by: currentUser.id,
        image_url: ''
    };
    
    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        
        if (response.ok) {
            showMessage('Item reported successfully!', 'success');
            e.target.reset();
            loadItems();
        } else {
            showMessage('Failed to report item', 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    }
}

// Edit item - open modal
function editItem(id, title, description, category, location, status) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-description').value = description;
    document.getElementById('edit-category').value = category;
    document.getElementById('edit-location').value = location;
    document.getElementById('edit-status').value = status;
    document.getElementById('edit-modal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

// Update item
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
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        
        if (response.ok) {
            showMessage('Item updated successfully!', 'success');
            closeModal();
            loadItems();
        } else {
            showMessage('Failed to update item', 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    }
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Item deleted successfully!', 'success');
            loadItems();
        } else {
            showMessage('Failed to delete item', 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    }
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
