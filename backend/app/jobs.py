from sqlalchemy.orm import Session

from app.models import GeneratedEvaluation, User
from app.services.analysis import run_analysis
from app.services.github import sync_github
from app.services.leetcode import sync_leetcode


async def refresh_github_source(db: Session, user: User, username: str, access_token: str | None = None) -> None:
    await sync_github(db, user, username, access_token)


async def refresh_leetcode_source(db: Session, user: User, username: str) -> None:
    await sync_leetcode(db, user, username)


def generate_profile_evaluation(db: Session, user: User, evaluation: GeneratedEvaluation) -> GeneratedEvaluation:
    return run_analysis(db, user, evaluation)

