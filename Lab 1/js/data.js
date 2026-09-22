// ============================================================
// data.js - Hardcoded admin credentials + localStorage helpers
// ============================================================

var ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

// Initialize localStorage with sample data if empty
function initializeData() {
    if (!localStorage.getItem("lf_items")) {
        var sampleItems = [
            {
                id: 1,
                name: "Ahmed Raza",
                roll: "SP23-BCS-041",
                type: "lost",
                title: "Blue Backpack",
                description: "A blue JanSport backpack with a physics textbook and a water bottle inside. Lost near the library entrance on September 18th.",
                location: "Library Entrance",
                date: "2026-09-18",
                contact: "ahmed.raza@comsats.edu.pk",
                status: "open",
                claim: null
            },
            {
                id: 2,
                name: "Sara Malik",
                roll: "SP22-SE-015",
                type: "found",
                title: "Black Wallet",
                description: "Found a black leather wallet near the cafeteria. Contains ID cards and some cash. Please contact with proof of ownership.",
                location: "Cafeteria",
                date: "2026-09-19",
                contact: "sara.malik@comsats.edu.pk",
                status: "open",
                claim: null
            },
            {
                id: 3,
                name: "Usman Tariq",
                roll: "FA23-EE-008",
                type: "lost",
                title: "CASIO FX-991EX Calculator",
                description: "Lost my calculator during the midterm exam in Room 301. It has a small scratch on the back cover.",
                location: "E-Block Room 301",
                date: "2026-09-20",
                contact: "usman.tariq@comsats.edu.pk",
                status: "open",
                claim: null
            }
        ];
        localStorage.setItem("lf_items", JSON.stringify(sampleItems));
    }

    if (!localStorage.getItem("lf_claims")) {
        localStorage.setItem("lf_claims", JSON.stringify([]));
    }
}

function getItems() {
    return JSON.parse(localStorage.getItem("lf_items") || "[]");
}

function saveItems(items) {
    localStorage.setItem("lf_items", JSON.stringify(items));
}

function getItemById(id) {
    var items = getItems();
    for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) return items[i];
    }
    return null;
}

function addItem(item) {
    var items = getItems();
    item.id = items.length > 0 ? items[items.length - 1].id + 1 : 1;
    item.date = new Date().toISOString().split("T")[0];
    item.status = "open";
    item.claim = null;
    items.push(item);
    saveItems(items);
    return item;
}

function deleteItem(id) {
    var items = getItems();
    items = items.filter(function (item) { return item.id !== id; });
    saveItems(items);
}

function updateItemStatus(id, status, claimInfo) {
    var items = getItems();
    for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) {
            items[i].status = status;
            items[i].claim = claimInfo || null;
            break;
        }
    }
    saveItems(items);
}

function getClaims() {
    return JSON.parse(localStorage.getItem("lf_claims") || "[]");
}

function saveClaims(claims) {
    localStorage.setItem("lf_claims", JSON.stringify(claims));
}

function addClaim(claim) {
    var claims = getClaims();
    claim.id = claims.length > 0 ? claims[claims.length - 1].id + 1 : 1;
    claim.date = new Date().toISOString().split("T")[0];
    claim.status = "pending";
    claims.push(claim);
    saveClaims(claims);
    return claim;
}

function updateClaimStatus(id, status) {
    var claims = getClaims();
    for (var i = 0; i < claims.length; i++) {
        if (claims[i].id === id) {
            claims[i].status = status;
            break;
        }
    }
    saveClaims(claims);
}

function getStats() {
    var items = getItems();
    var claims = getClaims();
    return {
        total: items.length,
        lost: items.filter(function (i) { return i.type === "lost"; }).length,
        found: items.filter(function (i) { return i.type === "found"; }).length,
        resolved: items.filter(function (i) { return i.status === "resolved"; }).length,
        pendingClaims: claims.filter(function (c) { return c.status === "pending"; }).length,
        totalClaims: claims.length
    };
}

function isLoggedIn() {
    return sessionStorage.getItem("lf_admin") === "true";
}

function adminLogin(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem("lf_admin", "true");
        return true;
    }
    return false;
}

function adminLogout() {
    sessionStorage.removeItem("lf_admin");
}

// Initialize on load
initializeData();
