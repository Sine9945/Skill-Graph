import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { Notice } from "../components/UI"

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", year: "", cgpa: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/students", { ...form, year: Number(form.year), cgpa: Number(form.cgpa) })
      navigate("/login")
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We could not create your account."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page-centered">
      <div className="auth-card auth-card--wide">
        <div className="auth-card-top">
          <h2>Create your account</h2>
          <p className="muted">Set up your student career profile in under a minute.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="span-2">
            Full name
            <input
              value={form.name}
              onChange={update("name")}
              placeholder="e.g. Alex Johnson"
              required
            />
          </label>

          <label className="span-2">
            Email address
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="span-2">
            Password
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="At least 6 characters"
              minLength="6"
              required
            />
          </label>

          <label>
            Department
            <input
              value={form.department}
              onChange={update("department")}
              placeholder="e.g. CSE"
              required
            />
          </label>

          <label>
            Current year
            <input
              type="number"
              min="1"
              max="8"
              value={form.year}
              onChange={update("year")}
              placeholder="e.g. 3"
              required
            />
          </label>

          <label className="span-2">
            Academic CGPA
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={form.cgpa}
              onChange={update("cgpa")}
              placeholder="e.g. 8.5"
              required
            />
          </label>

          <div className="span-2">
            <Notice>{error}</Notice>
            <button className="button button--primary button--full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default Register
