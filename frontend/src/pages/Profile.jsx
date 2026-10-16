import { useEffect, useState } from "react"
import api, { getErrorMessage } from "../services/api"
import { Loading, Notice, PageHeader } from "../components/UI"

function Profile() {
  const [student, setStudent] = useState(null); const [form, setForm] = useState(null); const [message, setMessage] = useState(""); const [error, setError] = useState("")
  useEffect(() => { api.get("/students/me").then(({ data }) => { setStudent(data); setForm(data) }).catch(() => setError("Unable to load your profile.")) }, [])
  if (!student || !form) return <Loading />
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const save = async (event) => { event.preventDefault(); setMessage(""); setError(""); try { const response = await api.put(`/students/${student.student_id}`, { ...form, year: Number(form.year), cgpa: Number(form.cgpa) }); setStudent(response.data); setForm(response.data); setMessage("Your profile has been updated.") } catch (requestError) { setError(getErrorMessage(requestError, "Unable to update your profile.")) } }
  return <div className="page page--narrow"><PageHeader eyebrow="PROFILE" title="Your academic profile" description="Keep this information accurate for reliable eligibility checks." /><form className="panel form-grid" onSubmit={save}><label className="span-2">Full name<input value={form.name} onChange={update("name")} required /></label><label className="span-2">Email<input type="email" value={form.email} onChange={update("email")} required /></label><label>Department<input value={form.department} onChange={update("department")} required /></label><label>Year<input type="number" min="1" max="8" value={form.year} onChange={update("year")} required /></label><label className="span-2">CGPA<input type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={update("cgpa")} required /></label><div className="span-2 form-actions"><Notice type="success">{message}</Notice><Notice>{error}</Notice><button className="button button--primary">Save changes</button></div></form></div>
}
export default Profile
