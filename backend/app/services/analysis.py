import json
from datetime import datetime

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import AnalysisStatus, GeneratedEvaluation, GitHubRepository, LeetCodeSnapshot, ProfileSection, User
from app.services.scoring import github_quality_signals, leetcode_signals, profile_signals


ANALYSIS_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "skill_model": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "code_quality": {"type": "string"},
                "delivery": {"type": "string"},
                "algorithms": {"type": "string"},
            },
            "required": ["code_quality", "delivery", "algorithms"],
        },
        "strengths": {"type": "array", "items": {"type": "string"}},
        "growth_areas": {"type": "array", "items": {"type": "string"}},
        "project_complexity_notes": {"type": "array", "items": {"type": "string"}},
        "evidence_highlights": {"type": "array", "items": {"type": "string"}},
        "recruiter_copy": {"type": "string"},
    },
    "required": [
        "summary",
        "skill_model",
        "strengths",
        "growth_areas",
        "project_complexity_notes",
        "evidence_highlights",
        "recruiter_copy",
    ],
}


def build_analysis_payload(
    user: User,
    repositories: list[GitHubRepository],
    leetcode: LeetCodeSnapshot | None,
    sections: list[ProfileSection],
) -> dict:
    return {
        "profile": {"name": user.name, "headline": user.headline},
        "github": github_quality_signals(repositories),
        "leetcode": leetcode_signals(leetcode),
        "sections": [
            {
                "kind": section.kind,
                "title": section.title,
                "organization": section.organization,
                "description": section.description,
            }
            for section in sections
        ],
        "manual_profile": profile_signals(sections),
    }


def fallback_analysis(payload: dict) -> dict:
    github = payload["github"]
    leetcode = payload["leetcode"]
    languages = ", ".join(github.get("languages") or ["their active stack"])
    solved = leetcode.get("total_solved", 0) if leetcode.get("available") else 0
    return {
        "summary": (
            f"This developer shows {github['project_complexity']} project maturity across "
            f"{github['repository_count']} repositories, with visible work in {languages}."
        ),
        "skill_model": {
            "code_quality": "Needs repository-level review for a deeper signal.",
            "delivery": "Estimated from repository activity and project count.",
            "algorithms": f"{solved} LeetCode problems solved." if solved else "No LeetCode data connected yet.",
        },
        "strengths": [
            "Maintains a public body of project work.",
            "Combines source data with self-reported education, experience, and achievements.",
        ],
        "growth_areas": [
            "Add more project descriptions and outcomes for stronger reviewer context.",
            "Refresh coding challenge data after major practice milestones.",
        ],
        "project_complexity_notes": [
            f"Current complexity signal is {github['project_complexity']} based on repositories, stars, forks, and language spread."
        ],
        "evidence_highlights": [
            f"{github['repository_count']} GitHub repositories analyzed.",
            f"{github['stars']} total GitHub stars observed.",
            f"{solved} LeetCode problems solved." if solved else "LeetCode source has not contributed solved-count evidence yet.",
        ],
        "recruiter_copy": (
            "A developer profile backed by connected GitHub activity, coding challenge progress, "
            "and reviewed career history."
        ),
    }


def generate_with_openai(payload: dict) -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        return fallback_analysis(payload)

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.responses.create(
        model=settings.openai_model,
        instructions=(
            "You analyze developer evidence for a resume-replacement profile. "
            "Be specific, evidence-backed, and avoid claiming facts not present in the payload."
        ),
        input=f"Return a JSON object matching the provided schema for this developer evidence:\n{json.dumps(payload)}",
        text={
            "format": {
                "type": "json_schema",
                "name": "adpt_developer_evaluation",
                "schema": ANALYSIS_SCHEMA,
                "strict": True,
            }
        },
    )
    return json.loads(response.output_text)


def run_analysis(db: Session, user: User, evaluation: GeneratedEvaluation) -> GeneratedEvaluation:
    evaluation.status = AnalysisStatus.running
    evaluation.updated_at = datetime.utcnow()
    db.commit()

    try:
        repositories = db.query(GitHubRepository).filter(GitHubRepository.user_id == user.id).all()
        leetcode = (
            db.query(LeetCodeSnapshot)
            .filter(LeetCodeSnapshot.user_id == user.id)
            .order_by(LeetCodeSnapshot.created_at.desc())
            .first()
        )
        sections = db.query(ProfileSection).filter(ProfileSection.user_id == user.id).order_by(ProfileSection.order).all()
        payload = build_analysis_payload(user, repositories, leetcode, sections)
        generated = generate_with_openai(payload)

        evaluation.status = AnalysisStatus.ready
        evaluation.summary = generated["summary"]
        evaluation.skill_model = generated["skill_model"]
        evaluation.strengths = generated["strengths"]
        evaluation.growth_areas = generated["growth_areas"]
        evaluation.project_complexity_notes = generated["project_complexity_notes"]
        evaluation.evidence_highlights = generated["evidence_highlights"]
        evaluation.recruiter_copy = generated["recruiter_copy"]
        evaluation.error = None
    except Exception as exc:  # pragma: no cover - exercised by integration tests with service mocks
        evaluation.status = AnalysisStatus.failed
        evaluation.error = str(exc)

    evaluation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(evaluation)
    return evaluation
