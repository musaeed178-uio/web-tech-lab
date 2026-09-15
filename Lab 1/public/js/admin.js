const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// Check authentication and admin role
window.onload = function() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = '/';
        return;
    }
    currentUser = JSON.parse(user);
    
    if (currentUser.role !== 'admin') {
        alert('Access denied. Admin only.');
        window.location.href = '/dashboard';
        return;
    }
    
    document.getElementById('user-display').textContent = `👤 ${currentUser.username} (Admin)`;
    
    loadStats();
    loadUsers();
    loadAllItems();
};

// Logout
function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = '/';
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

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        document.getElementById('stat-total').textContent = stats.totalItems;
        document.getElementById('stat-lost').textContent = stats.lostItems;
        document.getElementById('stat-found').textContent = stats.foundItems;
        document.getElementById('stat-users').textContent = stats.totalUsers;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load all users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`);
        const users = await response.json();
        
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${escapeHtml(user.username)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="item-status status-${user.role === 'admin' ? 'found' : 'lost'}">${user.role}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    ${user.username !== 'admin' ? `
                    <button class="btn btn-delete" onclick="deleteUser(${user.id})">Delete</button>
                    ` : '<span style="color:#6b7280">Protected</span>'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load all items
async function loadAllItems() {
    try {
        const response = await fetch(`${API_URL}/items`);
        const items = await response.json();
        
        const tbody = document.getElementById('admin-items-tbody');
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${escapeHtml(item.title)}</td>
                <td>${escapeHtml(item.category || '-')}</td>
                <td>${escapeHtml(item.location || '-')}</td>
                <td><span class="item-status status-${item.status}">${item.status}</span></td>
                <td>${escapeHtml(item.reporter || 'Anonymous')}</td>
                <td>
                    <button class="btn btn-delete" onclick="deleteItem(${item.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Delete user
async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('User deleted successfully!', 'success');
            loadUsers();
            loadStats();
        } else {
            showMessage('Failed to delete user', 'error');
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
            loadAllItems();
            loadStats();
        } else {
            showMessage('Failed to delete item', 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    }
}

// Helper function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
