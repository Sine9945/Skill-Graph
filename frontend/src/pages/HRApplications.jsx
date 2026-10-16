import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { EmptyState, Loading, Notice, PageHeader, StatusBadge } from "../components/UI"

const statuses = ["Applied", "Shortlisted", "Selected", "Rejected", "Withdrawn"]
const reviewerStatuses = ["Applied", "Shortlisted", "Selected", "Rejected"]

function HRApplications() {
  const [applications, setApplications] = useState([])
  const [hr, setHr] = useState(null)
  const [filter, setFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [selectedJob, setSelectedJob] = useState("All")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [hrRes, appsRes] = await Promise.all([
        api.get("/hr/me"),
        api.get("/hr/applications"),
      ])
      setHr(hrRes.data)
      setApplications(appsRes.data)
    } catch {
      setError("Unable to load candidate applications.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <Loading />

  const updateStatus = async (applicationId, newStatus) => {
    setError("")
    setMessage("")
    try {
      await api.put(`/applications/${applicationId}/status`, {
        application_status: newStatus,
      })
      setMessage(`Candidate status updated to "${newStatus}".`)
      loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update candidate status."))
    }
  }

  const jobsList = ["All", ...new Set(applications.map((app) => app.job_title).filter(Boolean))]

  const filtered = applications.filter((app) => {
    const matchesStatus = filter === "All" || app.application_status === filter
    const matchesJob = selectedJob === "All" || app.job_title === selectedJob
    const matchesSearch =
      (app.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (app.student_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (app.job_title || "").toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesJob && matchesSearch
  })

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${hr?.company_name?.toUpperCase() || "COMPANY"} · APPLICANTS`}
        title="Candidate Reviews"
        description={`Review, shortlist, select, and reject applicants for ${hr?.company_name || "your company"}'s openings.`}
      />

      <section className="toolbar">
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name, email, or role"
          />
        </div>

        <div className="filter-row">
          {["All", ...statuses].map((st) => (
            <button
              key={st}
              className={`filter-button ${filter === st ? "filter-button--active" : ""}`}
              type="button"
              onClick={() => setFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </section>

      {jobsList.length > 2 && (
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280" }}>Filter by Role:</span>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            style={{ maxWidth: "260px", minHeight: "36px", fontSize: "13px" }}
          >
            {jobsList.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
      )}

      <Notice type="success">{message}</Notice>
      <Notice>{error}</Notice>

      {filtered.length ? (
        <section className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Academic Profile</th>
                <th>Applied Role</th>
                <th>Application Date</th>
                <th>Status</th>
                <th>HR Decision</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.application_id}>
                  <td>
                    <strong>{app.student_name}</strong>
                    <br />
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{app.student_email}</span>
                  </td>
                  <td>
                    <span>{app.student_department}</span>
                    <br />
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      Year {app.student_year} · CGPA: {app.student_cgpa}
                    </span>
                  </td>
                  <td>
                    <strong>{app.job_title}</strong>
                  </td>
                  <td>{app.application_date}</td>
                  <td>
                    <StatusBadge status={app.application_status} />
                  </td>
                  <td>
                    {app.application_status === "Withdrawn" ? (
                      <span style={{ fontSize: "12.5px", color: "#6b7280" }}>Withdrawn by student</span>
                    ) : (
                    <select
                      value={app.application_status}
                      onChange={(e) => updateStatus(app.application_id, e.target.value)}
                      style={{
                        minHeight: "34px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        borderRadius: "8px",
                      }}
                    >
                      {reviewerStatuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <EmptyState
          title="No candidates match your filters"
          description="Try adjusting your status or search query."
        />
      )}
    </div>
  )
}

export default HRApplications
