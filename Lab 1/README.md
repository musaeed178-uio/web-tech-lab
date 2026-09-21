# COMSATS University - Lost & Found Portal

A professional web application for the COMSATS campus community to report, search, and recover lost and found items.

## Features

- **Item Reporting** - Report lost or found items with category, location, and description
- **Claim System** - Found item owners can submit proof-of-ownership claims
- **Admin Review** - Admins review and approve/reject claims before contact info is shared
- **Messaging** - Approved claimants and item reporters can communicate directly
- **Dark/Light Mode** - Toggle between themes for user preference
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Secure Authentication** - Parameterized SQL queries prevent SQL injection
- **Admin Dashboard** - Full control over users, items, and claims

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (v16 or higher)

### Installation

```bash
# Navigate to the project folder
cd "Lab 1"

# Install dependencies
npm install

# Start the server
npm start
```

### Access the Application

Open your browser and go to: **http://localhost:3000**

### Default Admin Credentials

| Username | Password |
|----------|----------|
| `admin`  | `admin123` |

## Project Structure

```
Lab 1/
├── server.js              # Backend server (Express + SQLite)
├── package.json           # Project dependencies
├── lost_and_found.db      # SQLite database (auto-created)
├── README.md              # Documentation
└── public/
    ├── index.html         # Login/Signup page
    ├── dashboard.html     # User dashboard
    ├── admin.html         # Admin panel
    ├── item.html          # Item detail page
    ├── css/
    │   └── style.css      # All styling with dark/light themes
    └── js/
        ├── auth.js        # Login/signup logic
        ├── dashboard.js   # Dashboard logic
        ├── admin.js       # Admin panel logic
        └── item.js        # Item detail & messaging logic
```

## How It Works

### For Regular Users

1. **Sign Up** - Create an account with your COMSATS email
2. **Report Items** - Report something you lost or found
3. **Browse Items** - Search and filter through reported items
4. **Claim Items** - If you see your lost item marked as "Found", click "Claim This Item"
5. **Provide Proof** - Describe details only you would know (serial number, unique markings, etc.)
6. **Wait for Review** - An admin reviews your claim
7. **Chat** - Once approved, contact information is revealed and you can message the finder

### For Admins

1. **Review Claims** - Approve or reject item claims with notes
2. **Manage Users** - Activate/deactivate accounts, change roles
3. **Manage Items** - Delete inappropriate or resolved items
4. **View Statistics** - Monitor total items, claims, and user activity

## Understanding APIs

### What is an API?

An API (Application Programming Interface) is like a **messenger** between the frontend (what you see) and the backend (the server and database).

**Analogy:** Think of a restaurant:
- You (the user) sit at a table
- The kitchen (the database) prepares food
- The waiter (the API) takes your order to the kitchen and brings back your food

You never go to the kitchen yourself. The waiter handles all communication.

### API Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/signup` | Create a new user account |
| `POST` | `/api/login` | Authenticate and get user info |

**POST /api/signup**
```json
Request: {
    "username": "john_doe",
    "email": "john@comsats.edu.pk",
    "password": "securepass123",
    "full_name": "John Doe",
    "phone": "+92-300-1234567"
}

Response: {
    "message": "Account created successfully."
}
```

**POST /api/login**
```json
Request: {
    "username": "john_doe",
    "password": "securepass123"
}

Response: {
    "message": "Login successful.",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@comsats.edu.pk",
        "full_name": "John Doe",
        "role": "user",
        "is_active": 1
    }
}
```

#### Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/items` | Get all items (with optional filters) |
| `GET` | `/api/items/:id` | Get single item with claims |
| `POST` | `/api/items` | Report a new item |
| `PUT` | `/api/items/:id` | Update an item |
| `DELETE` | `/api/items/:id` | Delete an item |

**GET /api/items?search=phone&status=lost&category=electronics**

Query parameters:
- `search` - Search in title, description, location
- `status` - Filter by "lost" or "found"
- `category` - Filter by category

**POST /api/items**
```json
Request: {
    "title": "iPhone 14 Pro",
    "description": "Space gray with a crack on the back",
    "category": "electronics",
    "location": "Library, 2nd Floor",
    "status": "found",
    "reported_by": 1
}

Response: {
    "message": "Item reported successfully.",
    "id": 1
}
```

#### Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/claims` | Submit a claim on an item |
| `GET` | `/api/claims/pending` | Get pending claims (admin) |
| `GET` | `/api/claims/user/:userId` | Get user's claims |
| `PUT` | `/api/claims/:id/review` | Approve/reject claim (admin) |

**POST /api/claims**
```json
Request: {
    "item_id": 1,
    "claimer_id": 2,
    "proof_text": "The phone has a sticker of a cat on the back case. The screen protector has a small crack on the top left. I lost it on September 10th around 3pm near the library entrance."
}

Response: {
    "message": "Claim submitted successfully. Awaiting admin review.",
    "id": 1
}
```

**PUT /api/claims/:id/review** (Admin only)
```json
Request: {
    "status": "approved",
    "admin_note": "Proof is detailed and convincing."
}

Response: {
    "message": "Claim approved."
}
```

#### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages/:claimId` | Get messages for a claim |
| `POST` | `/api/messages` | Send a message |
| `GET` | `/api/messages/contact/:claimId` | Get contact info (approved claims only) |

**POST /api/messages**
```json
Request: {
    "claim_id": 1,
    "sender_id": 1,
    "content": "Hi, I found your phone. Where would you like to meet?"
}

Response: {
    "message": "Message sent.",
    "id": 1
}
```

#### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Get platform statistics |
| `GET` | `/api/admin/users` | Get all users |
| `PUT` | `/api/admin/users/:id` | Update user role/status |
| `DELETE` | `/api/admin/users/:id` | Delete a user |
| `GET` | `/api/admin/items` | Get all items |
| `GET` | `/api/admin/claims` | Get all claims with details |

**GET /api/admin/stats**
```json
Response: {
    "totalItems": 15,
    "lostItems": 8,
    "foundItems": 7,
    "resolvedItems": 3,
    "totalUsers": 42,
    "pendingClaims": 2,
    "totalClaims": 5
}
```

## Claim Workflow

```
1. User A reports a found item
        |
        v
2. User B sees the item and clicks "Claim This Item"
        |
        v
3. User B provides proof of ownership (description, serial number, etc.)
        |
        v
4. Claim status = "pending"
        |
        v
5. Admin reviews the claim in the Admin Panel
        |
        v
6. Admin approves or rejects with a note
        |
        +--> If approved:
        |       - Item marked as "resolved"
        |       - Contact info revealed to both parties
        |       - Chat enabled between User A and User B
        |
        +--> If rejected:
                - Claimer can submit a new claim with better proof
```

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Unique username |
| email | TEXT | Unique email |
| password | TEXT | Plain text password |
| full_name | TEXT | User's full name |
| phone | TEXT | Phone number |
| role | TEXT | "user" or "admin" |
| is_active | INTEGER | 1 = active, 0 = deactivated |
| created_at | DATETIME | Account creation date |

### items
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| title | TEXT | Item title |
| description | TEXT | Item description |
| category | TEXT | Category (electronics, bags, etc.) |
| location | TEXT | Where lost/found |
| status | TEXT | "lost" or "found" |
| reported_by | INTEGER | Foreign key to users |
| is_resolved | INTEGER | 1 = item claimed and resolved |
| date_reported | DATETIME | Report date |

### claims
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| item_id | INTEGER | Foreign key to items |
| claimer_id | INTEGER | Foreign key to users |
| proof_text | TEXT | Proof of ownership |
| status | TEXT | "pending", "approved", or "rejected" |
| admin_note | TEXT | Admin's note |
| created_at | DATETIME | Claim submission date |
| reviewed_at | DATETIME | Review date |

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| claim_id | INTEGER | Foreign key to claims |
| sender_id | INTEGER | Foreign key to users |
| content | TEXT | Message content |
| created_at | DATETIME | Message date |

## Security

- **SQL Injection:** All database queries use parameterized statements (no string concatenation)
- **Input Validation:** Required fields are validated on both client and server
- **Access Control:** Admin routes verify the user's role
- **Contact Info Protection:** Phone/email only revealed after admin-approved claim

## Technologies

- **Backend:** Node.js, Express.js
- **Database:** SQLite (via sql.js)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Styling:** Custom CSS with CSS variables for theming
