// ============================================================
// app.js - UI logic for all pages
// ============================================================

// ---- Mobile Menu ----
function toggleMenu() {
    document.getElementById("nav-menu").classList.toggle("open");
}

// ---- Toast Notifications ----
function showToast(msg, type) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.className = "toast " + type + " show";
    setTimeout(function () { toast.className = "toast"; }, 3000);
}

// ---- Modal ----
function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// ---- Navigation Helpers ----
function getPageName() {
    var path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1);
}

function updateActiveNav() {
    var page = getPageName();
    var links = document.querySelectorAll("#nav-menu a");
    for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute("href");
        if (href === page) {
            links[i].classList.add("active");
        }
    }
}

// ---- Render Item Cards ----
function renderItemCards(containerId, items) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No items found.</p></div>';
        return;
    }

    var html = "";
    for (var i = items.length - 1; i >= 0; i--) {
        var item = items[i];
        var statusClass = item.type === "lost" ? "badge-lost" : "badge-found";
        var statusText = item.type === "lost" ? "Lost" : "Found";

        if (item.status === "resolved") {
            statusClass = "badge-approved";
            statusText = "Resolved";
        } else if (item.claim) {
            statusClass = "badge-pending";
            statusText = "Claim Pending";
        }

        html += '<div class="item-card" onclick="window.location.href=\'item.html?id=' + item.id + '\'">';
        html += '<div class="item-card-header">';
        html += '<span class="item-card-title">' + escapeHtml(item.title) + '</span>';
        html += '<span class="badge ' + statusClass + '">' + statusText + '</span>';
        html += '</div>';
        html += '<p class="item-card-desc">' + escapeHtml(item.description) + '</p>';
        html += '<div class="item-card-meta">';
        html += '<span>' + escapeHtml(item.location) + '</span>';
        html += '<span>' + escapeHtml(item.name) + ' (' + escapeHtml(item.roll) + ')</span>';
        html += '<span>' + item.date + '</span>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

// ---- Render Item Detail ----
function renderItemDetail() {
    var id = parseInt(getParam("id"));
    var item = getItemById(id);
    if (!item) {
        document.getElementById("detail-content").innerHTML = '<div class="empty-state"><p>Item not found.</p></div>';
        return;
    }

    document.title = item.title + " - COMSATS Lost & Found";

    var statusClass = item.type === "lost" ? "badge-lost" : "badge-found";
    var statusText = item.type === "lost" ? "Lost" : "Found";
    if (item.status === "resolved") {
        statusClass = "badge-approved";
        statusText = "Resolved";
    } else if (item.claim) {
        statusClass = "badge-pending";
        statusText = "Claim Pending";
    }

    var html = '';
    html += '<div class="detail-grid">';
    html += '<div class="detail-card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
    html += '<h2 style="margin:0;">' + escapeHtml(item.title) + '</h2>';
    html += '<span class="badge ' + statusClass + '">' + statusText + '</span>';
    html += '</div>';
    html += '<div class="detail-row"><span class="label">Description</span><span class="value">' + escapeHtml(item.description) + '</span></div>';
    html += '<div class="detail-row"><span class="label">Category</span><span class="value">' + escapeHtml(item.type === "lost" ? "Lost Item" : "Found Item") + '</span></div>';
    html += '<div class="detail-row"><span class="label">Location</span><span class="value">' + escapeHtml(item.location) + '</span></div>';
    html += '<div class="detail-row"><span class="label">Reported by</span><span class="value">' + escapeHtml(item.name) + '</span></div>';
    html += '<div class="detail-row"><span class="label">Roll No</span><span class="value">' + escapeHtml(item.roll) + '</span></div>';
    html += '<div class="detail-row"><span class="label">Email</span><span class="value">' + escapeHtml(item.contact) + '</span></div>';
    html += '<div class="detail-row"><span class="label">Date</span><span class="value">' + item.date + '</span></div>';
    html += '</div>';

    // Sidebar: Actions / Claim Info
    html += '<div class="detail-card">';
    html += '<h2>Actions</h2>';

    if (item.status === "resolved") {
        html += '<p style="color:var(--success);font-weight:600;margin-bottom:12px;">This item has been resolved.</p>';
        if (item.claim) {
            html += '<div class="detail-row"><span class="label">Claimed by</span><span class="value">' + escapeHtml(item.claim.name) + ' (' + escapeHtml(item.claim.roll) + ')</span></div>';
            html += '<div class="detail-row"><span class="label">Proof</span><span class="value">' + escapeHtml(item.claim.proof) + '</span></div>';
        }
    } else if (item.claim) {
        html += '<p style="color:var(--warning);font-weight:500;margin-bottom:12px;">A claim has been submitted and is pending review.</p>';
        html += '<div class="detail-row"><span class="label">Claimed by</span><span class="value">' + escapeHtml(item.claim.name) + ' (' + escapeHtml(item.claim.roll) + ')</span></div>';
        html += '<div class="detail-row"><span class="label">Proof</span><span class="value">' + escapeHtml(item.claim.proof) + '</span></div>';
    } else {
        html += '<p style="color:var(--text-secondary);font-size:14px;margin-bottom:16px;">Is this your item? Submit a claim with proof of ownership.</p>';
        html += '<button class="btn btn-success" onclick="openModal(\'claim-modal\')">Claim This Item</button>';
    }

    html += '</div>';
    html += '</div>';

    document.getElementById("detail-content").innerHTML = html;
}

// ---- Claim Form ----
function handleClaim(event) {
    event.preventDefault();

    var name = document.getElementById("claim-name");
    var roll = document.getElementById("claim-roll");
    var proof = document.getElementById("claim-proof");
    var valid = true;

    clearError(name);
    clearError(roll);
    clearError(proof);

    if (name.value.trim() === "") { showError(name); valid = false; }
    if (roll.value.trim() === "") { showError(roll); valid = false; }
    if (proof.value.trim() === "") { showError(proof); valid = false; }

    if (!valid) return false;

    var id = parseInt(getParam("id"));
    var item = getItemById(id);
    if (!item) return false;

    var claim = {
        itemId: id,
        name: name.value.trim(),
        roll: roll.value.trim(),
        proof: proof.value.trim()
    };

    addClaim(claim);

    // Update item with claim info
    updateItemStatus(id, item.status, {
        name: name.value.trim(),
        roll: roll.value.trim(),
        proof: proof.value.trim()
    });

    closeModal("claim-modal");
    showToast("Claim submitted successfully.", "success");
    renderItemDetail();
    return false;
}

// ---- Report Form ----
function handleReport(event) {
    event.preventDefault();

    var name = document.getElementById("report-name");
    var roll = document.getElementById("report-roll");
    var type = document.getElementById("report-type");
    var title = document.getElementById("report-title");
    var desc = document.getElementById("report-desc");
    var location = document.getElementById("report-location");
    var contact = document.getElementById("report-contact");
    var valid = true;

    [name, roll, type, title, desc, location, contact].forEach(clearError);

    if (name.value.trim() === "") { showError(name); valid = false; }
    if (roll.value.trim() === "") { showError(roll); valid = false; }
    if (type.value === "") { showError(type); valid = false; }
    if (title.value.trim() === "") { showError(title); valid = false; }
    if (desc.value.trim() === "") { showError(desc); valid = false; }
    if (location.value.trim() === "") { showError(location); valid = false; }
    if (contact.value.trim() === "") { showError(contact); valid = false; }

    if (!valid) return false;

    addItem({
        name: name.value.trim(),
        roll: roll.value.trim(),
        type: type.value,
        title: title.value.trim(),
        description: desc.value.trim(),
        location: location.value.trim(),
        contact: contact.value.trim()
    });

    showToast("Item reported successfully!", "success");
    event.target.reset();
    return false;
}

// ---- Admin Login ----
function handleAdminLogin(event) {
    event.preventDefault();

    var user = document.getElementById("admin-user");
    var pass = document.getElementById("admin-pass");

    clearError(user);
    clearError(pass);

    var valid = true;
    if (user.value.trim() === "") { showError(user); valid = false; }
    if (pass.value.trim() === "") { showError(pass); valid = false; }
    if (!valid) return false;

    if (adminLogin(user.value.trim(), pass.value)) {
        window.location.href = "admin.html";
    } else {
        showToast("Invalid credentials.", "error");
    }
    return false;
}

// ---- Admin Dashboard ----
function renderAdminDashboard() {
    if (!isLoggedIn()) {
        window.location.href = "index.html";
        return;
    }

    var stats = getStats();
    document.getElementById("stats-grid").innerHTML =
        '<div class="stat-card"><div class="stat-value">' + stats.total + '</div><div class="stat-label">Total Items</div></div>' +
        '<div class="stat-card stat-lost"><div class="stat-value">' + stats.lost + '</div><div class="stat-label">Lost</div></div>' +
        '<div class="stat-card stat-found"><div class="stat-value">' + stats.found + '</div><div class="stat-label">Found</div></div>' +
        '<div class="stat-card stat-resolved"><div class="stat-value">' + stats.resolved + '</div><div class="stat-label">Resolved</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + stats.pendingClaims + '</div><div class="stat-label">Pending Claims</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + stats.totalClaims + '</div><div class="stat-label">Total Claims</div></div>';

    renderAdminItems();
    renderAdminClaims();
}

function renderAdminItems() {
    var items = getItems();
    var tbody = document.getElementById("admin-items-tbody");
    if (!tbody) return;

    var html = "";
    for (var i = items.length - 1; i >= 0; i--) {
        var item = items[i];
        var statusBadge = item.status === "resolved"
            ? '<span class="badge badge-approved">Resolved</span>'
            : '<span class="badge badge-pending">Open</span>';

        html += "<tr>";
        html += "<td>" + item.id + "</td>";
        html += "<td>" + escapeHtml(item.title) + "</td>";
        html += "<td>" + escapeHtml(item.name) + "</td>";
        html += "<td>" + escapeHtml(item.roll) + "</td>";
        html += '<td><span class="badge ' + (item.type === "lost" ? "badge-lost" : "badge-found") + '">' + item.type + '</span></td>';
        html += "<td>" + escapeHtml(item.location) + "</td>";
        html += "<td>" + statusBadge + "</td>";
        html += "<td>" + item.date + "</td>";
        html += "<td>";
        if (item.status !== "resolved") {
            html += '<button class="btn btn-success btn-sm" onclick="resolveItem(' + item.id + ')">Resolve</button> ';
        }
        html += '<button class="btn btn-danger btn-sm" onclick="removeItem(' + item.id + ')">Delete</button>';
        html += "</td>";
        html += "</tr>";
    }
    tbody.innerHTML = html || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);">No items.</td></tr>';
}

