# Guía de Migración al Backend - Sistema de Bonos Corporativos

## 📋 Resumen

He creado una integración completa de tu aplicación frontend con el backend que desarrolló tu equipo. Esta migración mantiene toda la funcionalidad existente pero ahora usa el backend en lugar del localStorage.

## 🆕 Nuevos Archivos Creados

### 1. Servicios API
- **`src/services/api.ts`** - Servicio principal para comunicarse con el backend
  - Maneja autenticación con tokens JWT
  - Incluye todos los endpoints de bonos y autenticación
  - Gestión de errores y headers automáticos

### 2. Hooks Personalizados
- **`src/hooks/useAuth.ts`** - Hook para manejo de autenticación
- **`src/hooks/useBonds.ts`** - Hook para operaciones CRUD de bonos

### 3. Contexto Actualizado
- **`src/context/AppContextNew.tsx`** - Nuevo contexto que usa el backend
- **`src/hooks/useBondSimulation.ts`** - Hook integrado para simulación de bonos

### 4. Componentes Actualizados
- **`src/components/LoginNew.tsx`** - Login con integración al backend
- **`src/components/RegisterNew.tsx`** - Registro con integración al backend
- **`src/components/ApiConfig.tsx`** - Configuración de URL del backend
- **`src/components/BondSimulation.tsx`** - Componente de ejemplo para simulación

### 5. App Principal
- **`src/AppNew.tsx`** - App principal usando el nuevo sistema

## 🔧 Configuración Inicial

### 1. Configurar URL del Backend
Al ejecutar la aplicación por primera vez, verás una pantalla de configuración donde debes:
- Ingresar la URL de tu backend (ej: `http://localhost:8080`)
- Probar la conexión
- Guardar la configuración

### 2. Variables de Entorno (Opcional)
Puedes crear un archivo `.env` en la raíz del proyecto:
```env
VITE_API_BASE_URL=http://localhost:8080
```

## 🚀 Cómo Usar la Nueva Integración

### 1. Reemplazar el App.tsx Principal
```typescript
// En src/main.tsx, cambiar:
import App from './App'
// Por:
import AppNew from './AppNew'

// Y renderizar:
<AppNew />
```

### 2. Usar el Nuevo Contexto
```typescript
// En lugar de:
import { useAuth, useApp } from './context/AppContext';

// Usar:
import { useAuth, useApp } from './context/AppContextNew';
```

### 3. Operaciones con Bonos
```typescript
const { bonds, addBond, updateBond, deleteBond, loading, error } = useApp();

// Crear bono
const success = await addBond(bondData);

// Actualizar bono
const success = await updateBond(bondId, updates);

// Eliminar bono
const success = await deleteBond(bondId);
```

### 4. Simulación de Bonos
```typescript
import { useBondSimulation } from '../context/AppContextNew';

const { simulateBond, loading, error } = useBondSimulation();
const result = await simulateBond(bondData, tasaOportunidad);
```

## 🔐 Autenticación

### Flujo de Autenticación
1. **Login**: Usuario ingresa credenciales → Backend devuelve JWT token
2. **Token Storage**: Token se guarda en localStorage
3. **Requests**: Todas las peticiones incluyen el token en headers
4. **Auto-logout**: Si el token expira, se hace logout automático

### Uso del Hook de Autenticación
```typescript
const { user, login, register, logout, loading, error, isAuthenticated } = useAuth();

// Login
const success = await login(username, password);

// Registro
const success = await register(username, password, 'inversor');

// Logout
logout();
```

## 📡 Endpoints Implementados

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Bonos
- `GET /api/bonds` - Obtener todos los bonos
- `GET /api/bonds/{id}` - Obtener bono específico
- `POST /api/bonds` - Crear bono
- `PUT /api/bonds/{id}` - Actualizar bono
- `DELETE /api/bonds/{id}` - Eliminar bono
- `POST /api/bonds/simulate?tasaOportunidad={number}` - Simular bono

## 🔄 Diferencias con el Sistema Anterior

### ✅ Ventajas del Nuevo Sistema
1. **Persistencia Real**: Los datos se guardan en el servidor
2. **Multi-usuario**: Cada usuario ve solo sus datos
3. **Seguridad**: Autenticación con JWT tokens
4. **Simulación Avanzada**: Cálculos en el backend
5. **Escalabilidad**: Preparado para múltiples usuarios

### 📝 Cambios Importantes
1. **Operaciones Asíncronas**: Todas las operaciones CRUD ahora son async/await
2. **Manejo de Errores**: Errores de red y servidor se manejan automáticamente
3. **Estados de Carga**: Loading states para mejor UX
4. **Configuración**: URL del backend configurable

## 🛠️ Migración de Componentes Existentes

### Para migrar un componente existente:

1. **Cambiar imports**:
```typescript
// Antes:
import { useApp } from '../context/AppContext';

// Después:
import { useApp } from '../context/AppContextNew';
```

