import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../services/api"
import { Loading, PageHeader, StatusBadge } from "../components/UI"
import StatusPieChart from "../components/StatusPieChart"

function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const load = async () => {
      const [admin, companies, jobs, applications, students, demand, status] = await Promise.all([
        api.get("/admin/me"),
        api.get("/companies"),
        api.get("/jobs"),
        api.get("/applications"),
        api.get("/students"),
        api.get("/analytics/most-demanded-skills"),
        api.get("/analytics/application-stats"),
      ])
      setData({
        admin: admin.data,
        companies: companies.data,
        jobs: jobs.data,
        applications: applications.data,
        students: students.data,
        demand: demand.data,
        status: status.data,
      })
    }
    load().catch(() => setData({ error: true }))
  }, [])

  if (!data) return <Loading />
  if (data.error) return <p className="notice notice--error">Unable to load the admin dashboard.</p>

  const { admin, companies, jobs, applications, students, demand, status } = data
  const maxDemand = Math.max(...demand.map((item) => item.job_count), 1)

  // Normalize status counts for the pie chart
  const statusOrder = ["Applied", "Shortlisted", "Selected", "Rejected", "Withdrawn"]
  const normalizedStatus = statusOrder.map((s) => {
    const found = status.find((item) => item.status?.toLowerCase() === s.toLowerCase())
    return {
      status: s,
      value: found ? Number(found.count) || 0 : 0,
    }
  })

  return (
    <div className="page">
      <PageHeader
        eyebrow="ADMIN DASHBOARD"
        title={`Welcome, ${admin.name.split(" ")[0]}.`}
        description="Monitor the opportunity ecosystem and keep candidate reviews moving forward."
        action={
          <div className="header-actions">
            <Link className="button button--primary" to="/admin/jobs">
              Create a job
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
            <span>Students</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <strong>{students.length}</strong>
          <small>Registered candidate profiles</small>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Companies</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <line x1="9" y1="22" x2="9" y2="22.01"></line>
                <line x1="15" y1="22" x2="15" y2="22.01"></line>
                <line x1="9" y1="6" x2="9" y2="6.01"></line>
                <line x1="15" y1="6" x2="15" y2="6.01"></line>
                <line x1="9" y1="10" x2="9" y2="10.01"></line>
                <line x1="15" y1="10" x2="15" y2="10.01"></line>
                <line x1="9" y1="14" x2="9" y2="14.01"></line>
                <line x1="15" y1="14" x2="15" y2="14.01"></line>
                <line x1="9" y1="18" x2="9" y2="18.01"></line>
                <line x1="15" y1="18" x2="15" y2="18.01"></line>
              </svg>
            </div>
          </div>
          <strong>{companies.length}</strong>
          <small>Hiring partner organisations</small>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Live jobs</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
          </div>
          <strong>{jobs.length}</strong>
          <small>Active posted openings</small>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Applications</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
          </div>
          <strong>{applications.length}</strong>
          <small>Total candidate submissions</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <StatusPieChart
          title="Candidate Pipeline"
          subtitle="Overall status breakdown across all jobs"
          data={normalizedStatus}
          totalCount={applications.length}
          link="/admin/applications"
        />

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MARKET SIGNAL</p>
              <h2>Most requested skills</h2>
              <p className="panel-subtitle">Skills with highest demand in posted roles</p>
            </div>
          </div>
          {demand.length ? (
            <div className="demand-list">
              {demand.slice(0, 5).map((item) => (
                <div key={item.skill_name} className="demand-row">
                  <div className="demand-row-info">
                    <strong>{item.skill_name}</strong>
                    <span>{item.job_count} {item.job_count === 1 ? "role" : "roles"}</span>
                  </div>
                  <div className="bar">
                    <span style={{ width: `${(item.job_count / maxDemand) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Skill demand data will appear after job requirements are configured.</p>
          )}
        </article>

        <article className="panel panel--wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LATEST APPLICATIONS</p>
              <h2>Recent candidate submissions</h2>
            </div>
            <Link to="/admin/applications" className="chart-arrow-link" aria-label="View all applications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </Link>
          </div>
          {applications.length ? (
            <div className="compact-list">
              {applications.slice(0, 5).map((application) => (
                <div className="compact-list__item" key={application.application_id}>
                  <div className="compact-list__info">
                    <strong>Application #{application.application_id}</strong>
                    <span>Submitted on {application.application_date}</span>
                  </div>
                  <StatusBadge status={application.application_status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No candidate applications yet.</p>
          )}
        </article>
      </section>
    </div>
  )
}

export default AdminDashboard
