import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { Notice } from "../components/UI"

function AdminSetup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/admin/setup", form)
      navigate("/admin/login")
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to create the administrator."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page-centered">
      <div className="auth-card">
        <div className="auth-card-top">
          <h2>Admin Setup</h2>
          <p className="muted">Create the administrator account for SkillGraph.</p>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label>
            Full name
            <input
              value={form.name}
              onChange={update("name")}
              placeholder="e.g. System Admin"
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="admin@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength="6"
              value={form.password}
              onChange={update("password")}
              placeholder="At least 6 characters"
              required
            />
          </label>

          <Notice>{error}</Notice>

          <button className="button button--primary button--full" disabled={loading}>
            {loading ? "Creating account…" : "Create administrator"}
          </button>
        </form>

        <div className="auth-footer">
          <Link className="subtle-link" to="/admin/login">
            ← Return to admin sign in
          </Link>
        </div>
      </div>
    </main>
  )
}

export default AdminSetup
