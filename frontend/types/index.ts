// User type definition
export interface User {
  id: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

// Todo type definition
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isEditing?: boolean;
  isLoading?: boolean;
}

// API Response structure
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  success: boolean;
}

// Login request payload
export interface LoginRequest {
  email: string;
  password: string;
}

// Registration request payload
export interface RegisterRequest extends LoginRequest {
  confirmPassword: string;
}

// Login response
export interface LoginResponse {
  user: User;
  token: string;
}

// Registration response
export interface RegisterResponse {
  user: User;
}