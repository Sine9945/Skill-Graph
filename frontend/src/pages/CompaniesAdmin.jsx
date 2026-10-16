import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { EmptyState, Loading, Notice, PageHeader } from "../components/UI"

const blank = { company_name: "", industry: "", website: "" }

function CompaniesAdmin() {
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const response = await api.get("/companies")
      setCompanies(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load companies."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <Loading />

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const save = async (event) => {
    event.preventDefault()
    setError("")
    setMessage("")
    try {
      if (editing) {
        await api.put(`/companies/${editing}`, form)
        setMessage("Company updated successfully.")
      } else {
        await api.post("/companies", form)
        setMessage("Company added successfully.")
      }
      setForm(blank)
      setEditing(null)
      load()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to save company."))
    }
  }

  const edit = (company) => {
    setEditing(company.company_id)
    setForm({
      company_name: company.company_name || "",
      industry: company.industry || "",
      website: company.website || "",
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const remove = async (company) => {
    if (!window.confirm(`Delete ${company.company_name}?`)) return
    setError("")
    setMessage("")
    try {
      await api.delete(`/companies/${company.company_id}`)
      setMessage("Company deleted successfully.")
      load()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to delete company."))
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="COMPANIES"
        title="Manage hiring partners"
        description="Add companies and keep the organisations behind each role up to date."
      />

      <section className="split-grid split-grid--wide">
        <aside className="panel">
          <p className="eyebrow">{editing ? "EDIT COMPANY" : "ADD COMPANY"}</p>
          <h2>{editing ? "Update company" : "New hiring partner"}</h2>

          <form className="form-stack" onSubmit={save}>
            <label>
              Company name
              <input
                value={form.company_name}
                onChange={update("company_name")}
                placeholder="e.g. Acme Corp"
                required
              />
            </label>

            <label>
              Industry
              <input
                value={form.industry}
                onChange={update("industry")}
                placeholder="e.g. Technology"
                required
              />
            </label>

            <label>
              Website
              <input
                type="text"
                value={form.website}
                onChange={update("website")}
                placeholder="https://acme.com or acme.com"
                required
              />
            </label>

            <div className="form-actions">
              <button className="button button--primary">
                {editing ? "Save changes" : "Add company"}
              </button>
              {editing && (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setForm(blank)
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <Notice type="success">{message}</Notice>
          <Notice>{error}</Notice>
        </aside>

        <section className="company-grid">
          {companies.length ? (
            companies.map((company) => {
              const initial = (company.company_name || "C").trim()[0]?.toUpperCase() || "C"
              const websiteHref = company.website
                ? company.website.startsWith("http://") || company.website.startsWith("https://")
                  ? company.website
                  : `https://${company.website}`
                : "#"

              return (
                <article className="company-card" key={company.company_id}>
                  <div className="company-logo">{initial}</div>
                  <div>
                    <h2>{company.company_name}</h2>
                    <p>{company.industry}</p>
                    {company.website && (
                      <a
                        className="text-link"
                        href={websiteHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit site ↗
                      </a>
                    )}
                  </div>
                  <div className="card-actions">
                    <button className="text-button" type="button" onClick={() => edit(company)}>
                      Edit
                    </button>
                    <button
                      className="text-button danger"
                      type="button"
                      onClick={() => remove(company)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })
          ) : (
            <EmptyState
              title="No companies yet"
              description="Add the first hiring partner before posting a job."
            />
          )}
        </section>
      </section>
    </div>
  )
}

export default CompaniesAdmin
