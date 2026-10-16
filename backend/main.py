from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from datetime import date
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_token_data
)
from models import (
    Student,
    Skill,
    StudentSkill,
    Project,
    ProjectSkill,
    Company,
    Job,
    JobSkill,
    EligibilityCriteria,
    JobEligibleDepartment,
    JobEligibleYear,
    Application,
    Admin,
    CompanyHR
)
from schemas import (
    StudentCreate,
    StudentResponse,
    StudentUpdate,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
    StudentSkillCreate,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    JobCreate,
    JobResponse,
    JobUpdate,
    JobStatusUpdate,
    EligibilityCreate,
    EligibilityResponse,
    ApplicationResponse,
    ApplicationStatusUpdate,
    TokenResponse,
    StudentLogin,
    AdminLogin,
    AdminCreate,
    HRCreate,
    HRResponse,
    HRLogin
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

@app.post("/students", response_model=StudentResponse)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db)
):
    new_student = Student(
        name=student.name,
        email=student.email,
        password=hash_password(student.password),
        department=student.department,
        year=student.year,
        cgpa=student.cgpa
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return new_student


def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        token_data = get_token_data(token)

        if token_data["role"] != "student":
            raise HTTPException(
                status_code=403,
                detail="Student access required"
            )

        student_id = token_data["user_id"]

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=401,
            detail="Student not found"
        )

    return student

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        token_data = get_token_data(token)

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    if token_data["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    admin_id = token_data["user_id"]

    admin = db.query(Admin).filter(
        Admin.admin_id == admin_id
    ).first()

    if admin is None:
        raise HTTPException(
            status_code=401,
            detail="Admin not found"
        )

    return admin


def get_current_hr(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        token_data = get_token_data(token)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    if token_data.get("role") != "hr":
        raise HTTPException(
            status_code=403,
            detail="HR access required"
        )

    hr_id = token_data.get("user_id")
    hr = db.query(CompanyHR).filter(
        CompanyHR.hr_id == hr_id
    ).first()

    if hr is None:
        raise HTTPException(
            status_code=401,
            detail="HR account not found"
        )

    return hr


def get_current_reviewer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        token_data = get_token_data(token)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    role = token_data.get("role")
    user_id = token_data.get("user_id")

    if role == "hr":
        hr = db.query(CompanyHR).filter(
            CompanyHR.hr_id == user_id
        ).first()
        if hr is None:
            raise HTTPException(
                status_code=401,
                detail="HR account not found"
            )
        return {
            "role": "hr",
            "user": hr,
            "company_id": hr.company_id
        }
    elif role == "admin":
        admin = db.query(Admin).filter(
            Admin.admin_id == user_id
        ).first()
        if admin is None:
            raise HTTPException(
                status_code=401,
                detail="Admin not found"
            )
        return {
            "role": "admin",
            "user": admin,
            "company_id": None
        }
    else:
        raise HTTPException(
            status_code=403,
            detail="Reviewer access required"
        )


ALLOWED_PROFICIENCY = {
    "Beginner",
    "Intermediate",
    "Advanced"
}

WITHDRAWABLE_STATUSES = {
    "Applied",
    "Shortlisted"
}

REVIEWER_STATUSES = {
    "Applied",
    "Shortlisted",
    "Selected",
    "Rejected"
}


def validate_proficiency(level: str):
    if level not in ALLOWED_PROFICIENCY:
        raise HTTPException(
            status_code=400,
            detail="Proficiency must be Beginner, Intermediate, or Advanced"
        )


def get_job_or_404(db: Session, job_id: int) -> Job:
    job = db.query(Job).filter(
        Job.job_id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return job


def ensure_can_manage_job(job: Job, reviewer: dict):
    if reviewer["role"] == "hr" and job.company_id != reviewer["company_id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only manage jobs for your own company"
        )


def evaluate_eligibility(db: Session, student: Student, job_id: int):
    criteria = db.query(EligibilityCriteria).filter(
        EligibilityCriteria.job_id == job_id
    ).first()

    if criteria is None:
        return None

    department_allowed = db.query(
        JobEligibleDepartment
    ).filter(
        JobEligibleDepartment.criteria_id == criteria.criteria_id,
        JobEligibleDepartment.department == student.department
    ).first()

    year_allowed = db.query(
        JobEligibleYear
    ).filter(
        JobEligibleYear.criteria_id == criteria.criteria_id,
        JobEligibleYear.year == student.year
    ).first()

    cgpa_allowed = student.cgpa >= criteria.minimum_cgpa

    return {
        "criteria": criteria,
        "eligible": (
            cgpa_allowed
            and department_allowed is not None
            and year_allowed is not None
        ),
        "cgpa_requirement_met": cgpa_allowed,
        "department_requirement_met": department_allowed is not None,
        "year_requirement_met": year_allowed is not None
    }


@app.get(
    "/students/me",
    response_model=StudentResponse
)
def get_current_student_profile(
    current_student: Student = Depends(get_current_student)
):
    return current_student


@app.get("/students", response_model=list[StudentResponse])
def get_students(
    db: Session = Depends(get_db)
):
    return db.query(Student).all()

@app.get("/admin/me")
def get_current_admin_profile(
    current_admin: Admin = Depends(get_current_admin)
):
    return {
        "admin_id": current_admin.admin_id,
        "name": current_admin.name,
        "email": current_admin.email
    }

@app.get("/students/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student

@app.put("/students/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    student.name = student_data.name
    student.email = student_data.email
    student.department = student_data.department
    student.year = student_data.year
    student.cgpa = student_data.cgpa

    db.commit()
    db.refresh(student)

    return student

@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    db.delete(student)
    db.commit()

    return {
        "message": "Student deleted successfully"
    }

@app.get("/jobs/{job_id}/required-skills")
def get_required_skills(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.job_id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    skills = (
        db.query(
            Skill.skill_id,
            Skill.skill_name,
            JobSkill.required_proficiency
        )
        .join(
            JobSkill,
            Skill.skill_id == JobSkill.skill_id
        )
        .filter(
            JobSkill.job_id == job_id
        )
        .all()
    )

    return {
        "job_id": job_id,
        "job_title": job.job_title,
        "required_skills": [
            {
                "skill_id": skill_id,
                "skill": skill_name,
                "required_proficiency": required_proficiency
            }
            for skill_id, skill_name, required_proficiency in skills
        ]
    }


@app.post("/skills", response_model=SkillResponse)
def create_skill(
    skill: SkillCreate,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    existing = db.query(Skill).filter(
        Skill.skill_name == skill.skill_name
    ).first()

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Skill already exists"
        )

    new_skill = Skill(
        skill_name=skill.skill_name,
        category=skill.category
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)

    return new_skill

@app.get("/skills", response_model=list[SkillResponse])
def get_skills(
    db: Session = Depends(get_db)
):
    return db.query(Skill).all()


@app.get("/skills/{skill_id}", response_model=SkillResponse)
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id
    ).first()

    if skill is None:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    return skill


@app.put("/skills/{skill_id}", response_model=SkillResponse)
def update_skill(
    skill_id: int,
    skill_data: SkillUpdate,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id
    ).first()

    if skill is None:
        raise HTTPException(
            status_code=404,
            detail="Skill not found")

    duplicate = db.query(Skill).filter(
        Skill.skill_name == skill_data.skill_name,
        Skill.skill_id != skill_id
    ).first()

    if duplicate is not None:
        raise HTTPException(
            status_code=409,
            detail="Skill already exists"
        )
    
    skill.skill_name = skill_data.skill_name
    skill.category = skill_data.category

    db.commit()
    db.refresh(skill)

    return skill

@app.delete("/skills/{skill_id}")
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id).first()

    if skill is None:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    student_skill = db.query(StudentSkill).filter(
        StudentSkill.skill_id == skill_id).first()

    project_skill = db.query(ProjectSkill).filter(
        ProjectSkill.skill_id == skill_id
    ).first()

    job_skill = db.query(JobSkill).filter(
        JobSkill.skill_id == skill_id
    ).first()

    if (
        student_skill is not None
        or project_skill is not None
        or job_skill is not None
    ):
        raise HTTPException(
            status_code=409,
            detail="Cannot delete skill because it is currently in use"
        )

    db.delete(skill)
    db.commit()

    return {
        "message": "Skill deleted successfully"
    }


@app.post("/students/{student_id}/skills/{skill_id}")
def add_skill_to_student(
    student_id: int,
    skill_id: int,
    skill_data: StudentSkillCreate,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id
    ).first()

    if skill is None:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    existing = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id,
        StudentSkill.skill_id == skill_id
    ).first()

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Student already has this skill"
        )

    student_skill = StudentSkill(
        student_id=student_id,
        skill_id=skill_id,
        proficiency_level=skill_data.proficiency_level
    )

    db.add(student_skill)
    db.commit()

    return {
        "message": "Skill added to student successfully"
    }


@app.get("/students/{student_id}/skills")
def get_student_skills(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    skills = (
        db.query(Skill, StudentSkill.proficiency_level)
        .join(
            StudentSkill,
            Skill.skill_id == StudentSkill.skill_id
        )
        .filter(
            StudentSkill.student_id == student_id
        )
        .all()
    )

    return [
        {
            "skill_id": skill.skill_id,
            "skill_name": skill.skill_name,
            "category": skill.category,
            "proficiency_level": proficiency
        }
        for skill, proficiency in skills
    ]


@app.put("/students/{student_id}/skills/{skill_id}")
def update_student_skill(
    student_id: int,
    skill_id: int,
    skill_data: StudentSkillCreate,
    db: Session = Depends(get_db)
):
    student_skill = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id,
        StudentSkill.skill_id == skill_id
    ).first()

    if student_skill is None:
        raise HTTPException(
            status_code=404,
            detail="Student skill not found"
        )

    student_skill.proficiency_level = (
        skill_data.proficiency_level
    )

    db.commit()

    return {
        "message": "Student skill updated successfully"
    }


@app.delete("/students/{student_id}/skills/{skill_id}")
def delete_student_skill(
    student_id: int,
    skill_id: int,
    db: Session = Depends(get_db)
):
    student_skill = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id,
        StudentSkill.skill_id == skill_id
    ).first()

    if student_skill is None:
        raise HTTPException(
            status_code=404,
            detail="Student skill not found"
        )

    db.delete(student_skill)
    db.commit()

    return {
        "message": "Student skill removed successfully"
    }


@app.post(
    "/students/{student_id}/projects",
    response_model=ProjectResponse
)
def create_project(
    student_id: int,
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    project = Project(
        student_id=student_id,
        project_name=project_data.project_name,
        description=project_data.description,
        project_link=project_data.project_link
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@app.get(
    "/students/{student_id}/projects",
    response_model=list[ProjectResponse]
)
def get_student_projects(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return db.query(Project).filter(
        Project.student_id == student_id
    ).all()


@app.get(
    "/projects/{project_id}",
    response_model=ProjectResponse
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


@app.get("/projects/{project_id}/skills")
def get_project_skills(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return (
        db.query(Skill)
        .join(ProjectSkill, Skill.skill_id == ProjectSkill.skill_id)
        .filter(ProjectSkill.project_id == project_id)
        .all()
    )


@app.put(
    "/projects/{project_id}",
    response_model=ProjectResponse
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    project.project_name = project_data.project_name
    project.description = project_data.description
    project.project_link = project_data.project_link

    db.commit()
    db.refresh(project)

    return project


@app.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    db.query(ProjectSkill).filter(
        ProjectSkill.project_id == project_id
    ).delete(
        synchronize_session=False
    )

    db.flush()
    db.delete(project)

    db.commit()

    return {
        "message": "Project deleted successfully"
    }


@app.post("/projects/{project_id}/skills/{skill_id}")
def add_skill_to_project(
    project_id: int,
    skill_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id
    ).first()

    if skill is None:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    existing = db.query(ProjectSkill).filter(
        ProjectSkill.project_id == project_id,
        ProjectSkill.skill_id == skill_id
    ).first()

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Skill already added to project"
        )

    project_skill = ProjectSkill(
        project_id=project_id,
        skill_id=skill_id
    )

    db.add(project_skill)
    db.commit()

    return {
        "message": "Skill added to project successfully"
    }


@app.delete("/projects/{project_id}/skills/{skill_id}")
def delete_project_skill(
    project_id: int,
    skill_id: int,
    db: Session = Depends(get_db)
):
    project_skill = db.query(ProjectSkill).filter(
        ProjectSkill.project_id == project_id,
        ProjectSkill.skill_id == skill_id
    ).first()

    if project_skill is None:
        raise HTTPException(
            status_code=404,
            detail="Project skill not found"
        )

    db.delete(project_skill)
    db.commit()

    return {
        "message": "Skill removed from project successfully"
    }


@app.post("/companies")
def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    company = Company(
        company_name=company_data.company_name,
        industry=company_data.industry,
        website=company_data.website
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return company


@app.get("/companies", response_model=list[CompanyResponse])
def get_companies(
    db: Session = Depends(get_db)
):
    return db.query(Company).all()


@app.get("/companies/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    return company


@app.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    company.company_name = company_data.company_name
    company.industry = company_data.industry
    company.website = company_data.website

    db.commit()
    db.refresh(company)

    return company


@app.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    jobs = db.query(Job).filter(
        Job.company_id == company_id
    ).first()

    if jobs is not None:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete company because it has jobs"
        )

    db.delete(company)
    db.commit()

    return {
        "message": "Company deleted successfully"
    }


@app.post(
    "/companies/{company_id}/jobs",
    response_model=JobResponse
)
def create_job(
    company_id: int,
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    job = Job(
        company_id=company_id,
        job_title=job_data.job_title,
        job_description=job_data.job_description,
        location=job_data.location,
        job_type=job_data.job_type,
        package=job_data.package,
        is_active=job_data.is_active
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@app.get("/jobs", response_model=list[JobResponse])
def get_jobs(
    db: Session = Depends(get_db)
):
    return db.query(Job).all()


@app.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.job_id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return job


@app.put("/jobs/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    job = get_job_or_404(db, job_id)
    ensure_can_manage_job(job, reviewer)

    job.job_title = job_data.job_title
    job.job_description = job_data.job_description
    job.location = job_data.location
    job.job_type = job_data.job_type
    job.package = job_data.package

    db.commit()
    db.refresh(job)

    return job


@app.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    job = get_job_or_404(db, job_id)
    ensure_can_manage_job(job, reviewer)

    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).first()

    if applications is not None:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete job because it has applications. Close the job instead so students can no longer apply."
        )

    job_skills = db.query(JobSkill).filter(
        JobSkill.job_id == job_id
    ).all()

    for job_skill in job_skills:
        db.delete(job_skill)

    criteria = db.query(EligibilityCriteria).filter(
        EligibilityCriteria.job_id == job_id
    ).first()

    if criteria is not None:

        departments = db.query(
            JobEligibleDepartment
        ).filter(
            JobEligibleDepartment.criteria_id == criteria.criteria_id
        ).all()

        for department in departments:
            db.delete(department)

        years = db.query(
            JobEligibleYear
        ).filter(
            JobEligibleYear.criteria_id == criteria.criteria_id
        ).all()

        for year in years:
            db.delete(year)

        db.delete(criteria)

    db.delete(job)
    db.commit()

    return {
        "message": "Job deleted successfully"
    }


@app.put("/jobs/{job_id}/status", response_model=JobResponse)
def update_job_status(
    job_id: int,
    status_data: JobStatusUpdate,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    job = get_job_or_404(db, job_id)
    ensure_can_manage_job(job, reviewer)

    job.is_active = status_data.is_active
    db.commit()
    db.refresh(job)

    return job


@app.post("/jobs/{job_id}/skills/{skill_id}")
def add_skill_to_job(
    job_id: int,
    skill_id: int,
    required_proficiency: str,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    job = get_job_or_404(db, job_id)
    ensure_can_manage_job(job, reviewer)
    validate_proficiency(required_proficiency)

    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id
    ).first()

    if skill is None:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    existing = db.query(JobSkill).filter(
        JobSkill.job_id == job_id,
        JobSkill.skill_id == skill_id
    ).first()

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Skill already required for this job"
        )

    job_skill = JobSkill(
        job_id=job_id,
        skill_id=skill_id,
        required_proficiency=required_proficiency
    )

    db.add(job_skill)
    db.commit()

    return {
        "message": "Skill added to job successfully"
    }


@app.put("/jobs/{job_id}/skills/{skill_id}")
def update_job_skill(
    job_id: int,
    skill_id: int,
    required_proficiency: str,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    job = get_job_or_404(db, job_id)
    ensure_can_manage_job(job, reviewer)
    validate_proficiency(required_proficiency)

    job_skill = db.query(JobSkill).filter(
        JobSkill.job_id == job_id,
        JobSkill.skill_id == skill_id
    ).first()

    if job_skill is None:
        raise HTTPException(
            status_code=404,
            detail="Job skill not found"
        )

    job_skill.required_proficiency = required_proficiency

    db.commit()

    return {
        "message": "Job skill updated successfully"
    }


@app.delete("/jobs/{job_id}/skills/{skill_id}")
def delete_job_skill(
    job_id: int,
    skill_id: int,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    job = get_job_or_404(db, job_id)
    ensure_can_manage_job(job, reviewer)

    job_skill = db.query(JobSkill).filter(
        JobSkill.job_id == job_id,
        JobSkill.skill_id == skill_id
    ).first()

    if job_skill is None:
        raise HTTPException(
            status_code=404,
            detail="Job skill not found"
        )

    db.delete(job_skill)
    db.commit()

    return {
        "message": "Skill removed from job successfully"
    }


@app.post(
    "/jobs/{job_id}/eligibility",
    response_model=EligibilityResponse
)
def create_eligibility(
    job_id: int,
    eligibility_data: EligibilityCreate,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    job = get_job_or_404(db, job_id)
    ensure_can_manage_job(job, reviewer)

    if eligibility_data.minimum_cgpa < 0:
        raise HTTPException(
            status_code=400,
            detail="Minimum CGPA cannot be negative"
        )

    if not eligibility_data.departments or not eligibility_data.years:
        raise HTTPException(
            status_code=400,
            detail="At least one eligible department and academic year are required"
        )

    existing = db.query(EligibilityCriteria).filter(
        EligibilityCriteria.job_id == job_id
    ).first()

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Eligibility criteria already exists for this job"
        )

    criteria = EligibilityCriteria(
        job_id=job_id,
        minimum_cgpa=eligibility_data.minimum_cgpa
    )

    db.add(criteria)
    db.commit()
    db.refresh(criteria)

    for department in eligibility_data.departments:
        db.add(
            JobEligibleDepartment(
                criteria_id=criteria.criteria_id,
                department=department
            )
        )

    for year in eligibility_data.years:
        db.add(
            JobEligibleYear(
                criteria_id=criteria.criteria_id,
                year=year
            )
        )

    db.commit()

    return criteria



@app.get("/jobs/{job_id}/eligibility")
def get_job_eligibility(
    job_id: int,
    db: Session = Depends(get_db)
):
    get_job_or_404(db, job_id)

    criteria = db.query(EligibilityCriteria).filter(
        EligibilityCriteria.job_id == job_id
    ).first()

    if criteria is None:
        raise HTTPException(
            status_code=404,
            detail="Eligibility criteria not found"
        )

    departments = db.query(JobEligibleDepartment.department).filter(
        JobEligibleDepartment.criteria_id == criteria.criteria_id
    ).all()
    years = db.query(JobEligibleYear.year).filter(
        JobEligibleYear.criteria_id == criteria.criteria_id
    ).all()

    return {
        "criteria_id": criteria.criteria_id,
        "job_id": criteria.job_id,
        "minimum_cgpa": criteria.minimum_cgpa,
        "departments": [department for department, in departments],
        "years": [year for year, in years]
    }


@app.put("/jobs/{job_id}/eligibility")
def update_job_eligibility(
    job_id: int,
    eligibility_data: EligibilityCreate,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    job = get_job_or_404(db, job_id)
    ensure_can_manage_job(job, reviewer)

    if eligibility_data.minimum_cgpa < 0:
        raise HTTPException(
            status_code=400,
            detail="Minimum CGPA cannot be negative"
        )

    if not eligibility_data.departments or not eligibility_data.years:
        raise HTTPException(
            status_code=400,
            detail="At least one eligible department and academic year are required"
        )

    criteria = db.query(EligibilityCriteria).filter(
        EligibilityCriteria.job_id == job_id
    ).first()

    if criteria is None:
        raise HTTPException(
            status_code=404,
            detail="Eligibility criteria not found"
        )

    criteria.minimum_cgpa = eligibility_data.minimum_cgpa
    db.query(JobEligibleDepartment).filter(
        JobEligibleDepartment.criteria_id == criteria.criteria_id
    ).delete(synchronize_session=False)
    db.query(JobEligibleYear).filter(
        JobEligibleYear.criteria_id == criteria.criteria_id
    ).delete(synchronize_session=False)

    for department in eligibility_data.departments:
        db.add(JobEligibleDepartment(
            criteria_id=criteria.criteria_id,
            department=department
        ))
    for year in eligibility_data.years:
        db.add(JobEligibleYear(
            criteria_id=criteria.criteria_id,
            year=year
        ))

    db.commit()
    db.refresh(criteria)

    return criteria


@app.get("/students/{student_id}/jobs/{job_id}/eligibility")
def check_eligibility(
    student_id: int,
    job_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    get_job_or_404(db, job_id)

    result = evaluate_eligibility(db, student, job_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Eligibility criteria not found"
        )

    return {
        "student_id": student_id,
        "job_id": job_id,
        "eligible": result["eligible"],
        "cgpa_requirement_met": result["cgpa_requirement_met"],
        "department_requirement_met": result["department_requirement_met"],
        "year_requirement_met": result["year_requirement_met"]
    }


@app.get("/students/{student_id}/jobs/{job_id}/skill-gap")
def get_skill_gap(
    student_id: int,
    job_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    job = db.query(Job).filter(
        Job.job_id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    proficiency_rank = {
        "Beginner": 1,
        "Intermediate": 2,
        "Advanced": 3
    }

    student_skill_data = (
        db.query(
            Skill,
            StudentSkill.proficiency_level
        )
        .join(
            StudentSkill,
            Skill.skill_id == StudentSkill.skill_id
        )
        .filter(
            StudentSkill.student_id == student_id
        )
        .all()
    )

    job_skill_data = (
        db.query(
            Skill,
            JobSkill.required_proficiency
        )
        .join(
            JobSkill,
            Skill.skill_id == JobSkill.skill_id
        )
        .filter(
            JobSkill.job_id == job_id
        )
        .all()
    )

    student_skills = {
        skill.skill_id: proficiency
        for skill, proficiency in student_skill_data
    }

    matched_skills = []
    insufficient_skills = []
    missing_skills = []

    for skill, required_proficiency in job_skill_data:

        if skill.skill_id not in student_skills:

            missing_skills.append({
                "skill": skill.skill_name,
                "required_proficiency": required_proficiency
            })

        else:

            student_proficiency = (
                student_skills[skill.skill_id]
            )

            if (
                proficiency_rank.get(student_proficiency, 0)
                >= proficiency_rank.get(required_proficiency, 0)
            ):

                matched_skills.append({
                    "skill": skill.skill_name,
                    "student_proficiency": student_proficiency,
                    "required_proficiency": required_proficiency
                })

            else:

                insufficient_skills.append({
                    "skill": skill.skill_name,
                    "student_proficiency": student_proficiency,
                    "required_proficiency": required_proficiency
                })

    return {
        "student_id": student_id,
        "job_id": job_id,
        "matched_skills": matched_skills,
        "insufficient_skills": insufficient_skills,
        "missing_skills": missing_skills
    }


@app.post(
    "/students/{student_id}/jobs/{job_id}/apply",
    response_model=ApplicationResponse
)
def apply_for_job(
    student_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    if current_student.student_id != student_id:
        raise HTTPException(
            status_code=403,
            detail="You can only apply using your own student account"
        )

    student = current_student
    job = get_job_or_404(db, job_id)

    if not job.is_active:
        raise HTTPException(
            status_code=409,
            detail="This job is closed and is no longer accepting applications"
        )

    eligibility = evaluate_eligibility(db, student, job_id)
    if eligibility is not None and not eligibility["eligible"]:
        raise HTTPException(
            status_code=403,
            detail="You do not meet the eligibility criteria for this job"
        )

    existing = db.query(Application).filter(
        Application.student_id == student_id,
        Application.job_id == job_id
    ).first()

    if existing is not None:
        if existing.application_status == "Withdrawn":
            raise HTTPException(
                status_code=409,
                detail="You previously withdrew your application for this job"
            )
        raise HTTPException(
            status_code=409,
            detail="Student has already applied for this job"
        )

    application = Application(
        student_id=student_id,
        job_id=job_id,
        application_date=date.today(),
        application_status="Applied"
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


@app.get(
    "/students/{student_id}/applications",
    response_model=list[ApplicationResponse]
)
def get_student_applications(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return db.query(Application).filter(
        Application.student_id == student_id
    ).all()


@app.post(
    "/students/{student_id}/applications/{application_id}/withdraw",
    response_model=ApplicationResponse
)
def withdraw_application(
    student_id: int,
    application_id: int,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    if current_student.student_id != student_id:
        raise HTTPException(
            status_code=403,
            detail="You can only withdraw your own applications"
        )

    application = db.query(Application).filter(
        Application.application_id == application_id,
        Application.student_id == student_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    if application.application_status not in WITHDRAWABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Only Applied or Shortlisted applications can be withdrawn"
        )

    application.application_status = "Withdrawn"
    db.commit()
    db.refresh(application)

    return application

@app.get(
    "/applications",
    response_model=list[ApplicationResponse]
)
def get_applications(
    db: Session = Depends(get_db)
):
    return db.query(Application).all()


@app.put(
    "/applications/{application_id}/status",
    response_model=ApplicationResponse
)
def update_application_status(
    application_id: int,
    status_data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer)
):
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    if application.application_status == "Withdrawn":
        raise HTTPException(
            status_code=400,
            detail="Withdrawn applications cannot be changed"
        )

    if status_data.application_status not in REVIEWER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    # If HR: ensure this application belongs to a job at their company
    if reviewer["role"] == "hr":
        job = db.query(Job).filter(Job.job_id == application.job_id).first()
        if not job or job.company_id != reviewer["company_id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only manage applications for your own company"
            )

    application.application_status = (
        status_data.application_status
    )

    db.commit()
    db.refresh(application)

    return application


@app.post("/login", response_model=TokenResponse)
def login(
    login_data: StudentLogin,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.email == login_data.email
    ).first()

    if student is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        student.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
    student.student_id,
    "student"
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.post("/admin/login", response_model=TokenResponse)
def admin_login(
    login_data: AdminLogin,
    db: Session = Depends(get_db)
):
    admin = db.query(Admin).filter(
        Admin.email == login_data.email
    ).first()

    if admin is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        admin.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        admin.admin_id,
        "admin"
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.post("/admin/setup")
def setup_first_admin(
    admin_data: AdminCreate,
    db: Session = Depends(get_db)
):
    if db.query(Admin).count() > 0:
        raise HTTPException(
            status_code=403,
            detail="An administrator already exists"
        )

    admin = Admin(
        name=admin_data.name,
        email=admin_data.email,
        password=hash_password(admin_data.password)
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "message": "Initial administrator created successfully",
        "admin_id": admin.admin_id
    }

@app.post("/admins")
def create_admin(
    admin_data: AdminCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    admin = Admin(
        name=admin_data.name,
        email=admin_data.email,
        password=hash_password(admin_data.password)
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "message": "Admin created successfully",
        "admin_id": admin.admin_id
    }

@app.get("/analytics/most-demanded-skills")
def most_demanded_skills(
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Skill.skill_name,
            func.count(JobSkill.job_id).label("job_count")
        )
        .join(
            JobSkill,
            Skill.skill_id == JobSkill.skill_id
        )
        .group_by(
            Skill.skill_id,
            Skill.skill_name
        )
        .order_by(
            func.count(JobSkill.job_id).desc()
        )
        .all()
    )

    return [
        {
            "skill_name": skill_name,
            "job_count": job_count
        }
        for skill_name, job_count in results
    ]

@app.get("/analytics/application-stats")
def application_statistics(
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Application.application_status,
            func.count(Application.application_id).label("count")
        )
        .group_by(
            Application.application_status
        )
        .all()
    )

    return [
        {
            "status": status,
            "count": count
        }
        for status, count in results
    ]

@app.get("/students/{student_id}/eligible-jobs")
def get_eligible_jobs(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    jobs = (
        db.query(Job)
        .join(
            EligibilityCriteria,
            Job.job_id == EligibilityCriteria.job_id
        )
        .join(
            JobEligibleDepartment,
            EligibilityCriteria.criteria_id ==
            JobEligibleDepartment.criteria_id
        )
        .join(
            JobEligibleYear,
            EligibilityCriteria.criteria_id ==
            JobEligibleYear.criteria_id
        )
        .filter(
            Job.is_active.is_(True),
            EligibilityCriteria.minimum_cgpa <= student.cgpa,
            JobEligibleDepartment.department == student.department,
            JobEligibleYear.year == student.year
        )
        .all()
    )

    return jobs


@app.post("/hr/register", response_model=TokenResponse)
def hr_register(
    hr_data: HRCreate,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(
        Company.company_id == hr_data.company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    existing = db.query(CompanyHR).filter(
        CompanyHR.email == hr_data.email
    ).first()

    if existing is not None:
        raise HTTPException(
            status_code=400,
            detail="An HR account with this email already exists"
        )

    new_hr = CompanyHR(
        company_id=hr_data.company_id,
        name=hr_data.name,
        email=hr_data.email,
        password=hash_password(hr_data.password)
    )

    db.add(new_hr)
    db.commit()
    db.refresh(new_hr)

    token = create_access_token(
        new_hr.hr_id,
        "hr"
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.post("/hr/login", response_model=TokenResponse)
def hr_login(
    login_data: HRLogin,
    db: Session = Depends(get_db)
):
    hr = db.query(CompanyHR).filter(
        CompanyHR.email == login_data.email
    ).first()

    if hr is None or not verify_password(login_data.password, hr.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        hr.hr_id,
        "hr"
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/hr/me")
def get_current_hr_profile(
    current_hr: CompanyHR = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(
        Company.company_id == current_hr.company_id
    ).first()

    return {
        "hr_id": current_hr.hr_id,
        "name": current_hr.name,
        "email": current_hr.email,
        "company_id": current_hr.company_id,
        "company_name": company.company_name if company else "Unknown Company"
    }


@app.get("/hr/jobs", response_model=list[JobResponse])
def get_hr_jobs(
    current_hr: CompanyHR = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    return db.query(Job).filter(
        Job.company_id == current_hr.company_id
    ).all()


@app.post("/hr/jobs", response_model=JobResponse)
def create_hr_job(
    job_data: JobCreate,
    current_hr: CompanyHR = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    job = Job(
        company_id=current_hr.company_id,
        job_title=job_data.job_title,
        job_description=job_data.job_description,
        location=job_data.location,
        job_type=job_data.job_type,
        package=job_data.package,
        is_active=job_data.is_active
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@app.get("/hr/applications")
def get_hr_applications(
    current_hr: CompanyHR = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    company_jobs = db.query(Job).filter(
        Job.company_id == current_hr.company_id
    ).all()

    job_ids = [j.job_id for j in company_jobs]
    if not job_ids:
        return []

    applications = db.query(Application).filter(
        Application.job_id.in_(job_ids)
    ).all()

    job_map = {j.job_id: j for j in company_jobs}
    student_ids = list(set(a.student_id for a in applications))
    students = db.query(Student).filter(
        Student.student_id.in_(student_ids)
    ).all()
    student_map = {s.student_id: s for s in students}

    results = []
    for app in applications:
        job = job_map.get(app.job_id)
        student = student_map.get(app.student_id)
        results.append({
            "application_id": app.application_id,
            "student_id": app.student_id,
            "job_id": app.job_id,
            "application_date": str(app.application_date),
            "application_status": app.application_status,
            "job_title": job.job_title if job else "Unknown Job",
            "student_name": student.name if student else "Unknown Candidate",
            "student_email": student.email if student else "",
            "student_department": student.department if student else "",
            "student_year": student.year if student else None,
            "student_cgpa": student.cgpa if student else None
        })

    return results


@app.get("/companies/{company_id}/hr")
def get_company_hrs(
    company_id: int,
    db: Session = Depends(get_db)
):
    hrs = db.query(CompanyHR).filter(
        CompanyHR.company_id == company_id
    ).all()

    return [
        {
            "hr_id": h.hr_id,
            "name": h.name,
            "email": h.email,
            "company_id": h.company_id
        }
        for h in hrs
    ]


@app.post("/companies/{company_id}/hr")
def add_company_hr(
    company_id: int,
    hr_data: AdminCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    existing = db.query(CompanyHR).filter(
        CompanyHR.email == hr_data.email
    ).first()

    if existing is not None:
        raise HTTPException(
            status_code=400,
            detail="An HR account with this email already exists"
        )

    new_hr = CompanyHR(
        company_id=company_id,
        name=hr_data.name,
        email=hr_data.email,
        password=hash_password(hr_data.password)
    )

    db.add(new_hr)
    db.commit()
    db.refresh(new_hr)

    return {
        "message": "Company HR created successfully",
        "hr_id": new_hr.hr_id
    }


