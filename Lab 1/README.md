# 🎓 COMSATS University Lost & Found Portal

A web application for reporting and finding lost items on campus.

## 📁 Project Structure

```
Lab 1/
├── server.js              # Backend server (Node.js + Express)
├── package.json           # Project dependencies
├── lost_and_found.db      # SQLite database (auto-created)
├── README.md              # This file
└── public/                # Frontend files
    ├── index.html         # Login/Signup page
    ├── dashboard.html     # Main user dashboard
    ├── admin.html         # Admin panel
    ├── css/
    │   └── style.css      # All styling
    └── js/
        ├── auth.js        # Login/Signup logic
        ├── dashboard.js   # Dashboard logic
        └── admin.js       # Admin panel logic
```

---

## 🚀 How to Run

### Step 1: Install Node.js
Download and install Node.js from https://nodejs.org

### Step 2: Open Terminal in this folder
```bash
cd "Lab 1"
```

### Step 3: Install dependencies
```bash
npm install
```

### Step 4: Start the server
```bash
npm start
```

### Step 5: Open browser
Go to: **http://localhost:3000**

---

## 🔐 Default Login

| Username | Password | Role |
|----------|----------|------|
| `admin`  | `admin123` | Admin |

---

## 📱 Pages

1. **Login/Signup Page** (`/`) - Create account or sign in
2. **Dashboard** (`/dashboard`) - Report items, view all items, search
3. **Admin Panel** (`/admin`) - Manage users and all items (admin only)

---

## 💡 What is an API? (Simple Explanation)

Think of an API like a **waiter in a restaurant**:

- You (the frontend) sit at a table
- The kitchen (the database) is in the back
- The waiter (the API) takes your order to the kitchen and brings back your food

**You don't go to the kitchen yourself.** The waiter handles communication.

### In technical terms:
- **Frontend** = What you see (buttons, forms, pages)
- **Backend** = The server that processes requests
- **Database** = Where data is stored
- **API** = The messenger that sends data between frontend and backend

---

## 🔌 API Endpoints (The "Menu" the waiter knows)

### Authentication

#### 1. Create Account (Signup)
```
POST /api/signup
```
**What it does:** Creates a new user account

**Data sent:**
```json
{
    "username": "john",
    "email": "john@comsats.edu.pk",
    "password": "mypassword"
}
```

**Response (success):**
```json
{
    "message": "Account created successfully"
}
```

---

#### 2. Login
```
POST /api/login
```
**What it does:** Verifies your credentials and logs you in

**Data sent:**
```json
{
    "username": "john",
    "password": "mypassword"
}
```

**Response (success):**
```json
{
    "message": "Login successful",
    "user": {
        "id": 1,
        "username": "john",
        "email": "john@comsats.edu.pk",
        "role": "user"
    }
}
```

---

### Items

#### 3. Get All Items
```
GET /api/items
```
**What it does:** Fetches all lost/found items

**Optional parameters:**
- `?search=backpack` - Search for items
- `?status=lost` - Filter by status

**Example:** `GET /api/items?search=phone&status=found`

---

#### 4. Report New Item
```
POST /api/items
```
**What it does:** Adds a new lost/found item

**Data sent:**
```json
{
    "title": "Blue Backpack",
    "description": "Found near library",
    "category": "bags",
    "location": "Library",
    "status": "found",
    "reported_by": 1
}
```

---

#### 5. Update Item
```
PUT /api/items/:id
```
**What it does:** Updates an existing item

**Example:** `PUT /api/items/5` updates item with ID 5

---

#### 6. Delete Item
```
DELETE /api/items/:id
```
**What it does:** Removes an item

**Example:** `DELETE /api/items/5` deletes item with ID 5

---

### Admin Routes

#### 7. Get All Users
```
GET /api/admin/users
```
**What it does:** Lists all registered users (admin only)

---

#### 8. Delete User
```
DELETE /api/admin/users/:id
```
**What it does:** Removes a user from the system

---

## ⚠️ SQL Injection Vulnerability (INTENTIONAL!)

This application is **INTENTIONALLY vulnerable** to SQL Injection for educational purposes.

### What is SQL Injection?

SQL Injection is when an attacker inserts malicious SQL code into input fields to manipulate the database.

### How to Test

**On the login page, try these:**

1. **Username:** `admin' OR '1'='1`
   **Password:** `anything`
   
   This works because the query becomes:
   ```sql
   SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = 'anything'
   ```
   Since `1=1` is always true, it returns the admin user!

2. **Username:** `' OR '1'='1`
   **Password:** `' OR '1'='1`
   
   This logs you in as the first user in the database.

3. **Username:** `admin' --`
   **Password:** `anything`
   
   The `--` comments out the password check!

### Why is this dangerous?

In a real application, this could allow attackers to:
- Bypass login without knowing the password
- View all data in the database
- Delete or modify data
- Take over the entire system

### How to fix it (in real apps)?

Always use **parameterized queries**:
```javascript
// VULNERABLE (our code):
const query = `SELECT * FROM users WHERE username = '${username}'`;

// SECURE (how it should be done):
const query = 'SELECT * FROM users WHERE username = ?';
db.prepare(query).get(username);  // User input is safely handled
```

---

## 🛠️ Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** SQLite (via better-sqlite3)
- **Frontend:** HTML, CSS, JavaScript
- **Styling:** Custom CSS (dark theme)

---

## 📝 Notes

- The database file (`lost_and_found.db`) is created automatically on first run
- All passwords are stored in plain text (intentionally insecure for demo)
- The admin account cannot be deleted
- Check the server console to see SQL queries being executed
