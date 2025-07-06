// Configuración base de la API
// En desarrollo, usar proxy de Vite; en producción, usar URL completa
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? '' : 'http://localhost:8080'; // Proxy en dev, URL completa en prod

// Tipos para la respuesta de autenticación
export interface LoginResponse {
  token: string;
  role: string;
  id?: string | number; // ID real del usuario (puede ser string o número)
  username?: string;
  name?: string;
  email?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Tipos para bonos según tu backend
export interface BondRequest {
  name: string;
  nominalValue: number;
  couponRate: number;
  maturityPeriods: number;
  frequency: number;
  marketRate: number;
  gracePeriods: number;
  graceType: string;
  currency: string;
  interestType: string;
  capitalization: number;
}

export interface BondSimulationResponse {
  precioMaximo: number;
  duracion: number;
  tcea: number;
  trea: number;
  convexidad: number;
  duracionModificada?: number;
  bondInfo?: any;
}

// Clase para manejar las llamadas a la API
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log('🔧 ApiService inicializado con URL base:', this.baseUrl);
  }

  // Obtener el token del localStorage
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Configurar headers con autenticación
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Header Authorization configurado:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.warn('⚠️ No hay token disponible para autenticación');
      }
    }

    console.log('📋 Headers finales:', headers);
    return headers;
  }

  // Método genérico para hacer requests
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
    };

    // 🔍 LOG: Request details
    console.group(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
    console.log('📍 URL completa:', url);
    console.log('🔑 Headers enviados:', config.headers);
    if (config.body) {
      console.log('📦 Body enviado:', config.body);
    }
    console.log('⚙️ Configuración completa:', config);

    try {
      console.log('⏳ Enviando petición...');
      const response = await fetch(url, config);
      
      // 🔍 LOG: Response details
      console.log('📨 Respuesta recibida:');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
        console.groupEnd();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Si la respuesta está vacía, retornar un objeto vacío
      const text = await response.text();
      const result = text ? JSON.parse(text) : {} as T;
      
      console.log('✅ Respuesta parseada:', result);
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('💥 Error en petición:', error);
      console.error('🔗 URL que falló:', url);
      console.error('📋 Configuración usada:', config);
      console.groupEnd();
      throw error;
    }
  }

  // ===================== AUTENTICACIÓN =====================
  
  async register(data: RegisterRequest): Promise<void> {
    console.log('📝 Iniciando proceso de registro...');
    console.log('📋 Datos de registro enviados:', { 
      username: data.username, 
      password: '***', 
      role: data.role 
    });
    
    await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
    
    console.log('✅ Registro completado exitosamente');
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 Iniciando proceso de login...');
    console.log('📋 Datos de login:', { username: data.username, password: '***' });
    console.log('🌐 URL base configurada:', this.baseUrl);
    
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
    
    console.log('🎯 Respuesta de login recibida:', response);
    
    // Guardar el token en localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      console.log('💾 Token guardado en localStorage');
      console.log('🔑 Token (primeros 50 chars):', response.token.substring(0, 50) + '...');
    } else {
      console.warn('⚠️ No se recibió token en la respuesta');
    }
    
    return response;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }

  // ===================== BONOS =====================
  
  // Obtener todos los bonos (para inversores)
  async getAllBonds(): Promise<any[]> {
    return this.request<any[]>('/api/bonds/all');
  }

  // Obtener bonos de un usuario específico (para emisores)
  async getUserBonds(userId: string): Promise<any[]> {
    console.log('🏭 ApiService: getUserBonds llamado con userId:', userId);
    console.log('🏭 ApiService: Tipo de userId:', typeof userId);
    console.log('🏭 ApiService: URL final será: /api/bonds/user/' + userId);
    return this.request<any[]>(`/api/bonds/user/username/${userId}`);
  }

  // Método legacy - mantener por compatibilidad
  async getBonds(): Promise<any[]> {
    return this.request<any[]>('/api/bonds');
  }

  async getBond(id: string): Promise<any> {
    return this.request<any>(`/api/bonds/${id}`);
  }

  async createBond(data: BondRequest): Promise<any> {
    console.log('💰 Creando bono con datos:', data);
    console.log('🔐 Verificando autenticación antes de crear bono...');
    
    const token = this.getToken();
    if (!token) {
      throw new Error('No hay token de autenticación. Debes iniciar sesión primero.');
    }
    
    return this.request<any>('/api/bonds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBond(id: string, data: Partial<BondRequest>): Promise<any> {
    return this.request<any>(`/api/bonds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBond(id: string): Promise<void> {
    await this.request<void>(`/api/bonds/${id}`, {
      method: 'DELETE',
    });
  }

  async simulateBond(data: BondRequest, tasaOportunidad: number): Promise<BondSimulationResponse> {
    return this.request<BondSimulationResponse>(`/api/bonds/simulate?tasaOportunidad=${tasaOportunidad}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===================== UTILIDADES =====================
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Método para cambiar la URL base de la API dinámicamente
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    console.log('🔧 URL base de la API actualizada a:', this.baseUrl);
  }

  // Método para obtener la URL base actual
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Instancia singleton del servicio
export const apiService = new ApiService();

// Función para configurar la URL base (útil para desarrollo/producción)
export const configureApi = (baseUrl: string) => {
  apiService.setBaseUrl(baseUrl);
};

export default apiService;
