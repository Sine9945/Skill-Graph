import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { EmptyState, Loading, Notice, PageHeader, StatusBadge } from "../components/UI"

const statuses = ["Applied", "Shortlisted", "Selected", "Rejected", "Withdrawn"]
const reviewerStatuses = ["Applied", "Shortlisted", "Selected", "Rejected"]
function ApplicationsAdmin() {
  const [data, setData] = useState(null); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [filter, setFilter] = useState("All")
  const load = async () => { const [applications, students, jobs] = await Promise.all([api.get("/applications"), api.get("/students"), api.get("/jobs")]); setData({ applications: applications.data, students: students.data, jobs: jobs.data }) }
  useEffect(() => { load().catch(() => setError("Unable to load applications.")) }, [])
  if (!data) return <Loading />
  const nameFor = (id) => data.students.find((student) => student.student_id === id)?.name || `Student #${id}`
  const jobFor = (id) => data.jobs.find((job) => job.job_id === id)?.job_title || `Job #${id}`
  const update = async (applicationId, application_status) => { setError(""); try { await api.put(`/applications/${applicationId}/status`, { application_status }); setMessage("Application status updated."); load() } catch (requestError) { setError(getErrorMessage(requestError, "Unable to update application status.")) } }
  const shown = filter === "All" ? data.applications : data.applications.filter((item) => item.application_status === filter)
  return <div className="page"><PageHeader eyebrow="APPLICATIONS" title="Guide candidates forward" description="Review applications and keep every candidate informed with a clear status." /><section className="toolbar"><div className="filter-row">{["All", ...statuses].map((status) => <button key={status} className={`filter-button ${filter === status ? "filter-button--active" : ""}`} type="button" onClick={() => setFilter(status)}>{status}</button>)}</div></section><Notice type="success">{message}</Notice><Notice>{error}</Notice>{shown.length ? <section className="table-wrap"><table><thead><tr><th>Candidate</th><th>Role</th><th>Applied</th><th>Status</th><th>Update</th></tr></thead><tbody>{shown.map((application) => <tr key={application.application_id}><td>{nameFor(application.student_id)}</td><td>{jobFor(application.job_id)}</td><td>{application.application_date}</td><td><StatusBadge status={application.application_status} /></td><td>{application.application_status === "Withdrawn" ? <span className="muted">Withdrawn by student</span> : <select value={application.application_status} onChange={(event) => update(application.application_id, event.target.value)}>{reviewerStatuses.map((status) => <option key={status}>{status}</option>)}</select>}</td></tr>)}</tbody></table></section> : <EmptyState title="No applications in this group" description="Applications will appear here as students apply to published roles." />}</div>
}
export default ApplicationsAdmin
