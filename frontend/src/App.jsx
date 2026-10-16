import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom"
import AppShell from "./components/AppShell"
import AdminDashboard from "./pages/AdminDashboard"
import AdminLogin from "./pages/AdminLogin"
import AdminSetup from "./pages/AdminSetup"
import Applications from "./pages/Applications"
import ApplicationsAdmin from "./pages/ApplicationsAdmin"
import CompaniesAdmin from "./pages/CompaniesAdmin"
import Jobs from "./pages/Jobs"
import JobsAdmin from "./pages/JobsAdmin"
import Login from "./pages/Login"
import Profile from "./pages/Profile"
import Projects from "./pages/Projects"
import Register from "./pages/Register"
import Skills from "./pages/Skills"
import StudentDashboard from "./pages/StudentDashboard"
import HRLogin from "./pages/HRLogin"
import HRRegister from "./pages/HRRegister"
import HRDashboard from "./pages/HRDashboard"
import HRJobs from "./pages/HRJobs"
import HRApplications from "./pages/HRApplications"
import SkillsAdmin from "./pages/SkillsAdmin"

function RequireRole({ role }) {
  const savedRole = localStorage.getItem("userRole")
  if (savedRole !== role) {
    if (role === "admin") return <Navigate to="/admin/login" replace />
    if (role === "hr") return <Navigate to="/hr/login" replace />
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function HomeRedirect() {
  const role = localStorage.getItem("userRole")
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />
  if (role === "hr") return <Navigate to="/hr/dashboard" replace />
  if (role === "student") return <Navigate to="/student/dashboard" replace />
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/hr/login" element={<HRLogin />} />
        <Route path="/hr/register" element={<HRRegister />} />

        {/* Student Routes */}
        <Route element={<RequireRole role="student" />}>
          <Route element={<AppShell role="student" />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/applications" element={<Applications />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<RequireRole role="admin" />}>
          <Route element={<AppShell role="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<CompaniesAdmin />} />
            <Route path="/admin/jobs" element={<JobsAdmin />} />
            <Route path="/admin/skills" element={<SkillsAdmin />} />
            <Route path="/admin/applications" element={<ApplicationsAdmin />} />
          </Route>
        </Route>

        {/* Company HR Routes */}
        <Route element={<RequireRole role="hr" />}>
          <Route element={<AppShell role="hr" />}>
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/jobs" element={<HRJobs />} />
            <Route path="/hr/skills" element={<SkillsAdmin />} />
            <Route path="/hr/applications" element={<HRApplications />} />
          </Route>
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
