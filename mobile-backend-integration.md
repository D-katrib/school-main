# Mobil Uygulama ve Backend Entegrasyonu

Bu dosya, mobil uygulamanızı backend API'si ile nasıl bağlayacağınızı açıklar.

## Backend API Bilgileri

Backend sunucusu aşağıdaki özelliklere sahiptir:
- Node.js ve Express.js ile oluşturulmuş bir REST API
- MongoDB veritabanı kullanılıyor
- JWT kimlik doğrulama sistemi
- Socket.IO gerçek zamanlı iletişim desteği

## API Endpoint'leri

Backend şu ana endpoint'lere sahiptir:
- `/api/auth` - Kimlik doğrulama işlemleri (giriş, kayıt)
- `/api/users` - Kullanıcı yönetimi
- `/api/courses` - Kurs yönetimi
- `/api/assignments` - Ödev yönetimi
- `/api/attendance` - Yoklama yönetimi
- `/api/grades` - Not yönetimi
- `/api/notifications` - Bildirim yönetimi

## Mobil Uygulama Entegrasyonu

### 1. HTTP İstekleri (REST API)

Mobil uygulamanızda HTTP istekleri yapmak için şunları kullanabilirsiniz:

#### React Native için:
```javascript
// Axios kullanarak
import axios from 'axios';

// API temel URL'sini yapılandırma
const API_URL = 'http://192.168.1.14:5000/api'; // Kendi IP adresinizi kullanın
// Veya canlı sunucu için: const API_URL = 'https://sizin-sunucu-adresiniz.com/api';

// Axios örneği oluşturma
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 saniye
  headers: {
    'Content-Type': 'application/json'
  }
});

// JWT token'ı için interceptor
apiClient.interceptors.request.use(
  async config => {
    // AsyncStorage'den token alma örneği
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Örnek API çağrıları
const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (userData) => apiClient.post('/auth/register', userData)
};

const coursesAPI = {
  getAllCourses: (params) => apiClient.get('/courses', { params }),
  getCourseById: (id) => apiClient.get(`/courses/${id}`),
  createCourse: (courseData) => apiClient.post('/courses', courseData),
  updateCourse: (id, courseData) => apiClient.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => apiClient.delete(`/courses/${id}`),
  enrollStudents: (courseId, studentIds) => apiClient.put(`/courses/${courseId}/enroll`, { studentIds }),
  unenrollStudents: (courseId, studentIds) => apiClient.put(`/courses/${courseId}/unenroll`, { studentIds })
};

// Diğer API modülleri burada tanımlanabilir
```

#### Flutter için:
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  final String baseUrl = 'http://192.168.1.14:5000/api'; // Kendi IP adresinizi kullanın
  
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }
  
  Future<Map<String, String>> getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token != null ? 'Bearer $token' : '',
    };
  }
  
  // Kimlik doğrulama API'si
  Future<http.Response> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/login');
    return http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
  }
  
  // Kurslar API'si
  Future<http.Response> getAllCourses() async {
    final url = Uri.parse('$baseUrl/courses');
    return http.get(url, headers: await getHeaders());
  }
  
  Future<http.Response> getCourseById(String id) async {
    final url = Uri.parse('$baseUrl/courses/$id');
    return http.get(url, headers: await getHeaders());
  }
  
  // Diğer API çağrıları burada tanımlanabilir
}
```

### 2. Gerçek Zamanlı İletişim (Socket.IO)

Backend'de Socket.IO kullanılıyor. Mobil uygulamanızda gerçek zamanlı iletişim kurmak için:

#### React Native için:
```javascript
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const setupSocket = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const userId = await AsyncStorage.getItem('userId');
  
  const socket = io('http://192.168.1.14:5000', {
    query: { token },
    transports: ['websocket']
  });
  
  socket.on('connect', () => {
    console.log('Socket.IO bağlantısı kuruldu');
    
    // Kullanıcı ID'sine göre odaya katılma
    if (userId) {
      socket.emit('join', userId);
    }
  });
  
  // Bildirimleri dinleme
  socket.on('notification', (data) => {
    console.log('Yeni bildirim:', data);
    // Bildirim işleme mantığı
  });
  
  // Mesajları dinleme
  socket.on('message', (data) => {
    console.log('Yeni mesaj:', data);
    // Mesaj işleme mantığı
  });
  
  socket.on('disconnect', () => {
    console.log('Socket.IO bağlantısı kesildi');
  });
  
  return socket;
};

