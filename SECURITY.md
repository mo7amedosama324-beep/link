# 🔐 Link Student Activity - Security Documentation

## Authentication & Authorization System

This project now includes a comprehensive security system with JWT authentication and role-based access control.

## 📋 User Roles

### 🔴 Admin
- **Full Access**: Can view, create, edit, and delete all data
- **User Management**: Can create, edit, disable/enable, and delete users
- **Special Tab**: Access to "User Management" tab in dashboard

### 🟡 Editor
- **Edit Access**: Can view, create, edit, and delete data (councils, heads, students)
- **No User Management**: Cannot manage users

### 🟢 Viewer
- **Read-Only**: Can only view data
- **No Edit/Delete**: Cannot add, edit, or delete any data
- **Forms Hidden**: All forms and delete buttons are hidden

## 🔑 Default Login Credentials

Created by running `node create-admin.js`:

```
Admin Account:
Username: admin
Password: admin123
Role: admin

Editor Account:
Username: editor
Password: editor123
Role: editor

Viewer Account:
Username: viewer
Password: viewer123
Role: viewer
```

**⚠️ IMPORTANT**: Change these passwords after first login!

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file with:
```
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### 3. Create Users
```bash
node create-admin.js
```

### 4. Start Server
```bash
npm start
# or
npm run dev
```

### 5. Login
- Visit: http://localhost:3000/login
- Use one of the default accounts above

## 🔒 Protected Routes

### Public Routes (No Authentication Required)
- `GET /` - Landing page
- `GET /login` - Login page
- `GET /api/councils` - View councils
- `GET /api/heads` - View heads
- `GET /api/students` - View students

### Protected Routes (Authentication Required)

#### Editor & Admin Only
- `POST /api/councils` - Create council
- `DELETE /api/councils/:id` - Delete council
- `POST /api/heads` - Create head
- `DELETE /api/heads/:id` - Delete head
- `POST /api/students` - Create student
- `DELETE /api/students/:id` - Delete student

#### Admin Only
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user (role, status, name)
- `DELETE /api/users/:id` - Delete user

### Authentication Routes
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

## 🛡️ Security Features

### 1. JWT Token Authentication
- Tokens expire after 7 days
- Stored in HTTP-only cookies
- Also stored in localStorage as backup

### 2. Password Hashing
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Never returned in API responses

### 3. Role-Based Access Control (RBAC)
- Middleware checks user role before allowing access
- Three permission levels: admin, editor, viewer
- UI automatically hides unavailable features

### 4. Session Management
- Automatic session validation
- Redirect to login if not authenticated
- Token refresh on page load

### 5. CORS Configuration
- Credentials enabled for cookie support
- Configurable origin restrictions

## 📱 Frontend Integration

### Authentication Check
The dashboard automatically checks authentication on load:
```javascript
// Checks if user is logged in
// Redirects to /login if not authenticated
// Updates UI based on user role
```

### API Calls with Authentication
All API calls include the JWT token:
```javascript
fetch('/api/endpoint', {
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
```

## 👥 Managing Users (Admin)

1. Login as admin
2. Navigate to "Users" tab in dashboard
3. Add new users with username, password, and role
4. Enable/disable user accounts
5. Delete users (cannot delete yourself)

## 🔧 Customization

### Adding More Roles
1. Update `User.js` model enum
2. Add role in `auth.js` middleware
3. Update `create-admin.js` if needed
4. Modify UI role display in `app.js`

### Changing Token Expiration
In `middleware/auth.js`:
```javascript
expiresIn: '7d' // Change to desired duration
```

### Password Requirements
In `User.js` model:
```javascript
minlength: 6 // Change minimum password length
```

## 🧪 Testing

### Test Different Roles
1. Login as admin - should see Users tab and all features
2. Login as editor - should see add/delete buttons, no Users tab
3. Login as viewer - should only see data, no edit features

### Test Security
1. Try accessing `/dashboard` without login → redirects to `/login`
2. Try POST to protected endpoint without auth → 401 Unauthorized
3. Try accessing admin endpoint as editor → 403 Forbidden

## 🐛 Troubleshooting

### "Authentication required" Error
- Check if token is valid
- Try logging out and logging in again
- Clear browser cookies and localStorage

### "Invalid token" Error
- Token might be expired
- Logout and login again
- Check JWT_SECRET matches between server and .env

### Cannot Delete/Edit Data
- Check user role (viewer cannot edit)
- Verify authentication token is included in requests
- Check server logs for errors

## 📝 Notes

- Always use HTTPS in production
- Change default passwords immediately
- Keep JWT_SECRET secure and never commit it
- Regularly audit user access
- Consider implementing password change feature
- Consider adding password reset functionality
- Consider adding email verification

## 🔄 Logout
Click the "🚪 Logout" button in the sidebar or send POST to `/api/auth/logout`
