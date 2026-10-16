import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { Notice } from "../components/UI"

function HRLogin() {
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
      const response = await api.post("/hr/login", { email, password })
      localStorage.setItem("token", response.data.access_token)
      localStorage.setItem("userRole", "hr")
      navigate("/hr/dashboard")
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
          <h2>Company HR Sign In</h2>
          <p className="muted">
            Access your company applicant pipeline and manage candidate decisions.
          </p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Work email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="hr@company.com"
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
            {loading ? "Signing in…" : "Sign in as Company HR"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-switch">
            New HR representative? <Link to="/hr/register">Register HR account</Link>
          </p>
          <div className="auth-divider" />
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <Link className="subtle-link" to="/login">
              ← Student sign in
            </Link>
            <Link className="subtle-link" to="/admin/login">
              Admin portal →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default HRLogin
