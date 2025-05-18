import { Redirect } from 'expo-router';

// Ana sayfa, kullanıcıyı (tabs) klasöründeki index sayfasına yönlendirir
export default function Index() {
  return <Redirect href="/(tabs)/" />;
} 