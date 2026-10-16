import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { EmptyState, Loading, Notice, PageHeader, StatusBadge } from "../components/UI"
import { Link } from "react-router-dom"

const withdrawable = ["Applied", "Shortlisted"]

function Applications() {
  const [data, setData] = useState(null)
  const [studentId, setStudentId] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [working, setWorking] = useState(null)

  const load = async () => {
    const student = (await api.get("/students/me")).data
    setStudentId(student.student_id)
    const [applications, jobs] = await Promise.all([
      api.get(`/students/${student.student_id}/applications`),
      api.get("/jobs"),
    ])
    setData({ applications: applications.data, jobs: jobs.data })
  }

  useEffect(() => {
    load().catch(() => setData({ error: true }))
  }, [])

  if (!data) return <Loading />
  if (data.error) return <p className="notice notice--error">Unable to load applications.</p>

  const jobFor = (jobId) => data.jobs.find((job) => job.job_id === jobId)
  const messages = {
    Applied: "Your application is with the hiring team.",
    Shortlisted: "You have been shortlisted—watch for the next step.",
    Selected: "Congratulations, you have been selected.",
    Rejected: "This role was not the right match this time.",
    Withdrawn: "You withdrew this application. The record is kept in your history.",
  }

  const withdraw = async (application) => {
    if (!window.confirm("Withdraw this application? The record will be kept as Withdrawn.")) return
    setError("")
    setMessage("")
    setWorking(application.application_id)
    try {
      await api.post(
        `/students/${studentId}/applications/${application.application_id}/withdraw`
      )
      setMessage("Application withdrawn.")
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to withdraw this application."))
    } finally {
      setWorking(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="APPLICATIONS"
        title="Track every opportunity"
        description="Follow your applications from submission through to outcome. You can withdraw while a role is still Applied or Shortlisted."
      />
      <Notice type="success">{message}</Notice>
      <Notice>{error}</Notice>
      {data.applications.length ? (
        <section className="application-list">
          {data.applications.map((application) => {
            const job = jobFor(application.job_id)
            const canWithdraw = withdrawable.includes(application.application_status)
            return (
              <article className="application-card" key={application.application_id}>
                <div>
                  <div className="application-card__title">
                    <h2>{job?.job_title || `Job #${application.job_id}`}</h2>
                    <StatusBadge status={application.application_status} />
                  </div>
                  <p className="muted">
                    {job ? `${job.location} · ${job.job_type}` : "Job details are unavailable"}
                    {job && job.is_active === false ? " · Closed" : ""}
                  </p>
                  <p>{messages[application.application_status] || "Application status updated."}</p>
                  <small>Applied on {application.application_date}</small>
                </div>
                <div className="card-actions">
                  {job && (
                    <Link className="button button--secondary button--small" to="/jobs">
                      View role
                    </Link>
                  )}
                  {canWithdraw && (
                    <button
                      className="button button--secondary button--small"
                      type="button"
                      disabled={working === application.application_id}
                      onClick={() => withdraw(application)}
                    >
                      {working === application.application_id ? "Withdrawing…" : "Withdraw"}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState
          title="No applications yet"
          description="When you find a role that feels right, it will appear here after you apply."
          action={
            <Link className="button button--primary" to="/jobs">
              Browse jobs
            </Link>
          }
        />
      )}
    </div>
  )
}

export default Applications
