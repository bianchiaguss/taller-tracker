import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // El 401 al intentar login/registro es "credenciales incorrectas":
    // lo maneja la propia pantalla. Solo redirigimos si vence una sesión activa.
    const url = err.config?.url || ''
    const esIntentoAuth = url.includes('/auth/login') || url.includes('/auth/registro')
    if (err.response?.status === 401 && !esIntentoAuth) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
