import { AuthProvider } from '../contexts/AuthContext';
import RootLayout from './_layout';

export default function App() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
} 