export default setupSocket;
```

#### Flutter için:
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';

class SocketService {
  IO.Socket? socket;
  
  Future<void> initSocket() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('authToken');
    final userId = prefs.getString('userId');
    
    socket = IO.io('http://192.168.1.14:5000', <String, dynamic>{
      'transports': ['websocket'],
      'query': {'token': token}
    });
    
    socket!.on('connect', (_) {
      print('Socket.IO bağlantısı kuruldu');
      
      // Kullanıcı ID'sine göre odaya katılma
      if (userId != null) {
        socket!.emit('join', userId);
      }
    });
    
    // Bildirimleri dinleme
    socket!.on('notification', (data) {
      print('Yeni bildirim: $data');
      // Bildirim işleme mantığı
    });
    
    // Mesajları dinleme
    socket!.on('message', (data) {
      print('Yeni mesaj: $data');
      // Mesaj işleme mantığı
    });
    
    socket!.on('disconnect', (_) {
      print('Socket.IO bağlantısı kesildi');
    });
  }
  
  void disconnect() {
    socket?.disconnect();
  }
  
  void sendMessage(String to, String message) {
    socket?.emit('message', {'to': to, 'message': message});
  }
}
```

## Kurulum Adımları

1. Backend'i çalıştırın:
   ```
   cd backend
   npm install
   npm run dev
   ```

2. API'nin çalıştığı adresi not edin (genellikle `http://localhost:5000` veya IP adresiniz `http://192.168.1.X:5000`)

3. Mobil uygulamanızda bu API adresini kullanın

4. İlk olarak kimlik doğrulama işlemini gerçekleştirin, sonra diğer API çağrılarını yapın

## Dikkat Edilmesi Gerekenler

1. Geliştirme aşamasında, mobil cihazınız ve backend sunucunuz aynı ağda olmalıdır
2. Üretim ortamında, backend'iniz internette erişilebilir olmalıdır
3. HTTPS kullanarak güvenli iletişim sağlayın
4. Mobil ağ veya internet bağlantısı kesilirse uygulamanızın nasıl davranacağını planlayın (offline modu)
5. Backend sunucunuzun IP adresi veya alan adı değişirse, mobil uygulamayı güncelleyin

## Örnek Kimlik Doğrulama Akışı

