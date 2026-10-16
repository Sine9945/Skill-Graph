from pydantic import BaseModel, ConfigDict
from datetime import date

class StudentCreate(BaseModel):
    name: str
    email: str
    password: str
    department: str
    year: int
    cgpa: float


class StudentResponse(BaseModel):
    student_id: int
    name: str
    email: str
    department: str
    year: int
    cgpa: float

    model_config = ConfigDict(from_attributes=True)


class StudentUpdate(BaseModel):
    name: str
    email: str
    department: str
    year: int
    cgpa: float


class SkillCreate(BaseModel):
    skill_name: str
    category: str


class SkillResponse(BaseModel):
    skill_id: int
    skill_name: str
    category: str

    model_config = ConfigDict(from_attributes=True)


class SkillUpdate(BaseModel):
    skill_name: str
    category: str


class StudentSkillCreate(BaseModel):
    proficiency_level: str


class ProjectCreate(BaseModel):
    project_name: str
    description: str
    project_link: str


class ProjectResponse(BaseModel):
    project_id: int
    student_id: int
    project_name: str
    description: str
    project_link: str

    model_config = ConfigDict(from_attributes=True)


class ProjectUpdate(BaseModel):
    project_name: str
    description: str
    project_link: str


class CompanyCreate(BaseModel):
    company_name: str
    industry: str
    website: str


class CompanyResponse(BaseModel):
    company_id: int
    company_name: str
    industry: str
    website: str

    model_config = ConfigDict(from_attributes=True)


class CompanyUpdate(BaseModel):
    company_name: str
    industry: str
    website: str


class JobCreate(BaseModel):
    job_title: str
    job_description: str
    location: str
    job_type: str
    package: float
    is_active: bool = True


class JobResponse(BaseModel):
    job_id: int
    company_id: int
    job_title: str
    job_description: str
    location: str
    job_type: str
    package: float
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class JobUpdate(BaseModel):
    job_title: str
    job_description: str
    location: str
    job_type: str
    package: float


class JobStatusUpdate(BaseModel):
    is_active: bool


class EligibilityCreate(BaseModel):
    minimum_cgpa: float
    departments: list[str]
    years: list[int]


class EligibilityResponse(BaseModel):
    criteria_id: int
    job_id: int
    minimum_cgpa: float

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    application_id: int
    student_id: int
    job_id: int
    application_date: date
    application_status: str

    model_config = ConfigDict(from_attributes=True)


class ApplicationStatusUpdate(BaseModel):
    application_status: str

class StudentLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminCreate(BaseModel):
    name: str
    email: str
    password: str


class HRCreate(BaseModel):
    name: str
    email: str
    password: str
    company_id: int


class HRResponse(BaseModel):
    hr_id: int
    company_id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class HRLogin(BaseModel):
    email: str
    password: str