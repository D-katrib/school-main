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

## Troubleshooting

### Expo Go Compatibility

This project uses Expo SDK 49.0.0, which requires a compatible version of Expo Go. If you see an error like:

```
ERROR  Project is incompatible with this version of Expo Go
```

You have two options:

1. **Install the correct Expo Go version**: Download Expo Go version compatible with SDK 49
   - For Android: [Expo Go Archive](https://github.com/expo/expo/releases?q=sdk-49&expanded=true)
   - For iOS: Use TestFlight to install an older version if available

2. **Update the project to match your Expo Go**: Update the project to use SDK 53 (requires code changes)

### API Connection Issues

If you encounter API connection errors:

1. **Check the API URL**: Make sure the API_URL in `services/api.ts` is set to your computer's actual IP address
   - For Android Emulator: `http://10.0.2.2:5000/api`
   - For iOS Simulator: `http://localhost:5000/api`
   - For physical device: `http://YOUR_COMPUTER_IP:5000/api` (use `ipconfig` to find your IP)

2. **Verify backend server**: Ensure the backend server is running on port 5000

3. **Network connectivity**: Make sure your device and computer are on the same network

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
