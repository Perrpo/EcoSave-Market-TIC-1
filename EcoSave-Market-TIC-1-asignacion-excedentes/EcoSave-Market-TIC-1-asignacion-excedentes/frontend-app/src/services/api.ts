const API_BASE_URL = 'http://localhost:3333/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Productos
  async getProducts(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    return this.request(`/products?${queryParams}`);
  }

  async createProduct(productData: {
    nombre: string;
    categoria: string;
    unidades: number;
    vencimiento: string;
    estado?: string;
  }) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: {
    nombre?: string;
    categoria?: string;
    unidades?: number;
    vencimiento?: string;
    estado?: string;
  }) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getAvailableProducts() {
    return this.request('/products/available');
  }

  // Donaciones
  async getDonations(params?: {
    ong_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.ong_id) queryParams.append('ong_id', params.ong_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    return this.request(`/donations?${queryParams}`);
  }

  async createDonation(donationData: {
    product_id: string;
    quantity: number;
    status?: string;
  }) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
  }

  async requestDonation(id: string) {
    return this.request(`/donations/${id}/request`, {
      method: 'POST',
    });
  }

  async confirmDonation(id: string) {
    return this.request(`/donations/${id}/confirm`, {
      method: 'POST',
    });
  }

  async getAvailableDonations() {
    return this.request('/donations/available');
  }

  async getDonationStats(params?: {
    user_id?: string;
    ong_id?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.ong_id) queryParams.append('ong_id', params.ong_id);

    return this.request(`/donations/stats?${queryParams}`);
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    business_name: string;
    phone: string;
    nit: string;
    role: 'supermarket' | 'ong';
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
