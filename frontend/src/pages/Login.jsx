import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { Notice } from "../components/UI"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await api.post("/login", { email, password })
      localStorage.setItem("token", response.data.access_token)
      localStorage.setItem("userRole", "student")
      navigate("/student/dashboard")
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We could not sign you in."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page-centered">
      <div className="auth-card">
        <div className="auth-card-top">
          <h2>Sign in to SkillGraph</h2>
          <p className="muted">Enter your email and password to access your dashboard.</p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          <Notice>{error}</Notice>

          <button className="button button--primary button--full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-switch">
            New to SkillGraph? <Link to="/register">Create an account</Link>
          </p>
          <div className="auth-divider" />
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <Link className="subtle-link" to="/hr/login">
              Company HR portal →
            </Link>
            <Link className="subtle-link" to="/admin/login">
              Admin sign in →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login
