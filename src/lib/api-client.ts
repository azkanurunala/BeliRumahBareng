import { ApiError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, InternalServerError } from './errors';
import type { ApiResponse, RequestConfig, RequestMethod } from './api-types';

/**
 * API Client dengan error handling, retry logic, dan type safety
 */

interface ApiClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    };
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
  }

  /**
   * Build URL dengan query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ApiError('Request timeout', 408, 'TIMEOUT'));
      }, timeout);
    });
  }

  /**
   * Handle response errors
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: { message: string; code?: string; errors?: Record<string, string[]> };
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || 'An error occurred' };
    }

    const message = errorData.message || 'An error occurred';
    const code = errorData.code;

    switch (response.status) {
      case 400:
        throw new ValidationError(message, errorData.errors);
      case 401:
        throw new UnauthorizedError(message);
      case 403:
        throw new ForbiddenError(message);
      case 404:
        throw new NotFoundError(message);
      case 409:
        throw new ConflictError(message);
      case 500:
      case 502:
      case 503:
        throw new InternalServerError(message);
      default:
        throw new ApiError(message, response.status, code);
    }
  }

  /**
   * Retry logic untuk failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retriesLeft: number = this.retries
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      // Don't retry on client errors (4xx) except 408 (timeout)
      if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 408) {
        throw error;
      }

      if (retriesLeft > 0) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retryRequest(requestFn, retriesLeft - 1);
      }

      throw error;
    }
  }

  /**
   * Main request method
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      signal,
      timeout = this.timeout,
    } = config;

    const url = this.buildUrl(endpoint, params);
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    const requestFn = async (): Promise<ApiResponse<T>> => {
      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: signal,
      };

      if (body && method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(body);
      }

      const fetchPromise = fetch(url, fetchOptions);
      const timeoutPromise = this.createTimeoutPromise(timeout);

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      return data as ApiResponse<T>;
    };

    return this.retryRequest(requestFn);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

// Export class untuk custom instances
export { ApiClient };

