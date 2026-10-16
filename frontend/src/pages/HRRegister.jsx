import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { Notice } from "../components/UI"

function HRRegister() {
  const [form, setForm] = useState({ name: "", email: "", password: "", company_id: "" })
  const [companies, setCompanies] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get("/companies")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCompanies(res.data)
          if (res.data.length > 0) {
            setForm((prev) => ({ ...prev, company_id: String(res.data[0].company_id) }))
          }
        }
      })
      .catch(() => setError("Unable to load companies list."))
  }, [])

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.company_id) {
      setError("Please select a company.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const response = await api.post("/hr/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        company_id: Number(form.company_id),
      })
      localStorage.setItem("token", response.data.access_token)
      localStorage.setItem("userRole", "hr")
      navigate("/hr/dashboard")
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We could not register your HR account."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page-centered">
      <div className="auth-card auth-card--wide">
        <div className="auth-card-top">
          <h2>Create Company HR Account</h2>
          <p className="muted">
            Register to post jobs and review applicant statuses for your company.
          </p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              value={form.name}
              onChange={update("name")}
              placeholder="e.g. Sarah Connor"
              required
            />
          </label>

          <label>
            Select company
            <select
              value={form.company_id}
              onChange={update("company_id")}
              required
            >
              <option value="">Select your company</option>
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_name} ({c.industry})
                </option>
              ))}
            </select>
          </label>

          <label>
            Work email
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="sarah@company.com"
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
            {loading ? "Registering…" : "Register as Company HR"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-switch">
            Already registered? <Link to="/hr/login">Sign in here</Link>
          </p>
          <div className="auth-divider" />
          <Link className="subtle-link" to="/login">
            ← Return to student sign in
          </Link>
        </div>
      </div>
    </main>
  )
}

export default HRRegister
