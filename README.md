# Link Student Activity - Season 09 🔗

## Overview
Link Student Activity Management System - A modern web application for managing student organization members, councils, and leadership roles.

## Features ✨
- **🔐 Authentication & Authorization** - Secure login with JWT tokens
- **👥 Role-Based Access Control** - Admin, Editor, and Viewer roles
- **📊 Modern Dashboard** - Beautiful dark-themed interface with gradient accents
- **👨‍🎓 Member Management** - Track students with roles (Director, Head, Delegate)
- **🏛️ Council Management** - Organize teams and departments
- **👑 Head/Leadership Tracking** - Manage council leaders
- **📈 Real-time Statistics** - View member counts by role
- **🔍 Search Functionality** - Quick member lookup
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **🔒 User Management** - Admin panel for user control

## Tech Stack 🛠️
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Session**: Cookie-parser
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Fonts**: Poppins (Google Fonts)
- **Styling**: Custom CSS with modern gradients and animations

## Installation 📦

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

5. Run the development server:
```bash
npm run dev
```

6. Login to the dashboard:
```
http://localhost:3000/login
```
Use the credentials created in step 4.

7. Access the main site:
```
http://localhost:3000
```

## 🔐 Security & Access Control

### User Roles
- **🔴 Admin**: Full access + user management
- **🟡 Editor**: Can add, edit, and delete data
- **🟢 Viewer**: Read-only access

### Protected Features
- Dashboard requires authentication
- Add/Edit/Delete operations require Editor or Admin role
- User management requires Admin role
- JWT tokens expire after 7 days

For detailed security documentation, see [SECURITY.md](SECURITY.md)
5``

4. Run the development server:
```bash
npm run dev
```

5. Open your browser:
```
http://localhost:3000
```

## Project Structure 📁
```
lll/
├── server.js              # Express server & API endpoints
├── public/
│   ├── index.html        # Landing page (Season 09)
│   ├── dashboard.html    # Admin dashboard
│   ├── app.js           # Frontend JavaScript
│   └── style.css        # Dashboard styles
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## API Endpoints 🔌

### Students/Members
- `GET /api/students` - Get all students
- `POST /api/students` - Add new student
- `DELETE /api/students/:id` - Delete student

### Councils
- `GET /api/councils` - Get all councils
- `POST /api/councils` - Add new council
- `DELETE /api/councils/:id` - Delete council

### Heads
- `GET /api/heads` - Get all heads
- `POST /api/heads` - Add new head
- `DELETE /api/heads/:id` - Delete head

## Member Roles 👥
- **🔷 Director** - Top leadership position
- **🔶 Head** - Council/department leaders
- **🔹 Delegate** - Team members

## Season 09 Theme 🎨
The website features a modern dark theme with:
- Background: Deep navy (#0a0f1e)
- Primary: Blue gradient (#4f8ef7 → #a78bfa)
- Animated background blobs
- Smooth transitions and hover effects
- Glass-morphism design elements

## Development 💻

### Run in development mode:
```bash
npm run dev
```

### Start production server:
```bash
npm start
```

## License 📄
© 2026 Link Student Activity - Season 09 · All rights reserved.

---

**Built with ❤️ by Link Student Activity Team**
*"Where Passion Meets Purpose"*
