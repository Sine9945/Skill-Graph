import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"

const levels = ["Beginner", "Intermediate", "Advanced"]

function JobRequirementsPanel({ job, onClose }) {
  const [skills, setSkills] = useState([])
  const [required, setRequired] = useState([])
  const [criteria, setCriteria] = useState(null)
  const [newSkill, setNewSkill] = useState("")
  const [newLevel, setNewLevel] = useState("Intermediate")
  const [criteriaForm, setCriteriaForm] = useState({
    minimum_cgpa: "",
    departments: "",
    years: "",
  })
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const loadSetup = async () => {
    if (!job) return
    setError("")
    try {
      const [skillResponse, req] = await Promise.all([
        api.get("/skills"),
        api.get(`/jobs/${job.job_id}/required-skills`),
      ])
      setSkills(skillResponse.data)
      setRequired(req.data.required_skills || [])
      try {
        const eligibility = await api.get(`/jobs/${job.job_id}/eligibility`)
        setCriteria(eligibility.data)
        setCriteriaForm({
          minimum_cgpa: eligibility.data.minimum_cgpa,
          departments: (eligibility.data.departments || []).join(", "),
          years: (eligibility.data.years || []).join(", "),
        })
      } catch (eligibilityError) {
        if (eligibilityError.response?.status !== 404) throw eligibilityError
        setCriteria(null)
        setCriteriaForm({ minimum_cgpa: "", departments: "", years: "" })
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load job setup."))
    }
  }

  useEffect(() => {
    loadSetup()
  }, [job?.job_id])

  if (!job) return null

  const availableSkills = skills.filter(
    (skill) => !required.some((item) => item.skill_id === skill.skill_id || item.skill === skill.skill_name)
  )

  const addRequiredSkill = async () => {
    if (!newSkill) return
    setError("")
    try {
      await api.post(`/jobs/${job.job_id}/skills/${newSkill}`, null, {
        params: { required_proficiency: newLevel },
      })
      setNewSkill("")
      setMessage("Required skill added.")
      loadSetup()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to add required skill."))
    }
  }

  const changeRequiredSkill = async (skillId, level) => {
    setError("")
    try {
      await api.put(`/jobs/${job.job_id}/skills/${skillId}`, null, {
        params: { required_proficiency: level },
      })
      setMessage("Required level updated.")
      loadSetup()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update required skill."))
    }
  }

  const removeRequiredSkill = async (skillId) => {
    setError("")
    try {
      await api.delete(`/jobs/${job.job_id}/skills/${skillId}`)
      setMessage("Required skill removed.")
      loadSetup()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to remove required skill."))
    }
  }

  const saveCriteria = async (event) => {
    event.preventDefault()
    const payload = {
      minimum_cgpa: Number(criteriaForm.minimum_cgpa),
      departments: criteriaForm.departments
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      years: criteriaForm.years
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item)),
    }
    setError("")
    try {
      const response = criteria
        ? await api.put(`/jobs/${job.job_id}/eligibility`, payload)
        : await api.post(`/jobs/${job.job_id}/eligibility`, payload)
      setCriteria(response.data)
      setMessage("Eligibility criteria saved.")
      loadSetup()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to save eligibility criteria."))
    }
  }

  return (
    <section className="setup-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ROLE SETUP</p>
          <h2>{job.job_title}</h2>
          <p className="muted">Assign required skills and eligibility rules used for student checks.</p>
        </div>
        <button className="text-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>
      {message && <p className="notice notice--success">{message}</p>}
      {error && <p className="notice notice--error">{error}</p>}
      <div className="setup-grid">
        <article>
          <h3>Required skills</h3>
          <div className="skill-list">
            {required.map((skill) => (
              <div className="skill-card" key={skill.skill_id || skill.skill}>
                <strong>{skill.skill}</strong>
                <div className="skill-card__actions">
                  <select
                    value={skill.required_proficiency}
                    onChange={(event) =>
                      changeRequiredSkill(skill.skill_id, event.target.value)
                    }
                  >
                    {levels.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => removeRequiredSkill(skill.skill_id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="inline-form">
            <select value={newSkill} onChange={(event) => setNewSkill(event.target.value)}>
              <option value="">Add a skill</option>
              {availableSkills.map((skill) => (
                <option key={skill.skill_id} value={skill.skill_id}>
                  {skill.skill_name}
                </option>
              ))}
            </select>
            <select value={newLevel} onChange={(event) => setNewLevel(event.target.value)}>
              {levels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
            <button className="button button--secondary button--small" type="button" onClick={addRequiredSkill}>
              Add
            </button>
          </div>
        </article>
        <article>
          <h3>Eligibility criteria</h3>
          <form className="form-stack" onSubmit={saveCriteria}>
            <label>
              Minimum CGPA
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={criteriaForm.minimum_cgpa}
                onChange={(event) =>
                  setCriteriaForm({ ...criteriaForm, minimum_cgpa: event.target.value })
                }
                required
              />
            </label>
            <label>
              Eligible departments <small>Separate values with commas.</small>
              <input
                value={criteriaForm.departments}
                onChange={(event) =>
                  setCriteriaForm({ ...criteriaForm, departments: event.target.value })
                }
                placeholder="CSE, IT"
                required
              />
            </label>
            <label>
              Eligible years <small>Separate values with commas.</small>
              <input
                value={criteriaForm.years}
                onChange={(event) =>
                  setCriteriaForm({ ...criteriaForm, years: event.target.value })
                }
                placeholder="2, 3, 4"
                required
              />
            </label>
            <button className="button button--primary">
              {criteria ? "Update criteria" : "Save criteria"}
            </button>
          </form>
        </article>
      </div>
    </section>
  )
}

export default JobRequirementsPanel