function renderAdminClaims() {
    var claims = getClaims();
    var tbody = document.getElementById("admin-claims-tbody");
    if (!tbody) return;

    var html = "";
    for (var i = claims.length - 1; i >= 0; i--) {
        var claim = claims[i];
        var item = getItemById(claim.itemId);
        var statusBadge = claim.status === "pending"
            ? '<span class="badge badge-pending">Pending</span>'
            : claim.status === "approved"
                ? '<span class="badge badge-approved">Approved</span>'
                : '<span class="badge badge-rejected">Rejected</span>';

        html += "<tr>";
        html += "<td>" + claim.id + "</td>";
        html += "<td>" + (item ? escapeHtml(item.title) : "N/A") + "</td>";
        html += "<td>" + escapeHtml(claim.name) + "</td>";
        html += "<td>" + escapeHtml(claim.roll) + "</td>";
        html += "<td>" + escapeHtml(claim.proof) + "</td>";
        html += "<td>" + statusBadge + "</td>";
        html += "<td>" + claim.date + "</td>";
        html += "<td>";
        if (claim.status === "pending") {
            html += '<button class="btn btn-success btn-sm" onclick="approveClaim(' + claim.id + ')">Approve</button> ';
            html += '<button class="btn btn-danger btn-sm" onclick="rejectClaim(' + claim.id + ')">Reject</button>';
        } else {
            html += '<span style="color:var(--text-muted);font-size:12px;">Done</span>';
        }
        html += "</td>";
        html += "</tr>";
    }
    tbody.innerHTML = html || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">No claims.</td></tr>';
}

