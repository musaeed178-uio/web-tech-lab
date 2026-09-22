# COMSATS Lost & Found Portal

A static website prototype for the COMSATS campus community to report and recover lost and found items. Built with HTML, CSS, and JavaScript. All data is stored in the browser's localStorage.

## Project Structure

```
Lab 1/
├── index.html          # Home page with admin login button
├── report.html         # Report a lost or found item
├── items.html          # Browse and search all items
├── item.html           # Item detail page with claim option
├── admin.html          # Admin dashboard (login required)
├── css/
│   └── style.css       # All styling
├── js/
│   ├── data.js         # Admin credentials + localStorage helpers
│   └── app.js          # UI logic, forms, rendering
├── assets/             # Reserved for images
└── README.md
```

## How to Run

### Option 1: Direct File Access
Double-click `index.html` to open in your browser.

### Option 2: WampServer
1. Install WampServer from https://www.wampserver.com
2. Copy the `Lab 1` folder into `C:\wamp64\www\`
3. Start WampServer (ensure Apache is running)
4. Open `http://localhost/Lab 1/`

## Pages

| Page | Description |
|------|-------------|
| Home | Welcome page with quick links and recent reports |
| Report Item | Form to report a lost or found item |
| Browse Items | View all items with search, type, and status filters |
| Item Detail | View item details and submit a claim |
| Admin Dashboard | Manage items and review claims (admin login required) |

## Admin Access

Click the **Admin Login** button in the top-right corner of any page.

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

Admin credentials are hardcoded in `js/data.js`.

## Claim System

1. A user reports a **found** item
2. Another user sees it on the Browse page and clicks **Claim This Item**
3. They provide their name, roll number, and proof of ownership
4. The admin reviews the claim in the Admin Dashboard
5. Admin approves or rejects the claim
6. If approved, the item is marked as **Resolved**

## Features

- Responsive design (mobile, tablet, desktop)
- Mobile navigation menu with hamburger toggle
- Search and filter items by type and status
- Form validation on Report and Claim forms
- Admin dashboard with statistics
- Item claim and resolution workflow
- All data persists in localStorage (survives page refresh)
- No backend required, no dependencies

## Technologies

- HTML5
- CSS3 (custom properties, grid, flexbox)
- Vanilla JavaScript
- localStorage for data persistence