1. Kullanıcı giriş yapar (`/api/auth/login` endpoint'i)
2. Backend bir JWT token döndürür
3. Token mobil uygulamada saklanır (AsyncStorage, SharedPreferences vb.)
4. Sonraki API çağrıları için token "Authorization: Bearer [token]" başlığına eklenir

## Sorun Giderme

1. "Network request failed" hatası: IP adreslerini kontrol edin, aynı ağda olduğunuzdan emin olun
2. "Unauthorized" hatası: Token'ın geçerli olduğundan ve doğru şekilde gönderildiğinden emin olun
3. Socket.IO bağlantı sorunları: Sunucu adresini ve port numarasını kontrol edin

## Bağlantı Sorunları İçin Detaylı Kontrol Listesi

Mobil uygulamanız ve backend arasında bağlantı kurulamıyorsa, şu adımları izleyin:

### 1. Backend Sunucunun Çalıştığını Doğrulama

```bash
# Backend klasöründe olduğunuzdan emin olun
cd backend

# Backend sunucusunu çalıştırın ve konsol çıktısını kontrol edin
npm run dev
```

Sunucunun başarıyla başladığını ve konsolda "Server running on port 5000" gibi bir mesaj görmelisiniz.

### 2. IP Adresi Kontrolü

```bash
# Windows için
ipconfig

# macOS/Linux için
ifconfig
```

Yerel IP adresinizi bulun (genellikle 192.168.x.x formatında) ve bu IP'yi mobil uygulamanızda kullandığınızdan emin olun.

### 3. Firewall ve Port Kontrolü

- Windows Güvenlik Duvarı'nın veya diğer güvenlik yazılımlarının 5000 portunu (veya hangi portu kullanıyorsanız) engellemediğinden emin olun
- Ağ yöneticinizin veya router'ınızın portları engellediğinden şüpheleniyorsanız, port yönlendirmeyi kontrol edin

### 4. CORS Ayarları

Backend sunucunuzdaki CORS ayarlarının mobil uygulamanızın isteklerine izin verecek şekilde yapılandırıldığından emin olun:

```javascript
// backend/src/index.js dosyasında
// Not: Bu projede ana dosya app.js değil index.js'dir

app.use(cors({
  origin: '*', // Geliştirme aşamasında tüm kaynaklara izin verin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));
```

### 5. Mobil Uygulama İzinleri

#### Android için:
AndroidManifest.xml dosyasına internet izni eklediğinizden emin olun:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

#### iOS için:
Info.plist dosyasında gerekli ağ izinleri ve güvenlik ayarları olduğundan emin olun:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### 6. Temel API Bağlantı Testi

Mobil uygulama kodunuza basit bir bağlantı testi ekleyin:

#### React Native için:
```javascript
const testConnection = async () => {
  try {
    console.log('Bağlantı testi başlıyor...');
    const response = await fetch('http://192.168.1.X:5000/api/auth/test');
    console.log('Bağlantı yanıtı:', response.status);
    const data = await response.json();
    console.log('Yanıt verisi:', data);
    return true;
  } catch (error) {
    console.error('Bağlantı hatası:', error);
    return false;
  }
};

// Uygulamanız başlatıldığında çağırın
testConnection().then(success => {
  console.log('Bağlantı başarılı mı?', success);
});
```

#### Flutter için:
```dart
Future<bool> testConnection() async {
  try {
    print('Bağlantı testi başlıyor...');
    final response = await http.get(Uri.parse('http://192.168.1.X:5000/api/auth/test'));
    print('Bağlantı yanıtı: ${response.statusCode}');
    print('Yanıt verisi: ${response.body}');
    return true;
  } catch (error) {
    print('Bağlantı hatası: $error');
    return false;
  }
}

// Uygulamanız başlatıldığında çağırın
void main() {
  testConnection().then((success) {
    print('Bağlantı başarılı mı? $success');
  });
  runApp(MyApp());
}
```

### 7. API Test Endpoint'i Ekleme

Backend'de basit bir test endpoint'i oluşturun:

```javascript
// backend/src/routes/auth.routes.js dosyasına ekleyin

router.get('/test', (req, res) => {
  res.status(200).json({ message: 'API bağlantı testi başarılı!' });
});
```

### 8. Ağ İzleme Araçları Kullanma

- Bilgisayarınızda Postman veya Insomnia gibi API test araçlarıyla önce backend'e erişim sağlayabildiğinizi doğrulayın
- Chrome DevTools veya React Native Debugger'da Network sekmesini kullanarak istekleri izleyin
- Wireshark gibi ağ analiz araçlarıyla paketleri izleyin

### 9. Emülatör/Simülatör Kullanıyorsanız

- Android Emülatörü: 192.168.1.X yerine 10.0.2.2 IP adresini kullanın (localhost yerine)
- iOS Simulator: 192.168.1.X yerine localhost veya 127.0.0.1 kullanabilirsiniz

### 10. Mobil Cihazı ve Bilgisayarı Yeniden Başlatın

Basit gibi görünse de, bazen mobil cihazı ve geliştirme bilgisayarını yeniden başlatmak ağ bağlantı sorunlarını çözebilir.

### Örnek Test Vakası

1. Backend sunucusunu başlatın ve çalıştığını doğrulayın
2. Tarayıcınızda http://localhost:5000/api/auth/test adresine giderek sunucunun yanıt verdiğini kontrol edin
3. Mobil uygulamanıza yukarıdaki test fonksiyonunu ekleyin ve bağlantı yapılabildiğini kontrol edin
4. Test başarısızsa, hata mesajını inceleyerek spesifik sorunu belirleyin

Bu adımları takip ederek mobil uygulamanız ve backend arasındaki bağlantı sorununu çözebilirsiniz. 

## Axios ile Backend Bağlantısı (Adım Adım)

Axios kütüphanesini zaten yüklediğinizi belirttiniz. Şimdi mobil uygulamanızı backend'e bağlamak için adım adım yapılması gerekenleri açıklayalım:

### 1. Axios Servis Oluşturma

Mobil uygulamanızda API isteklerini yönetecek bir API servis dosyası oluşturun:

#### React Native için:
```javascript
// services/api.service.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL'i yapılandırın - IP adresinizi doğru şekilde değiştirin
const API_BASE_URL = 'http://192.168.1.X:5000/api';

// Axios instance oluşturun
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 saniye
});

// İstek göndermeden önce bu fonksiyon çalışır (interceptor)
apiClient.interceptors.request.use(
  async (config) => {
    // AsyncStorage'den token'ı alın
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      // Token varsa header'a ekleyin
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt geldikten sonra bu fonksiyon çalışır (interceptor)
apiClient.interceptors.response.use(
  (response) => {
    // Başarılı yanıt gelirse
    return response;
  },
  async (error) => {
    // Token süresi dolmuşsa veya geçersizse (401)
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Refresh token ile yeni token alma işlemi
        // const refreshToken = await AsyncStorage.getItem('refreshToken');
        // const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        // await AsyncStorage.setItem('authToken', response.data.token);
        // return apiClient(originalRequest);
        
        // Alternatif olarak: Kullanıcıyı login ekranına yönlendir
        // navigation.navigate('Login');
      } catch (refreshError) {
        // Yenileme başarısız - kullanıcıyı çıkış yaptırın
        await AsyncStorage.removeItem('authToken');
        // navigation.navigate('Login');
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. API Servisini Modüllere Ayırma

Farklı endpoint'ler için ayrı modüller oluşturarak kodunuzu düzenli tutabilirsiniz:

```javascript
// services/auth.service.js

import apiClient from './api.service';

const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: async () => {
    // Token'ı AsyncStorage'den kaldırma
    // await AsyncStorage.removeItem('authToken');
  }
};

