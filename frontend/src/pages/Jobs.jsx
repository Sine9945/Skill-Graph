import { useEffect, useMemo, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { EmptyState, Loading, Notice, PageHeader, StatusBadge } from "../components/UI"

function Jobs() {
  const [student, setStudent] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [query, setQuery] = useState("")
  const [type, setType] = useState("All")
  const [selected, setSelected] = useState(null)
  const [requiredSkills, setRequiredSkills] = useState([])
  const [criteria, setCriteria] = useState(null)
  const [eligibility, setEligibility] = useState(null)
  const [skillGap, setSkillGap] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [working, setWorking] = useState("")

  const load = async () => {
    const profile = await api.get("/students/me")
    setStudent(profile.data)
    const [jobResponse, applicationResponse] = await Promise.all([
      api.get("/jobs"),
      api.get(`/students/${profile.data.student_id}/applications`),
    ])
    setJobs(jobResponse.data)
    setApplications(applicationResponse.data)
  }

  useEffect(() => {
    load().catch(() => setError("Unable to load jobs."))
  }, [])

  const filtered = useMemo(
    () =>
      jobs.filter(
        (job) =>
          (type === "All" || job.job_type === type) &&
          `${job.job_title} ${job.location}`.toLowerCase().includes(query.toLowerCase())
      ),
    [jobs, query, type]
  )

  if (!student) return <Loading />

  const open = async (job) => {
    setSelected(job)
    setRequiredSkills([])
    setCriteria(null)
    setEligibility(null)
    setSkillGap(null)
    setMessage("")
    setError("")
    try {
      const [skillsResponse, eligibilityResponse] = await Promise.allSettled([
        api.get(`/jobs/${job.job_id}/required-skills`),
        api.get(`/jobs/${job.job_id}/eligibility`),
      ])
      if (skillsResponse.status === "fulfilled") {
        setRequiredSkills(skillsResponse.value.data.required_skills || [])
      } else {
        setError(getErrorMessage(skillsResponse.reason, "Unable to load job requirements."))
      }
      if (eligibilityResponse.status === "fulfilled") {
        setCriteria(eligibilityResponse.value.data)
      } else if (eligibilityResponse.reason?.response?.status !== 404) {
        setError(getErrorMessage(eligibilityResponse.reason, "Unable to load eligibility criteria."))
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load job requirements."))
    }
  }

  const application = selected && applications.find((item) => item.job_id === selected.job_id)
  const jobClosed = selected && selected.is_active === false
  const canWithdraw = application && ["Applied", "Shortlisted"].includes(application.application_status)

  const checkEligibility = async () => {
    if (!selected) return
    setWorking("eligibility")
    setError("")
    try {
      const response = await api.get(
        `/students/${student.student_id}/jobs/${selected.job_id}/eligibility`
      )
      setEligibility(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Eligibility is not available for this role."))
    } finally {
      setWorking("")
    }
  }

  const checkGap = async () => {
    if (!selected) return
    setWorking("gap")
    setError("")
    try {
      const response = await api.get(
        `/students/${student.student_id}/jobs/${selected.job_id}/skill-gap`
      )
      setSkillGap(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Skill analysis is not available for this role."))
    } finally {
      setWorking("")
    }
  }

  const apply = async () => {
    if (!selected) return
    setWorking("apply")
    setError("")
    try {
      const response = await api.post(
        `/students/${student.student_id}/jobs/${selected.job_id}/apply`
      )
      setApplications([...applications, response.data])
      setMessage("Application submitted successfully.")
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to submit your application."))
    } finally {
      setWorking("")
    }
  }

  const withdraw = async () => {
    if (!application) return
    if (!window.confirm("Withdraw this application? The record will be kept as Withdrawn.")) return
    setWorking("withdraw")
    setError("")
    try {
      const response = await api.post(
        `/students/${student.student_id}/applications/${application.application_id}/withdraw`
      )
      setApplications(
        applications.map((item) =>
          item.application_id === response.data.application_id ? response.data : item
        )
      )
      setMessage("Application withdrawn.")
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to withdraw this application."))
    } finally {
      setWorking("")
    }
  }

  const types = ["All", ...new Set(jobs.map((job) => job.job_type))]

  return (
    <div className="page">
      <PageHeader
        eyebrow="OPPORTUNITIES"
        title="Find your next challenge"
        description="Explore roles, understand requirements, and make more informed applications."
      />
      <section className="toolbar">
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by role or location"
          />
        </div>
        <div className="filter-row">
          {types.map((item) => (
            <button
              key={item}
              className={`filter-button ${type === item ? "filter-button--active" : ""}`}
              type="button"
              onClick={() => setType(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      {filtered.length ? (
        <section className="job-grid">
          {filtered.map((job) => {
            const savedApplication = applications.find((item) => item.job_id === job.job_id)
            return (
              <article className="job-card" key={job.job_id}>
                <div className="job-card__top">
                  <span className="job-icon">{job.job_title[0]}</span>
                  {job.is_active === false ? (
                    <StatusBadge status="Closed" />
                  ) : (
                    savedApplication && <StatusBadge status={savedApplication.application_status} />
                  )}
                </div>
                <h2>{job.job_title}</h2>
                <p className="muted">
                  {job.location} · {job.job_type}
                </p>
                <p className="job-description">{job.job_description}</p>
                <div className="job-card__footer">
                  <span>₹ {Number(job.package).toLocaleString()} LPA</span>
                  <button className="button button--secondary button--small" type="button" onClick={() => open(job)}>
                    Explore
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState title="No matching roles" description="Try a different search term or filter." />
      )}
      {selected && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Job details">
          <button className="modal-backdrop" type="button" onClick={() => setSelected(null)} aria-label="Close" />
          <article className="modal">
            <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close">
              ×
            </button>
            <div className="modal-header">
              <div>
                <p className="eyebrow">ROLE DETAILS</p>
                <h2>{selected.job_title}</h2>
                <p className="muted">
                  {selected.location} · {selected.job_type} · ₹ {Number(selected.package).toLocaleString()} LPA
                </p>
              </div>
              {jobClosed ? (
                <StatusBadge status="Closed" />
              ) : (
                application && <StatusBadge status={application.application_status} />
              )}
            </div>
            <p className="modal-description">{selected.job_description}</p>
            <section className="requirement-section">
              <h3>Required skills</h3>
              {requiredSkills.length ? (
                <div className="chip-row">
                  {requiredSkills.map((skill) => (
                    <span className="chip chip--solid" key={skill.skill_id || skill.skill}>
                      {skill.skill}
                      <small>{skill.required_proficiency}</small>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">No skills have been listed for this role.</p>
              )}
            </section>
            <section className="requirement-section">
              <h3>Eligibility</h3>
              {criteria ? (
                <div className="check-list">
                  <span>Minimum CGPA: {criteria.minimum_cgpa}</span>
                  <span>Departments: {(criteria.departments || []).join(", ") || "Not specified"}</span>
                  <span>Academic years: {(criteria.years || []).join(", ") || "Not specified"}</span>
                </div>
              ) : (
                <p className="muted">No eligibility criteria have been published for this role.</p>
              )}
            </section>
            <section className="action-grid">
              <button
                className="button button--secondary"
                type="button"
                onClick={checkEligibility}
                disabled={working === "eligibility"}
              >
                {working === "eligibility" ? "Checking…" : "Check eligibility"}
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={checkGap}
                disabled={working === "gap"}
              >
                {working === "gap" ? "Analysing…" : "Analyse skill gap"}
              </button>
              {application ? (
                <div className="application-summary">
                  <strong>Application {application.application_status.toLowerCase()}</strong>
                  <span>Applied on {application.application_date}</span>
                  {canWithdraw && (
                    <button
                      className="button button--secondary button--small"
                      type="button"
                      onClick={withdraw}
                      disabled={working === "withdraw"}
                    >
                      {working === "withdraw" ? "Withdrawing…" : "Withdraw application"}
                    </button>
                  )}
                </div>
              ) : jobClosed ? (
                <div className="application-summary">
                  <strong>This role is closed</strong>
                  <span>It is not accepting new applications.</span>
                </div>
              ) : (
                <button
                  className="button button--primary"
                  type="button"
                  onClick={apply}
                  disabled={working === "apply"}
                >
                  {working === "apply" ? "Applying…" : "Apply for this role"}
                </button>
              )}
            </section>
            {eligibility && (
              <section className="insight-card">
                <h3>{eligibility.eligible ? "You are eligible" : "Not eligible yet"}</h3>
                <div className="check-list">
                  <span className={eligibility.cgpa_requirement_met ? "pass" : "fail"}>
                    CGPA {eligibility.cgpa_requirement_met ? "meets" : "does not meet"} requirement
                  </span>
                  <span className={eligibility.department_requirement_met ? "pass" : "fail"}>
                    Department {eligibility.department_requirement_met ? "accepted" : "not accepted"}
                  </span>
                  <span className={eligibility.year_requirement_met ? "pass" : "fail"}>
                    Year {eligibility.year_requirement_met ? "accepted" : "not accepted"}
                  </span>
                </div>
              </section>
            )}
            {skillGap && (
              <section className="insight-card">
                <h3>Skill gap analysis</h3>
                <div className="gap-columns">
                  <div>
                    <h4>Skills you have</h4>
                    {[...(skillGap.matched_skills || []), ...(skillGap.insufficient_skills || [])].map((skill) => (
                      <p key={skill.skill}>
                        <strong>{skill.skill}</strong>
                        <span>
                          {skill.student_proficiency} → {skill.required_proficiency}
                        </span>
                      </p>
                    ))}
                  </div>
                  <div>
                    <h4>Skills to build</h4>
                    {(skillGap.missing_skills || []).length ? (
                      skillGap.missing_skills.map((skill) => (
                        <p key={skill.skill}>
                          <strong>{skill.skill}</strong>
                          <span>Target: {skill.required_proficiency}</span>
                        </p>
                      ))
                    ) : (
                      <p>No missing skills.</p>
                    )}
                  </div>
                </div>
              </section>
            )}
            <Notice type="success">{message}</Notice>
            <Notice>{error}</Notice>
          </article>
        </div>
      )}
    </div>
  )
}

export default Jobs