function resolveItem(id) {
    updateItemStatus(id, "resolved", null);
    showToast("Item marked as resolved.", "success");
    renderAdminDashboard();
}

function removeItem(id) {
    if (!confirm("Delete this item?")) return;
    deleteItem(id);
    showToast("Item deleted.", "success");
    renderAdminDashboard();
}

function approveClaim(claimId) {
    var claims = getClaims();
    for (var i = 0; i < claims.length; i++) {
        if (claims[i].id === claimId) {
            updateClaimStatus(claimId, "approved");
            updateItemStatus(claims[i].itemId, "resolved", claims[i]);
            break;
        }
    }
    showToast("Claim approved. Item resolved.", "success");
    renderAdminDashboard();
}

function rejectClaim(claimId) {
    updateClaimStatus(claimId, "rejected");
    showToast("Claim rejected.", "success");
    renderAdminDashboard();
}

function adminLogoutBtn() {
    adminLogout();
    window.location.href = "index.html";
}

// ---- Utilities ----
function escapeHtml(text) {
    var d = document.createElement("div");
    d.textContent = text || "";
    return d.innerHTML;
}

function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
}

function showError(field) {
    var group = field.closest(".form-group");
    if (group) group.classList.add("error");
}

function clearError(field) {
    var group = field.closest(".form-group");
    if (group) group.classList.remove("error");
}

// ---- Page Init ----
document.addEventListener("DOMContentLoaded", function () {
    updateActiveNav();
});