2. **Hacer operaciones asíncronas**:
```typescript
// Antes:
addBond(bondData);

// Después:
const success = await addBond(bondData);
if (success) {
  // Manejar éxito
} else {
  // Manejar error
}
```

3. **Usar estados de loading**:
```typescript
const { bonds, loading, error } = useApp();

if (loading) return <div>Cargando...</div>;
if (error) return <div>Error: {error}</div>;
```

## 🔧 Configuración del Backend

### CORS
Asegúrate de que tu backend tenga CORS configurado para permitir requests desde tu frontend:

```java
// Ejemplo para Spring Boot
@CrossOrigin(origins = "http://localhost:5173") // URL de tu frontend
```

### Headers de Autenticación
El sistema envía el token en el header:
```
Authorization: Bearer <jwt-token>
```

## 📱 Ejemplo de Uso Completo

```typescript
import React, { useEffect } from 'react';
import { useAuth, useApp } from '../context/AppContextNew';

const MiComponente: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { bonds, loading, error, fetchBonds } = useApp();

  useEffect(() => {
    if (isAuthenticated) {
      fetchBonds();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div>No autenticado</div>;
  }

  if (loading) {
    return <div>Cargando bonos...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Bienvenido {user?.name}</h1>
      <div>Total de bonos: {bonds.length}</div>
      {bonds.map(bond => (
        <div key={bond.id}>{bond.name}</div>
      ))}
    </div>
  );
};
```

## 🚨 Consideraciones Importantes

1. **URL del Backend**: Asegúrate de que el backend esté ejecutándose en la URL configurada
2. **CORS**: El backend debe permitir requests desde el frontend
3. **Tokens**: Los tokens JWT deben tener la estructura esperada
4. **Fallback**: Mantén el sistema anterior como respaldo durante la transición

## 📦 Próximos Pasos

1. **Probar la integración** con tu backend
2. **Migrar componentes uno por uno** al nuevo sistema
3. **Implementar funciones faltantes** como reset de contraseña
4. **Optimizar el manejo de errores** según necesidades específicas
5. **Agregar indicadores de loading** en toda la aplicación

## 🆘 Solución de Problemas

### Error de CORS
```
Access to fetch at 'http://localhost:8080/api/auth/login' from origin 'http://localhost:5173' has been blocked by CORS
```
**Solución**: Configurar CORS en el backend

### Token inválido
```
HTTP 401: Unauthorized
```
**Solución**: Verificar que el token JWT sea válido y no haya expirado

### Backend no responde
```
Failed to fetch
```
**Solución**: Verificar que el backend esté ejecutándose y la URL sea correcta

## 🐛 Debugging y Logs

He agregado logs detallados para ayudarte a identificar problemas. Abre las **DevTools del navegador** (F12) y ve a la **consola** para ver:

### 🔍 Logs de Autenticación
- **🔐 Proceso de login**: Username, validaciones, llamadas API
- **🎟️ Token JWT**: Decodificación y extracción de datos de usuario
- **💾 LocalStorage**: Guardado de tokens y datos de usuario

### 🌐 Logs de API
- **📡 Requests**: URL completa, headers, body enviado
- **📨 Responses**: Status, headers, datos recibidos
- **❌ Errores**: Detalles completos de fallos de red

### 🔧 Logs de Configuración
- **🧪 Test de conexión**: Pruebas de conectividad con el backend
- **💾 Guardado**: Configuración de URL del backend

### 📋 Ejemplo de logs esperados en login exitoso:
```
🔐 Hook useAuth: Iniciando login...
👤 Usuario: testuser
📤 Enviando datos de login al API service...
🌐 API Request: POST /api/auth/login
📍 URL completa: http://localhost:8080/api/auth/login
🔑 Headers enviados: {"Content-Type": "application/json"}
📦 Body enviado: {"username":"testuser","password":"password123"}
⏳ Enviando petición...
📨 Respuesta recibida:
  Status: 200
  Status Text: OK
✅ Respuesta parseada: {"token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
🎟️ Token recibido, decodificando...
👤 Información de usuario decodificada: {"id":"1","username":"testuser","role":"inversor"}
✅ Usuario autenticado exitosamente
💾 Información de usuario guardada en localStorage
🏁 Proceso de login terminado
```

### 🚨 Logs de errores comunes:

#### Error de CORS:
```
💥 Error en petición: TypeError: Failed to fetch
```

#### Backend no disponible:
```
💥 Error en petición: TypeError: NetworkError when attempting to fetch resource
```

#### Credenciales incorrectas:
```
❌ Error en respuesta: {"error": "Invalid credentials"}
📨 Respuesta recibida: Status: 401
```

#### Token JWT malformado:
```
❌ Token JWT malformado - debe tener 3 partes
📋 Partes del token: 2
```

¡La integración está lista para usar! 🎉
