import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { EmptyState, Loading, Notice, PageHeader, StatusBadge } from "../components/UI"
import JobRequirementsPanel from "../components/JobRequirementsPanel"

const blankJob = {
  job_title: "",
  job_description: "",
  location: "",
  job_type: "Full-time",
  package: "",
}

function HRJobs() {
  const [jobs, setJobs] = useState([])
  const [hr, setHr] = useState(null)
  const [form, setForm] = useState(blankJob)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [hrRes, jobsRes] = await Promise.all([
        api.get("/hr/me"),
        api.get("/hr/jobs"),
      ])
      setHr(hrRes.data)
      setJobs(jobsRes.data)
    } catch {
      setError("Unable to load company jobs.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <Loading />

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const save = async (event) => {
    event.preventDefault()
    setError("")
    setMessage("")
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
        setMessage("Job updated successfully.")
      } else {
        await api.post("/hr/jobs", payload)
        setMessage("Job posted successfully.")
      }
      setForm(blankJob)
      setEditing(null)
      loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to save job."))
    }
  }

  const edit = (job) => {
    setEditing(job.job_id)
    setForm({
      job_title: job.job_title,
      job_description: job.job_description,
      location: job.location,
      job_type: job.job_type,
      package: job.package,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const remove = async (job) => {
    if (!window.confirm(`Delete ${job.job_title}? Jobs with applications cannot be deleted. Close the job instead.`))
      return
    setError("")
    setMessage("")
    try {
      await api.delete(`/jobs/${job.job_id}`)
      if (selected?.job_id === job.job_id) setSelected(null)
      setMessage("Job deleted successfully.")
      loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to delete job."))
    }
  }

  const toggleActive = async (job) => {
    const next = !job.is_active
    if (!window.confirm(`${next ? "Reopen" : "Close"} ${job.job_title}? Existing applications will remain intact.`))
      return
    setError("")
    setMessage("")
    try {
      const response = await api.put(`/jobs/${job.job_id}/status`, { is_active: next })
      setJobs(jobs.map((item) => (item.job_id === job.job_id ? response.data : item)))
      if (selected?.job_id === job.job_id) setSelected(response.data)
      setMessage(next ? "Job reopened." : "Job closed. Students can no longer apply.")
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update job status."))
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${hr?.company_name?.toUpperCase() || "COMPANY"} · JOBS`}
        title="Manage Company Openings"
        description={`Post jobs, assign required skills and eligibility, and close roles for ${hr?.company_name || "your company"}.`}
      />

      <section className="split-grid split-grid--wide">
        <aside className="panel">
          <p className="eyebrow">{editing ? "EDIT JOB" : "POST A JOB"}</p>
          <h2>{editing ? "Update opening" : "New job opening"}</h2>

          <form className="form-stack" onSubmit={save}>
            <label>
              Job title
              <input
                value={form.job_title}
                onChange={update("job_title")}
                placeholder="e.g. Software Engineer"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={form.job_description}
                onChange={update("job_description")}
                placeholder="Describe role responsibilities, tech stack, and goals"
                required
              />
            </label>

            <div className="form-grid">
              <label>
                Location
                <input
                  value={form.location}
                  onChange={update("location")}
                  placeholder="e.g. Bangalore / Remote"
                  required
                />
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
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.package}
                onChange={update("package")}
                placeholder="e.g. 12"
                required
              />
            </label>

            <div className="form-actions">
              <button className="button button--primary">
                {editing ? "Save changes" : "Publish job"}
              </button>
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
                    {job.location} · {job.job_type} · ₹ {job.package} LPA
                  </p>
                  <p className="job-description" style={{ margin: "6px 0 8px" }}>
                    {job.job_description}
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
            <EmptyState
              title="No jobs published yet"
              description="Create the first job opening for your company using the form."
            />
          )}
        </section>
      </section>
      {selected && <JobRequirementsPanel job={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

export default HRJobs
