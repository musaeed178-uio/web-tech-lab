const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'lost_and_found.db');

let db;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Save database to file
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
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
            FOREIGN KEY (reported_by) REFERENCES users(id)
        )
    `);

  // Insert default admin if not exists
  const adminCheck = db.exec("SELECT * FROM users WHERE username = 'admin'");
  if (!adminCheck.length || adminCheck[0].values.length === 0) {
    db.run("INSERT INTO users (username, email, password, role) VALUES ('admin', 'admin@comsats.edu.pk', 'admin123', 'admin')");
  }

  saveDatabase();
  console.log('Database initialized successfully');
}

// Helper: Run query and return results as array of objects
function queryAll(sql) {
  const result = db.exec(sql);
  if (!result.length) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

// Helper: Run query and return first result
function queryOne(sql) {
  const results = queryAll(sql);
  return results.length > 0 ? results[0] : null;
}

// ============ AUTH ROUTES ============

// Signup - INTENTIONALLY VULNERABLE TO SQL INJECTION
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;

  // VULNERABLE: Using string concatenation instead of parameterized queries
  const checkUserQuery = `SELECT * FROM users WHERE username = '${username}' OR email = '${email}'`;
  const existingUser = queryOne(checkUserQuery);

  if (existingUser) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }

  // VULNERABLE: SQL Injection here too
  const insertQuery = `INSERT INTO users (username, email, password, role) VALUES ('${username}', '${email}', '${password}', 'user')`;
  console.log('Signup query:', insertQuery);
  db.run(insertQuery);
  saveDatabase();

  res.json({ message: 'Account created successfully' });
});

// Login - INTENTIONALLY VULNERABLE TO SQL INJECTION
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // VULNERABLE: Classic SQL injection vulnerability
  // Try: admin' OR '1'='1' OR '1'='1
  // Or: ' OR '1'='1
  // Or: admin' --
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  console.log('Login query:', query);

  const user = queryOne(query);

  if (user) {
    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ============ ITEMS ROUTES ============

// Get all items - VULNERABLE
app.get('/api/items', (req, res) => {
  const { search, status } = req.query;

  let query = 'SELECT items.*, users.username as reporter FROM items LEFT JOIN users ON items.reported_by = users.id';
  const conditions = [];

  if (search) {
    // VULNERABLE: SQL Injection in search
    conditions.push(`(items.title LIKE '%${search}%' OR items.description LIKE '%${search}%')`);
  }

  if (status) {
    conditions.push(`items.status = '${status}'`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY items.date_reported DESC';

  console.log('Items query:', query);
  const items = queryAll(query);
  res.json(items);
});

// Get single item - VULNERABLE
app.get('/api/items/:id', (req, res) => {
  const { id } = req.params;
  // VULNERABLE: SQL Injection
  const query = `SELECT items.*, users.username as reporter FROM items LEFT JOIN users ON items.reported_by = users.id WHERE items.id = '${id}'`;
  const item = queryOne(query);

  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Report new item - VULNERABLE
app.post('/api/items', (req, res) => {
  const { title, description, category, location, status, reported_by, image_url } = req.body;

  // VULNERABLE: SQL Injection
  const query = `INSERT INTO items (title, description, category, location, status, reported_by, image_url) VALUES ('${title}', '${description}', '${category}', '${location}', '${status}', ${reported_by}, '${image_url || ''}')`;
  console.log('Insert item query:', query);

  db.run(query);
  saveDatabase();

  // Get the last inserted ID
  const result = queryOne('SELECT last_insert_rowid() as id');
  res.json({ message: 'Item reported successfully', id: result ? result.id : null });
});

// Update item - VULNERABLE
app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, category, location, status } = req.body;

  // VULNERABLE: SQL Injection
  const query = `UPDATE items SET title = '${title}', description = '${description}', category = '${category}', location = '${location}', status = '${status}' WHERE id = '${id}'`;
  console.log('Update item query:', query);

  db.run(query);
  saveDatabase();
  res.json({ message: 'Item updated successfully' });
});

// Delete item - VULNERABLE
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  // VULNERABLE: SQL Injection
  const query = `DELETE FROM items WHERE id = '${id}'`;
  console.log('Delete item query:', query);

  db.run(query);
  saveDatabase();
  res.json({ message: 'Item deleted successfully' });
});

// ============ ADMIN ROUTES ============

// Get all users - VULNERABLE
app.get('/api/admin/users', (req, res) => {
  // VULNERABLE: SQL Injection
  const query = `SELECT * FROM users`;
  const users = queryAll(query);
  // Remove passwords from response
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json(safeUsers);
});

// Delete user - VULNERABLE
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  // VULNERABLE: SQL Injection
  const query = `DELETE FROM users WHERE id = '${id}'`;
  console.log('Delete user query:', query);

  db.run(query);
  saveDatabase();
  res.json({ message: 'User deleted successfully' });
});

// Get stats
app.get('/api/stats', (req, res) => {
  const totalItems = queryOne('SELECT COUNT(*) as count FROM items').count;
  const lostItems = queryOne("SELECT COUNT(*) as count FROM items WHERE status = 'lost'").count;
  const foundItems = queryOne("SELECT COUNT(*) as count FROM items WHERE status = 'found'").count;
  const totalUsers = queryOne('SELECT COUNT(*) as count FROM users').count;

  res.json({
    totalItems,
    lostItems,
    foundItems,
    totalUsers
  });
});

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║   COMSATS Lost and Found Portal                      ║
  ║   Server running at http://localhost:${PORT}         ║
  ║                                                      ║
  ║   Default Admin: admin / admin123                    ║
  ║                                                      ║
  ║   WARNING: This app is INTENTIONALLY vulnerable      ║
  ║   to SQL Injection for educational purposes!         ║
  ╚══════════════════════════════════════════════════════╝
        `);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
