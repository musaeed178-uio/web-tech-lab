const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'lost_and_found.db');

let db;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
}

function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function queryOne(sql, params = []) {
    const results = queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
}

function runQuery(sql, params = []) {
    db.run(sql, params);
    saveDatabase();
}

async function initDatabase() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
        const fileBuffer = fs.readFileSync(DB_FILE);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            location TEXT,
            date_reported DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'lost',
            reported_by INTEGER,
            image_url TEXT,
            is_resolved INTEGER DEFAULT 0,
            FOREIGN KEY (reported_by) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            claimer_id INTEGER NOT NULL,
            proof_text TEXT,
            proof_image TEXT,
            status TEXT DEFAULT 'pending',
            admin_note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviewed_at DATETIME,
            FOREIGN KEY (item_id) REFERENCES items(id),
            FOREIGN KEY (claimer_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (claim_id) REFERENCES claims(id),
            FOREIGN KEY (sender_id) REFERENCES users(id)
        )
    `);

    const adminCheck = queryAll("SELECT id FROM users WHERE username = 'admin'");
    if (adminCheck.length === 0) {
        runQuery(
            "INSERT INTO users (username, email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
            ['admin', 'admin@comsats.edu.pk', 'admin123', 'System Administrator', '+92-300-0000000', 'admin']
        );
    }

    saveDatabase();
    console.log('Database initialized.');
}

// ==================== AUTH ====================

app.post('/api/signup', (req, res) => {
    const { username, email, password, full_name, phone } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const existing = queryOne("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
    if (existing) {
        return res.status(400).json({ error: 'Username or email already exists.' });
    }

    runQuery(
        "INSERT INTO users (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)",
        [username, email, password, full_name || '', phone || '']
    );

    res.json({ message: 'Account created successfully.' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = queryOne(
        "SELECT id, username, email, full_name, phone, role, is_active FROM users WHERE username = ? AND password = ?",
        [username, password]
    );

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.is_active) {
        return res.status(403).json({ error: 'Account has been deactivated. Contact admin.' });
    }

    res.json({ message: 'Login successful.', user });
});

// ==================== ITEMS ====================

app.get('/api/items', (req, res) => {
    const { search, status, category } = req.query;

    let sql = `
        SELECT items.*, users.username AS reporter_name, users.full_name AS reporter_full_name
        FROM items
        LEFT JOIN users ON items.reported_by = users.id
        WHERE items.is_resolved = 0
    `;
    const params = [];

    if (search) {
        sql += " AND (items.title LIKE ? OR items.description LIKE ? OR items.location LIKE ?)";
        const s = `%${search}%`;
        params.push(s, s, s);
    }

    if (status) {
        sql += " AND items.status = ?";
        params.push(status);
    }

    if (category) {
        sql += " AND items.category = ?";
        params.push(category);
    }

    sql += " ORDER BY items.date_reported DESC";

    const items = queryAll(sql, params);
    res.json(items);
});

app.get('/api/items/:id', (req, res) => {
    const item = queryOne(
        `SELECT items.*, users.username AS reporter_name, users.full_name AS reporter_full_name, users.phone AS reporter_phone
         FROM items
         LEFT JOIN users ON items.reported_by = users.id
         WHERE items.id = ?`,
        [req.params.id]
    );

    if (!item) {
        return res.status(404).json({ error: 'Item not found.' });
    }

    const claims = queryAll(
        `SELECT claims.*, users.username AS claimer_name, users.full_name AS claimer_full_name
         FROM claims
         LEFT JOIN users ON claims.claimer_id = users.id
         WHERE claims.item_id = ?
         ORDER BY claims.created_at DESC`,
        [req.params.id]
    );

    res.json({ ...item, claims });
});

app.post('/api/items', (req, res) => {
    const { title, description, category, location, status, reported_by, image_url } = req.body;

    if (!title || !reported_by) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    runQuery(
        "INSERT INTO items (title, description, category, location, status, reported_by, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [title, description || '', category || 'other', location || '', status || 'lost', reported_by, image_url || '']
    );

    const result = queryOne("SELECT last_insert_rowid() AS id");
    res.json({ message: 'Item reported successfully.', id: result.id });
});

app.put('/api/items/:id', (req, res) => {
    const { title, description, category, location, status } = req.body;

    runQuery(
        "UPDATE items SET title = ?, description = ?, category = ?, location = ?, status = ? WHERE id = ?",
        [title, description, category, location, status, req.params.id]
    );

    res.json({ message: 'Item updated successfully.' });
});

app.delete('/api/items/:id', (req, res) => {
    runQuery("DELETE FROM claims WHERE item_id = ?", [req.params.id]);
    runQuery("DELETE FROM items WHERE id = ?", [req.params.id]);
    res.json({ message: 'Item deleted successfully.' });
});

// ==================== CLAIMS ====================

app.post('/api/claims', (req, res) => {
    const { item_id, claimer_id, proof_text, proof_image } = req.body;

    if (!item_id || !claimer_id || !proof_text) {
        return res.status(400).json({ error: 'Item ID, claimer ID, and proof description are required.' });
    }

    const item = queryOne("SELECT * FROM items WHERE id = ?", [item_id]);
    if (!item) {
        return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.status !== 'found') {
        return res.status(400).json({ error: 'Only found items can be claimed.' });
    }

    if (item.reported_by === claimer_id) {
        return res.status(400).json({ error: 'You cannot claim your own found item report.' });
    }

    const existingClaim = queryOne(
        "SELECT id FROM claims WHERE item_id = ? AND claimer_id = ? AND status IN ('pending', 'approved')",
        [item_id, claimer_id]
    );

    if (existingClaim) {
        return res.status(400).json({ error: 'You already have an active claim on this item.' });
    }

    runQuery(
        "INSERT INTO claims (item_id, claimer_id, proof_text, proof_image) VALUES (?, ?, ?, ?)",
        [item_id, claimer_id, proof_text, proof_image || '']
    );

    const result = queryOne("SELECT last_insert_rowid() AS id");
    res.json({ message: 'Claim submitted successfully. Awaiting admin review.', id: result.id });
});

app.get('/api/claims/pending', (req, res) => {
    const claims = queryAll(`
        SELECT claims.*,
               items.title AS item_title, items.description AS item_description,
               items.category AS item_category, items.location AS item_location,
               users.username AS claimer_name, users.full_name AS claimer_full_name,
               users.email AS claimer_email
        FROM claims
        LEFT JOIN items ON claims.item_id = items.id
        LEFT JOIN users ON claims.claimer_id = users.id
        WHERE claims.status = 'pending'
        ORDER BY claims.created_at DESC
    `);
    res.json(claims);
});

app.get('/api/claims/user/:userId', (req, res) => {
    const claims = queryAll(`
        SELECT claims.*,
               items.title AS item_title, items.status AS item_status,
               items.location AS item_location
        FROM claims
        LEFT JOIN items ON claims.item_id = items.id
        WHERE claims.claimer_id = ?
        ORDER BY claims.created_at DESC
    `, [req.params.userId]);
    res.json(claims);
});

app.put('/api/claims/:id/review', (req, res) => {
    const { status, admin_note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }

    const claim = queryOne("SELECT * FROM claims WHERE id = ?", [req.params.id]);
    if (!claim) {
        return res.status(404).json({ error: 'Claim not found.' });
    }

    runQuery(
        "UPDATE claims SET status = ?, admin_note = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, admin_note || '', req.params.id]
    );

    if (status === 'approved') {
        runQuery("UPDATE items SET is_resolved = 1 WHERE id = ?", [claim.item_id]);
    }

    res.json({ message: `Claim ${status}.` });
});

// ==================== MESSAGES ====================

app.get('/api/messages/:claimId', (req, res) => {
    const messages = queryAll(`
        SELECT messages.*, users.username AS sender_name, users.full_name AS sender_full_name
        FROM messages
        LEFT JOIN users ON messages.sender_id = users.id
        WHERE messages.claim_id = ?
        ORDER BY messages.created_at ASC
    `, [req.params.claimId]);
    res.json(messages);
});

app.post('/api/messages', (req, res) => {
    const { claim_id, sender_id, content } = req.body;

    if (!claim_id || !sender_id || !content) {
        return res.status(400).json({ error: 'Claim ID, sender ID, and content are required.' });
    }

    const claim = queryOne("SELECT * FROM claims WHERE id = ?", [claim_id]);
    if (!claim) {
        return res.status(404).json({ error: 'Claim not found.' });
    }

    if (claim.status !== 'approved') {
        return res.status(400).json({ error: 'Messaging is only available for approved claims.' });
    }

    runQuery(
        "INSERT INTO messages (claim_id, sender_id, content) VALUES (?, ?, ?)",
        [claim_id, sender_id, content]
    );

    const result = queryOne("SELECT last_insert_rowid() AS id");
    res.json({ message: 'Message sent.', id: result.id });
});

app.get('/api/messages/contact/:claimId', (req, res) => {
    const claim = queryOne("SELECT * FROM claims WHERE id = ? AND status = 'approved'", [req.params.claimId]);
    if (!claim) {
        return res.status(403).json({ error: 'Contact info only available for approved claims.' });
    }

    const item = queryOne("SELECT * FROM items WHERE id = ?", [claim.item_id]);
    const claimer = queryOne("SELECT id, username, full_name, email, phone FROM users WHERE id = ?", [claim.claimer_id]);
    const reporter = queryOne("SELECT id, username, full_name, email, phone FROM users WHERE id = ?", [item.reported_by]);

    res.json({
        claimer: claimer,
        reporter: reporter
    });
});

// ==================== ADMIN ====================

app.get('/api/admin/stats', (req, res) => {
    const totalItems = queryOne("SELECT COUNT(*) AS count FROM items").count;
    const lostItems = queryOne("SELECT COUNT(*) AS count FROM items WHERE status = 'lost' AND is_resolved = 0").count;
    const foundItems = queryOne("SELECT COUNT(*) AS count FROM items WHERE status = 'found' AND is_resolved = 0").count;
    const resolvedItems = queryOne("SELECT COUNT(*) AS count FROM items WHERE is_resolved = 1").count;
    const totalUsers = queryOne("SELECT COUNT(*) AS count FROM users").count;
    const pendingClaims = queryOne("SELECT COUNT(*) AS count FROM claims WHERE status = 'pending'").count;
    const totalClaims = queryOne("SELECT COUNT(*) AS count FROM claims").count;

    res.json({ totalItems, lostItems, foundItems, resolvedItems, totalUsers, pendingClaims, totalClaims });
});

app.get('/api/admin/users', (req, res) => {
    const users = queryAll("SELECT id, username, email, full_name, phone, role, is_active, created_at FROM users ORDER BY created_at DESC");
    res.json(users);
});

app.put('/api/admin/users/:id', (req, res) => {
    const { is_active, role } = req.body;

    if (role !== undefined) {
        runQuery("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    }

    if (is_active !== undefined) {
        runQuery("UPDATE users SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, req.params.id]);
    }

    res.json({ message: 'User updated.' });
});

app.delete('/api/admin/users/:id', (req, res) => {
    const user = queryOne("SELECT role FROM users WHERE id = ?", [req.params.id]);
    if (user && user.role === 'admin') {
        return res.status(403).json({ error: 'Cannot delete admin account.' });
    }

    runQuery("UPDATE items SET reported_by = NULL WHERE reported_by = ?", [req.params.id]);
    runQuery("UPDATE claims SET claimer_id = NULL WHERE claimer_id = ?", [req.params.id]);
    runQuery("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: 'User deleted.' });
});

app.get('/api/admin/items', (req, res) => {
    const items = queryAll(`
        SELECT items.*, users.username AS reporter_name
        FROM items
        LEFT JOIN users ON items.reported_by = users.id
        ORDER BY items.date_reported DESC
    `);
    res.json(items);
});

app.get('/api/admin/claims', (req, res) => {
    const claims = queryAll(`
        SELECT claims.*,
               items.title AS item_title, items.status AS item_status,
               items.location AS item_location,
               claimer.username AS claimer_name, claimer.full_name AS claimer_full_name, claimer.email AS claimer_email,
               reporter.username AS reporter_name, reporter.full_name AS reporter_full_name, reporter.email AS reporter_email
        FROM claims
        LEFT JOIN items ON claims.item_id = items.id
        LEFT JOIN users AS claimer ON claims.claimer_id = claimer.id
        LEFT JOIN users AS reporter ON items.reported_by = reporter.id
        ORDER BY claims.created_at DESC
    `);
    res.json(claims);
});

app.get('/api/users/:id', (req, res) => {
    const user = queryOne("SELECT id, username, email, full_name, phone FROM users WHERE id = ?", [req.params.id]);
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
});

// ==================== PAGES ====================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/item/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'item.html')));

// ==================== START ====================

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`
  ================================================
   COMSATS University - Lost & Found Portal
   Server running at http://localhost:${PORT}
   Default Admin: admin / admin123
  ================================================
        `);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
