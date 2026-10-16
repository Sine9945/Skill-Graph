import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { EmptyState, Loading, Notice, PageHeader, StatusBadge } from "../components/UI"
import JobRequirementsPanel from "../components/JobRequirementsPanel"

const blankJob = { company_id: "", job_title: "", job_description: "", location: "", job_type: "Full-time", package: "" }

function JobsAdmin() {
  const [jobs, setJobs] = useState([])
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState(blankJob)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [jobResponse, companyResponse] = await Promise.all([
      api.get("/jobs"),
      api.get("/companies"),
    ])
    setJobs(jobResponse.data)
    setCompanies(companyResponse.data)
    setLoading(false)
  }

  useEffect(() => {
    load().catch(() => {
      setError("Unable to load jobs.")
      setLoading(false)
    })
  }, [])

  if (loading) return <Loading />

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const save = async (event) => {
    event.preventDefault()
    setError("")
    try {
      const payload = {
        job_title: form.job_title,
        job_description: form.job_description,
        location: form.location,
        job_type: form.job_type,
        package: Number(form.package),
      }
      if (editing) {
        await api.put(`/jobs/${editing}`, payload)
        setMessage("Job updated.")
      } else {
        await api.post(`/companies/${form.company_id}/jobs`, payload)
        setMessage("Job created.")
      }
      setForm(blankJob)
      setEditing(null)
      load()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to save this job."))
    }
  }

  const edit = (job) => {
    setEditing(job.job_id)
    setForm({
      company_id: job.company_id,
      job_title: job.job_title,
      job_description: job.job_description,
      location: job.location,
      job_type: job.job_type,
      package: job.package,
    })
  }

  const remove = async (job) => {
    if (!window.confirm(`Delete ${job.job_title}? Jobs with applications cannot be deleted.`)) return
    try {
      await api.delete(`/jobs/${job.job_id}`)
      if (selected?.job_id === job.job_id) setSelected(null)
      setMessage("Job deleted.")
      load()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to delete job."))
    }
  }

  const toggleActive = async (job) => {
    const next = !job.is_active
    const action = next ? "reopen" : "close"
    if (!window.confirm(`${next ? "Reopen" : "Close"} ${job.job_title}? Existing applications will be kept.`)) return
    setError("")
    try {
      const response = await api.put(`/jobs/${job.job_id}/status`, { is_active: next })
      setJobs(jobs.map((item) => (item.job_id === job.job_id ? response.data : item)))
      if (selected?.job_id === job.job_id) setSelected(response.data)
      setMessage(`Job ${action}d.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError, `Unable to ${action} this job.`))
    }
  }

  const companyName = (id) =>
    companies.find((company) => company.company_id === id)?.company_name || "Unknown company"

  return (
    <div className="page">
      <PageHeader
        eyebrow="JOBS"
        title="Publish and configure roles"
        description="Create openings, define required skills, set eligibility rules, and close roles that should no longer accept applications."
      />
      <section className="split-grid split-grid--wide">
        <aside className="panel">
          <p className="eyebrow">{editing ? "EDIT JOB" : "CREATE JOB"}</p>
          <h2>{editing ? "Update role details" : "Post an opportunity"}</h2>
          <form className="form-stack" onSubmit={save}>
            {!editing && (
              <label>
                Company
                <select value={form.company_id} onChange={update("company_id")} required>
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Job title
              <input value={form.job_title} onChange={update("job_title")} required />
            </label>
            <label>
              Description
              <textarea value={form.job_description} onChange={update("job_description")} required />
            </label>
            <div className="form-grid">
              <label>
                Location
                <input value={form.location} onChange={update("location")} required />
              </label>
              <label>
                Type
                <select value={form.job_type} onChange={update("job_type")}>
                  <option>Full-time</option>
                  <option>Internship</option>
                  <option>Part-time</option>
                  <option>On Site</option>
                  <option>Remote</option>
                  <option>Hybrid</option>
                </select>
              </label>
            </div>
            <label>
              Package (LPA)
              <input type="number" min="0" step="0.01" value={form.package} onChange={update("package")} required />
            </label>
            <div className="form-actions">
              <button className="button button--primary">{editing ? "Save changes" : "Publish job"}</button>
              {editing && (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setForm(blankJob)
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
        <section className="admin-job-list">
          {jobs.length ? (
            jobs.map((job) => (
              <article
                className={`admin-job ${selected?.job_id === job.job_id ? "admin-job--selected" : ""}`}
                key={job.job_id}
              >
                <div>
                  <h2>{job.job_title}</h2>
                  <p>
                    {companyName(job.company_id)} · {job.location} · ₹ {job.package} LPA
                  </p>
                  <StatusBadge status={job.is_active === false ? "Closed" : "Open"} />
                </div>
                <div className="card-actions">
                  <button className="text-button" type="button" onClick={() => setSelected(job)}>
                    Configure
                  </button>
                  <button className="text-button" type="button" onClick={() => edit(job)}>
                    Edit
                  </button>
                  <button className="text-button" type="button" onClick={() => toggleActive(job)}>
                    {job.is_active === false ? "Reopen" : "Close"}
                  </button>
                  <button className="text-button danger" type="button" onClick={() => remove(job)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No jobs published" description="Create a company, then post the first opportunity." />
          )}
        </section>
      </section>
      {selected && (
        <JobRequirementsPanel job={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

export default JobsAdmin
