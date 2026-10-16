import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../services/api"
import { Loading, PageHeader, StatusBadge } from "../components/UI"
import StatusPieChart from "../components/StatusPieChart"

function StudentDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const load = async () => {
      const studentResponse = await api.get("/students/me")
      const student = studentResponse.data
      const [skillsResponse, projectsResponse, applicationsResponse, jobsResponse] = await Promise.all([
        api.get(`/students/${student.student_id}/skills`),
        api.get(`/students/${student.student_id}/projects`),
        api.get(`/students/${student.student_id}/applications`),
        api.get("/jobs"),
      ])
      setData({
        student,
        skills: skillsResponse.data,
        projects: projectsResponse.data,
        applications: applicationsResponse.data,
        jobs: jobsResponse.data,
      })
    }
    load().catch(() => setData({ error: true }))
  }, [])

  if (!data) return <Loading />
  if (data.error) return <p className="notice notice--error">Unable to load your dashboard.</p>

  const { student, skills, projects, applications, jobs } = data
  const jobTitle = (jobId) => jobs.find((job) => job.job_id === jobId)?.job_title || "Removed job"

  const statusCounts = ["Applied", "Shortlisted", "Selected", "Rejected", "Withdrawn"].map((status) => ({
    status,
    value: applications.filter((application) => application.application_status === status).length,
  }))

  return (
    <div className="page">
      <PageHeader
        eyebrow="STUDENT DASHBOARD"
        title={`Good to see you, ${student.name.split(" ")[0]}.`}
        description="Here is a clear view of your career readiness and current opportunities."
        action={
          <div className="header-actions">
            <Link className="button button--primary" to="/jobs">
              Browse jobs
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
        }
      />

      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-header">
            <span>CGPA</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
          </div>
          <strong>{student.cgpa}</strong>
          <small>Academic performance</small>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Skills</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <strong>{skills.length}</strong>
          <small>Recorded proficiencies</small>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Projects</span>
            <div className="metric-icon-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
          </div>
          <strong>{projects.length}</strong>
          <small>Showcased work</small>
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
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
          </div>
          <strong>{applications.length}</strong>
          <small>Active job pipeline</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <StatusPieChart
          title="Application Statuses"
          subtitle="Real-time distribution of your submissions"
          data={statusCounts}
          totalCount={applications.length}
          link="/applications"
        />

        <article className="panel profile-summary">
          <div className="profile-summary__header">
            <p className="eyebrow">PROFILE SNAPSHOT</p>
            <span className="profile-tag">Verified Profile</span>
          </div>
          <h2>{student.department} · Year {student.year}</h2>
          <p>
            Keep your profile current so eligibility checks reflect your latest coursework, CGPA, and project experience.
          </p>

          <div className="profile-stats-row">
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">Department</span>
              <span className="profile-stat-val">{student.department}</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">Class Year</span>
              <span className="profile-stat-val">Year {student.year}</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">Academic CGPA</span>
              <span className="profile-stat-val">{student.cgpa}</span>
            </div>
          </div>

          <Link className="profile-summary__btn" to="/profile">
            Edit profile
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </article>

        <article className="panel panel--wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RECENT APPLICATIONS</p>
              <h2>Where things stand</h2>
            </div>
            <Link to="/applications" className="chart-arrow-link" aria-label="View all applications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </Link>
          </div>

          {applications.length ? (
            <div className="compact-list">
              {applications.slice(0, 4).map((application) => (
                <div className="compact-list__item" key={application.application_id}>
                  <div className="compact-list__info">
                    <strong>{jobTitle(application.job_id)}</strong>
                    <span>Applied {application.application_date}</span>
                  </div>
                  <StatusBadge status={application.application_status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="inline-empty">
              <p>You have not applied to a role yet.</p>
              <Link className="button button--secondary button--small" to="/jobs">
                Explore jobs
              </Link>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}

export default StudentDashboard
