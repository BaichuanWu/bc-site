import axios from 'axios'

export const apiClient = axios.create({
    baseURL: '/api/v1',
    timeout: 120000,
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        // If your backend wraps responses in { code, data, message }, handle it here
        return response.data
    },
    (error) => {
        console.error('API Error:', error)
        return Promise.reject(error)
    }
)

export const fetcher = <T>(url: string) => apiClient.get(url).then(res => res as T)
