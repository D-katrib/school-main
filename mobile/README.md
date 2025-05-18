# School Management Mobile App 📚

This is the mobile application for the School Management System, built with [Expo](https://expo.dev) and React Native. This app allows students, teachers, and administrators to access the school management system on the go.

## Features

- **Course Management**: View course details, materials, and schedules
- **Assignment Management**: View, submit, and track assignments
- **File Uploads**: Upload files for assignments and course materials
- **Authentication**: Secure login and token-based authentication

## Dependencies

- Expo SDK
- React Navigation
- Expo Router for file-based routing
- Expo Document Picker for file uploads
- Expo Web Browser for viewing documents
- Axios for API requests
- AsyncStorage for local data storage

## API Integration

The mobile app connects to the same backend API as the web application. The API service is configured in `services/api.ts` and includes endpoints for:

- Authentication (login, register, profile management)
- Courses (listing, details, materials)
- Assignments (viewing, submission)

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure API URL

   Update the API URL in `services/api.ts` to point to your backend server.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a:

- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go) on your physical device

## Project Structure

```
mobile/
├── app/                  # Main application code using Expo Router
│   ├── (tabs)/           # Tab-based navigation screens
│   │   ├── index.tsx     # Home screen
│   │   ├── courses.tsx   # Courses listing screen
│   │   └── assignments.tsx # Assignments screen
│   ├── course/           # Course-related screens
│   │   ├── [id].tsx      # Course detail screen
│   │   └── material.tsx  # Material viewer
│   ├── assignment/       # Assignment-related screens
│   │   └── [id].tsx      # Assignment detail and submission screen
│   └── login.tsx         # Authentication screen
├── components/           # Reusable UI components
├── contexts/             # React contexts (Auth, Theme)
├── services/             # API services
│   └── api.ts            # API client and service methods
└── assets/               # Images, fonts, and other static files
```

## Authentication Flow

The app uses JWT token-based authentication:

1. User logs in with email/password
2. Backend returns a JWT token
3. Token is stored in AsyncStorage
4. API requests include the token in Authorization header
5. When token expires, user is redirected to login

## File Upload Implementation

File uploads are handled using:

1. Expo Document Picker to select files
2. FormData to prepare multipart/form-data requests
3. Custom headers in API requests to handle file uploads

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
