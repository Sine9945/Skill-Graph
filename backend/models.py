from datetime import date

from sqlalchemy import String, Integer, Float, ForeignKey, UniqueConstraint, Date, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Student(Base):
    __tablename__ = "student"

    student_id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False
    )

    password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    department: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    cgpa: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )


class Skill(Base):
    __tablename__ = "skill"

    skill_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    skill_name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )


class StudentSkill(Base):
    __tablename__ = "student_skill"

    student_id: Mapped[int] = mapped_column(
        ForeignKey("student.student_id"),
        primary_key=True
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skill.skill_id"),
        primary_key=True
    )

    proficiency_level: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )


class Project(Base):
    __tablename__ = "project"

    project_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("student.student_id"),
        nullable=False
    )

    project_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    project_link: Mapped[str] = mapped_column(
        String(300),
        nullable=False
    )


class ProjectSkill(Base):
    __tablename__ = "project_skill"

    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.project_id"),
        primary_key=True
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skill.skill_id"),
        primary_key=True
    )


class Company(Base):
    __tablename__ = "company"

    company_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    company_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    website: Mapped[str] = mapped_column(
        String(300),
        nullable=False
    )


class Job(Base):
    __tablename__ = "job"

    job_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    company_id: Mapped[int] = mapped_column(
        ForeignKey("company.company_id"),
        nullable=False
    )

    job_title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    job_description: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    location: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    job_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    package: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )


class JobSkill(Base):
    __tablename__ = "job_skill"

    job_id: Mapped[int] = mapped_column(
        ForeignKey("job.job_id"),
        primary_key=True
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skill.skill_id"),
        primary_key=True
    )

    required_proficiency: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )


class EligibilityCriteria(Base):
    __tablename__ = "eligibility_criteria"

    criteria_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    job_id: Mapped[int] = mapped_column(
        ForeignKey("job.job_id"),
        unique=True,
        nullable=False
    )

    minimum_cgpa: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )


class JobEligibleDepartment(Base):
    __tablename__ = "job_eligible_department"

    criteria_id: Mapped[int] = mapped_column(
        ForeignKey("eligibility_criteria.criteria_id"),
        primary_key=True
    )

    department: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )


class JobEligibleYear(Base):
    __tablename__ = "job_eligible_year"

    criteria_id: Mapped[int] = mapped_column(
        ForeignKey("eligibility_criteria.criteria_id"),
        primary_key=True
    )

    year: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )


class Application(Base):
    __tablename__ = "application"

    application_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("student.student_id"),
        nullable=False
    )

    job_id: Mapped[int] = mapped_column(
        ForeignKey("job.job_id"),
        nullable=False
    )

    application_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    application_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "job_id"
        ),
    )


class Admin(Base):
    __tablename__ = "admin"

    admin_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False
    )

    password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )


class CompanyHR(Base):
    __tablename__ = "company_hr"

    hr_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    company_id: Mapped[int] = mapped_column(
        ForeignKey("company.company_id"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False
    )

    password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
