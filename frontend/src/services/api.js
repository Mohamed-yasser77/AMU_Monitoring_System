const BASE_URL = 'http://127.0.0.1:8000/api';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
};

const api = {
    async fetch(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            // Handle expired sessions
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    get(endpoint) {
        return this.fetch(endpoint, { method: 'GET' });
    },

    post(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(endpoint) {
        return this.fetch(endpoint, { method: 'DELETE' });
    }
};

export default api;
