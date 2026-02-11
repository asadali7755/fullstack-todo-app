// Direct API calls to match backend endpoints
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface UserResponse {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

// Map snake_case API response to camelCase frontend type
const mapUser = (apiUser: UserResponse) => ({
  id: apiUser.id,
  email: apiUser.email,
  createdAt: apiUser.created_at,
  updatedAt: apiUser.updated_at,
});

export const auth = {
  signIn: {
    email: async ({ email, password }: { email: string; password: string; callbackURL?: string }) => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Login failed: ${response.status}`);
        }

        const data: AuthResponse = await response.json();

        // Store tokens in localStorage/sessionStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Get user info
        const userResponse = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (userResponse.ok) {
          const apiUser: UserResponse = await userResponse.json();
          return { session: { user: mapUser(apiUser), accessToken: data.access_token } };
        }

        return { session: null };
      } catch (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    },
  },

  signUp: {
    email: async ({ email, password, name }: { email: string; password: string; name?: string }) => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Registration failed: ${response.status}`);
        }

        const apiUser: UserResponse = await response.json();

        return { user: mapUser(apiUser) };
      } catch (error) {
        console.error('Sign up error:', error);
        throw error;
      }
    },
  },

  getSession: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return null;
      }

      const apiUser: UserResponse = await response.json();
      return { user: mapUser(apiUser), accessToken: token };
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  signOut: async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};