export default authService;
```

```javascript
// services/courses.service.js

import apiClient from './api.service';

const coursesService = {
  getAllCourses: async (params = {}) => {
    try {
      const response = await apiClient.get('/courses', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getCourseById: async (id) => {
    try {
      const response = await apiClient.get(`/courses/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createCourse: async (courseData) => {
    try {
      const response = await apiClient.post('/courses', courseData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateCourse: async (id, courseData) => {
    try {
      const response = await apiClient.put(`/courses/${id}`, courseData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteCourse: async (id) => {
    try {
      const response = await apiClient.delete(`/courses/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  enrollStudents: async (courseId, studentIds) => {
    try {
      const response = await apiClient.put(`/courses/${courseId}/enroll`, { studentIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  unenrollStudents: async (courseId, studentIds) => {
    try {
      const response = await apiClient.put(`/courses/${courseId}/unenroll`, { studentIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default coursesService;
```

### 3. Servisin Kullanımı

#### React Native ile Sınıf Bileşeninde:
```javascript
import React, { Component } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import authService from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LoginScreen extends Component {
  state = {
    email: 'test@example.com',
    password: 'password123',
    loading: false,
    error: null
  };

  handleLogin = async () => {
    const { email, password } = this.state;
    
    this.setState({ loading: true, error: null });
    
    try {
      const response = await authService.login(email, password);
      
      // Token'ı sakla
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('userId', response.user._id);
      
      // Ana ekrana yönlendir
      this.props.navigation.navigate('Home');
    } catch (error) {
      this.setState({ 
        error: error.response?.data?.message || 'Giriş başarısız oldu.'
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, error } = this.state;
    
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
        
        <Button 
          title="Giriş Yap" 
          onPress={this.handleLogin} 
          disabled={loading} 
        />
        
        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
      </View>
    );
  }
}

export default LoginScreen;
```

#### React Native ile Fonksiyon Bileşeninde (Hooks):
```javascript
import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import authService from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  
  // Normalde bu değerler input alanlarından alınır
  const email = 'test@example.com';
  const password = 'password123';

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password);
      
      // Token'ı sakla
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('userId', response.user._id);
      
      // Ana ekrana yönlendir
      navigation.navigate('Home');
    } catch (error) {
      setError(error.response?.data?.message || 'Giriş başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
      
      <Button 
        title="Giriş Yap" 
        onPress={handleLogin} 
        disabled={loading} 
      />
      
      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
};

export default LoginScreen;
```

### 4. Kurs Verilerini Çekme Örneği

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import coursesService from '../services/courses.service';

const CoursesScreen = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Komponent yüklendiğinde kursları çek
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Aktif kursları getir
      const response = await coursesService.getAllCourses({ isActive: true });
      setCourses(response.data);
    } catch (error) {
      console.error('Kurslar alınırken hata oluştu:', error);
      setError('Kurslar yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Yükleniyor durumu
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <Button title="Tekrar Dene" onPress={fetchCourses} />
      </View>
    );
  }

  // Veri gösterimi
  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
        Kurslar
      </Text>
      
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            Hiç kurs bulunamadı.
          </Text>
        }
      />
    </View>
  );
};

export default CoursesScreen;
```

### 5. Hata Ayıklama ve Test Etme

Axios ile yapılan istekleri test etmek için konsola istek ve yanıt detaylarını yazdırabilirsiniz:

```javascript
// Hata ayıklama için request interceptor'a ekleyin
apiClient.interceptors.request.use(
  async (config) => {
    console.log('API İSTEĞİ:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      params: config.params
    });
    
    // Token işlemleri...
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Hata ayıklama için response interceptor'a ekleyin
apiClient.interceptors.response.use(
  (response) => {
    console.log('API YANITI:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('API HATASI:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);
```

### 6. Bağlantı Hatalarını Doğru Yakalama

```javascript
// Network hatalarını yakalama
const handleApiCall = async (apiFunc, ...args) => {
  try {
    return await apiFunc(...args);
  } catch (error) {
    if (error.message === 'Network Error') {
      // İnternet bağlantısı yok
      Alert.alert(
        'Bağlantı Hatası',
        'İnternet bağlantınızı kontrol edip tekrar deneyin.'
      );
    } else if (error.code === 'ECONNABORTED') {
      // İstek zaman aşımına uğradı
      Alert.alert(
        'Bağlantı Zaman Aşımı',
        'Sunucuya ulaşılamadı, lütfen daha sonra tekrar deneyin.'
      );
    } else {
      // Diğer hatalar
      Alert.alert(
        'Hata',
        error.response?.data?.message || 'Bir sorun oluştu.'
      );
    }
    throw error;
  }
};

// Kullanımı
const login = async (email, password) => {
  return handleApiCall(authService.login, email, password);
};
```

Bu adımları takip ederek Axios kütüphanesini kullanarak mobil uygulamanızı backend ile başarıyla bağlayabilirsiniz. Herhangi bir sorunla karşılaşırsanız, yukarıda verilen hata ayıklama yöntemlerini kullanarak sorunu belirlemeniz ve çözmeniz mümkün olacaktır.

Bu adımları takip ederek mobil uygulamanız ve backend arasındaki bağlantı sorununu çözebilirsiniz.

## Backend index.js Dosyasında Yapılması Gereken Düzeltmeler

Backend'in mobil uygulamanızla düzgün şekilde iletişim kurabilmesi için `backend/src/index.js` dosyasında aşağıdaki düzenlemeleri yapmanız gerekiyor:

### 1. CORS Ayarlarını Düzenleme

Express uygulamanızda CORS ayarlarını değiştirerek mobil uygulamanızın IP adresinden gelen isteklere izin vermeniz gerekiyor. `index.js` dosyasında CORS ayarlarını şu şekilde değiştirin:

```javascript
// backend/src/index.js dosyasında

// Mevcut CORS kullanımı:
app.use(cors());

// Aşağıdaki kod ile değiştirin:
app.use(cors({
  origin: '*', // Tüm kaynaklara izin verir (geliştirme için)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
```

### 2. Socket.IO CORS Ayarlarını Düzenleme

Socket.IO kullanıyorsanız, onun için de CORS ayarlarını düzenlemeniz gerekiyor:

```javascript
// backend/src/index.js dosyasında

// Mevcut Socket.IO yapılandırması:
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Aşağıdaki kod ile değiştirin:
const io = socketIo(server, {
  cors: {
    origin: '*', // Tüm kaynaklara izin verir (geliştirme için)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});
```

### 3. IP Adresini Dinleme Ayarı

Son olarak, sunucunuzun harici IP adresinden gelen bağlantıları dinleyebilmesi için listen komutundaki host parametresini değiştirin:

```javascript
// backend/src/index.js dosyasında

// Mevcut server.listen çağrısı:
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger API docs available at http://localhost:${PORT}/api-docs`);
});

// Aşağıdaki kod ile değiştirin:
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server is accessible at http://192.168.1.14:${PORT}`);
  console.log(`Swagger API docs available at http://192.168.1.14:${PORT}/api-docs`);
});
```

`'0.0.0.0'` ile sunucunuzu tüm ağ arayüzlerinde dinlemeye alıyorsunuz, böylece lokal ağınızdaki diğer cihazlar (mobil uygulamanız dahil) sunucunuza erişebilir.

### 4. Test Endpoint'i Ekleme

Bağlantıyı test etmek için basit bir endpoint ekleyin. Bu kodu `backend/src/routes/auth.routes.js` dosyasında uygun bir yere ekleyin:

```javascript
// backend/src/routes/auth.routes.js dosyasında

// Router tanımınızın altında (genellikle dosyanın başında)
// const router = express.Router();

// Test endpoint'i
router.get('/test', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API bağlantı testi başarılı!',
    timestamp: new Date()
  });
});
```

### 5. IP Adresini Kontrol Etme

Sunucunuzun çalıştığı IP adresini doğrulamak için index.js dosyasına aşağıdaki kodu ekleyebilirsiniz:

```javascript
// backend/src/index.js dosyasında
// Mevcut importların altına ekleyin
const os = require('os');

// Server başlatılmadan önce veya sonra
const networkInterfaces = os.networkInterfaces();
console.log('Network Interfaces:');
Object.keys(networkInterfaces).forEach(interfaceName => {
  networkInterfaces[interfaceName].forEach(interface => {
    if (interface.family === 'IPv4' && !interface.internal) {
      console.log(`Interface: ${interfaceName}, IP: ${interface.address}`);
    }
  });
});
```

Bu kod, sunucunun başlangıcında kullanılabilir tüm IP adreslerini listeleyecektir.

### Tüm Düzeltmeleri Uyguladıktan Sonra

Bu değişiklikleri yaptıktan sonra backend sunucunuzu yeniden başlatın:

```bash
cd backend
npm run dev
```

Sonra, mobil uygulamanızda `http://192.168.1.14:5000/api/auth/test` endpoint'ini çağırarak bağlantıyı test edin. Başarılı bir yanıt alırsanız, mobil uygulamanız ve backend başarıyla bağlanmış demektir.