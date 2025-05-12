# MySchool Backend

This is the backend server for the MySchool platform, a comprehensive school management system.

## Features

- User authentication with JWT and Firebase
- Role-based access control (Admin, Teacher, Student, Parent)
- Course management
- Assignment creation and submission
- Attendance tracking
- Grade management
- Real-time notifications with Socket.io

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Firebase** - Authentication provider
- **Socket.io** - Real-time communication

## Directory Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── index.js         # Entry point
├── .env.example         # Environment variables example
├── package.json         # Dependencies
└── README.md            # Documentation
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd backend
npm install
```

3. Create a `.env` file based on `.env.example` and fill in your configuration details
4. Start the server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

The API follows RESTful principles with the following main endpoints:

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/firebase` - Firebase authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - End session

### Users

- `GET /api/users` - List users (with filters)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/parent/students` - Get students for a parent
- `GET /api/users/student/teachers` - Get teachers for a student

### Courses

- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `PUT /api/courses/:id/enroll` - Enroll students in a course
- `PUT /api/courses/:id/unenroll` - Remove students from a course

### Assignments

- `GET /api/assignments` - List assignments
- `GET /api/assignments/:id` - Get assignment details
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment
- `POST /api/assignments/:id/submit` - Submit assignment
- `GET /api/assignments/:id/submissions` - Get all submissions for an assignment
- `PUT /api/assignments/submissions/:id` - Grade submission

### Attendance

- `GET /api/attendance` - Query attendance records
- `GET /api/attendance/stats` - Get attendance statistics
- `POST /api/attendance` - Record attendance
- `POST /api/attendance/bulk` - Bulk record attendance

### Grades

- `GET /api/grades` - Query grades
- `GET /api/grades/summary` - Get course grade summary
- `POST /api/grades` - Record grade
- `POST /api/grades/bulk` - Bulk record grades

### Notifications

- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread/count` - Get unread notification count
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

## Authentication

The system uses JWT (JSON Web Token) for authentication. For each protected endpoint, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Role-Based Access Control

The system implements four primary user roles:

1. **Admin** - Full system access
2. **Teacher** - Course management, grading, attendance
3. **Student** - Course access, assignment submission
4. **Parent** - Progress monitoring

Each API endpoint has specific access control based on these roles.

## Real-time Features

The following features use Socket.io for real-time updates:

- Notifications
- Chat messages
- Grade posting alerts
- Assignment submission confirmations

## Environment Variables

The following environment variables need to be set in your `.env` file:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/myschool

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Firebase Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

## License

ISC
