import axios from "axios"

const api = axios.create({ baseURL: "http://127.0.0.1:8000" })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const detail = error.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return fallback
}

export default api
