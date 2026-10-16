import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { EmptyState, Loading, Notice, PageHeader } from "../components/UI"

const blank = { skill_name: "", category: "" }

function SkillsAdmin() {
  const [skills, setSkills] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const response = await api.get("/skills")
      setSkills(Array.isArray(response.data) ? response.data : [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load skills."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <Loading />

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const save = async (event) => {
    event.preventDefault()
    setError("")
    setMessage("")
    try {
      if (editing) {
        await api.put(`/skills/${editing}`, form)
        setMessage("Skill updated.")
      } else {
        await api.post("/skills", form)
        setMessage("Skill added to the catalog.")
      }
      setForm(blank)
      setEditing(null)
      load()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to save this skill."))
    }
  }

  const edit = (skill) => {
    setEditing(skill.skill_id)
    setForm({
      skill_name: skill.skill_name,
      category: skill.category,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const remove = async (skill) => {
    if (!window.confirm(`Delete ${skill.skill_name}? Skills in use cannot be deleted.`)) return
    setError("")
    setMessage("")
    try {
      await api.delete(`/skills/${skill.skill_id}`)
      if (editing === skill.skill_id) {
        setEditing(null)
        setForm(blank)
      }
      setMessage("Skill deleted.")
      load()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to delete this skill."))
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="SKILLS CATALOG"
        title="Manage skills"
        description="Add and maintain skills that students, projects, and jobs can reference. Skills already in use cannot be deleted."
      />
      <section className="split-grid split-grid--wide">
        <aside className="panel">
          <p className="eyebrow">{editing ? "EDIT SKILL" : "ADD SKILL"}</p>
          <h2>{editing ? "Update catalog entry" : "Create a skill"}</h2>
          <form className="form-stack" onSubmit={save}>
            <label>
              Skill name
              <input
                value={form.skill_name}
                onChange={update("skill_name")}
                placeholder="e.g. Python"
                required
              />
            </label>
            <label>
              Category
              <input
                value={form.category}
                onChange={update("category")}
                placeholder="e.g. Programming"
                required
              />
            </label>
            <div className="form-actions">
              <button className="button button--primary">{editing ? "Save changes" : "Add skill"}</button>
              {editing && (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setForm(blank)
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
          {skills.length ? (
            skills.map((skill) => (
              <article className="admin-job" key={skill.skill_id}>
                <div>
                  <h2>{skill.skill_name}</h2>
                  <p>{skill.category}</p>
                </div>
                <div className="card-actions">
                  <button className="text-button" type="button" onClick={() => edit(skill)}>
                    Edit
                  </button>
                  <button className="text-button danger" type="button" onClick={() => remove(skill)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No skills in the catalog"
              description="Add the first skill so students and jobs can use a shared list."
            />
          )}
        </section>
      </section>
    </div>
  )
}

export default SkillsAdmin
