# CampusConnect - COMSATS University Web Portal

A simple static website for the COMSATS campus community to find information about departments, courses, student services, and contact details.

## Project Structure

```
Lab 1/
├── index.html          # Home page
├── departments.html    # Academic departments
├── courses.html        # Course catalog
├── services.html       # Student services
├── contact.html        # Contact form with validation
├── css/
│   └── style.css       # All styling
├── js/
│   └── script.js       # Mobile menu + form validation
├── assets/             # (reserved for images)
└── README.md           # This file
```

## How to Run

### Option 1: Direct File Access
Open `index.html` in any web browser.

### Option 2: WampServer (Recommended)
1. Install WampServer from https://www.wampserver.com
2. Copy the `Lab 1` folder into `C:\wamp64\www\`
3. Start WampServer (make sure Apache is running)
4. Open browser and go to `http://localhost/Lab 1/`

## Pages

| Page | Description |
|------|-------------|
| Home | Welcome page with quick access links and overview |
| Departments | Table listing all academic departments with contacts |
| Courses | Course catalog with codes, names, credits, and departments |
| Student Services | List of support services (library, financial aid, counselling, etc.) |
| Contact | Enquiry form with JavaScript validation |

## Technologies Used

- HTML5
- CSS3
- JavaScript (vanilla)
- WampServer for local hosting

## Features

- Responsive design (works on mobile, tablet, desktop)
- Mobile navigation menu with toggle
- Consistent header and footer across all pages
- Form validation on the Contact page
- Clean, professional layout
