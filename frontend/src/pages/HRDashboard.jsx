import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { Loading, PageHeader, StatusBadge, Notice } from "../components/UI"
import StatusPieChart from "../components/StatusPieChart"

const statusOptions = ["Applied", "Shortlisted", "Selected", "Rejected", "Withdrawn"]
const reviewerStatuses = ["Applied", "Shortlisted", "Selected", "Rejected"]

function HRDashboard() {
  const [data, setData] = useState(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      const [hrRes, jobsRes, appsRes] = await Promise.all([
        api.get("/hr/me"),
        api.get("/hr/jobs"),
        api.get("/hr/applications"),
      ])
      setData({
        hr: hrRes.data,
        jobs: jobsRes.data,
        applications: appsRes.data,
      })
    } catch {
      setData({ error: true })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (!data) return <Loading />
  if (data.error) return <p className="notice notice--error">Unable to load HR dashboard.</p>

  const { hr, jobs, applications } = data

  const statusCounts = statusOptions.map((status) => ({
    status,
    value: applications.filter((app) => app.application_status === status).length,
  }))

  const shortlistedCount = applications.filter((app) => app.application_status === "Shortlisted").length
  const selectedCount = applications.filter((app) => app.application_status === "Selected").length

  const updateStatus = async (applicationId, newStatus) => {
    setMessage("")
    setError("")
    try {
      await api.put(`/applications/${applicationId}/status`, {
        application_status: newStatus,
      })
      setMessage(`Application status updated to ${newStatus}.`)
      loadData()
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update application status."))
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${hr.company_name.toUpperCase()} · HR PORTAL`}
        title={`Welcome, ${hr.name.split(" ")[0]}.`}
        description={`Manage applicants and hiring pipelines specifically for ${hr.company_name}.`}
        action={
          <div className="header-actions">
            <Link className="button button--primary" to="/hr/jobs">
              Post a job
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </Link>
          </div>
        }
      />

      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-header">
            <span>Posted Jobs</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
          </div>
          <strong>{jobs.filter((job) => job.is_active !== false).length}</strong>
          <small>Active company openings</small>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Total Applicants</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <strong>{applications.length}</strong>
          <small>Received submissions</small>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Shortlisted</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <strong>{shortlistedCount}</strong>
          <small>Moving to next rounds</small>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Accepted / Selected</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <strong>{selectedCount}</strong>
          <small>Offers extended</small>
        </article>
      </section>

      <Notice type="success">{message}</Notice>
      <Notice>{error}</Notice>

      <section className="dashboard-grid">
        <StatusPieChart
          title="Applicant Pipeline"
          subtitle={`Current statuses for ${hr.company_name} candidates`}
          data={statusCounts}
          totalCount={applications.length}
          link="/hr/applications"
        />

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">COMPANY OVERVIEW</p>
              <h2>{hr.company_name}</h2>
              <p className="panel-subtitle">HR Representative: {hr.name} ({hr.email})</p>
            </div>
            <Link to="/hr/jobs" className="chart-arrow-link" aria-label="View jobs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </Link>
          </div>

          <div style={{ display: "grid", gap: "12px", marginTop: "12px" }}>
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">Active Roles</span>
              <span className="profile-stat-val">{jobs.length} Openings posted</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">Applicant Review Status</span>
              <span className="profile-stat-val">
                {applications.filter(a => a.application_status === "Applied").length} Pending review
              </span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">Decisions Made</span>
              <span className="profile-stat-val">
                {shortlistedCount + selectedCount + applications.filter(a => a.application_status === "Rejected").length} Processed
              </span>
            </div>
          </div>
        </article>

        <article className="panel panel--wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CANDIDATE APPLICATIONS</p>
              <h2>Recent applicants to review</h2>
            </div>
            <Link to="/hr/applications" className="chart-arrow-link" aria-label="View all applications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </Link>
          </div>

          {applications.length ? (
            <div className="compact-list">
              {applications.slice(0, 6).map((app) => (
                <div className="compact-list__item" key={app.application_id}>
                  <div className="compact-list__info">
                    <strong>{app.student_name}</strong>
                    <span>
                      {app.job_title} · {app.student_department} (CGPA: {app.student_cgpa}) · Applied {app.application_date}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <StatusBadge status={app.application_status} />
                    {app.application_status === "Withdrawn" ? null : (
                    <select
                      value={app.application_status}
                      onChange={(e) => updateStatus(app.application_id, e.target.value)}
                      style={{
                        minHeight: "32px",
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {reviewerStatuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="inline-empty">
              <p>No candidates have applied to your company jobs yet.</p>
              <Link className="button button--secondary button--small" to="/hr/jobs">
                Manage jobs
              </Link>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}

export default HRDashboard
