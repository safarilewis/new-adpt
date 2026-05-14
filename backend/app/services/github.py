from datetime import datetime
from email.utils import parsedate_to_datetime

import httpx
from sqlalchemy.orm import Session

from app.models import ConnectedAccount, GitHubRepository, SourceKind, User


GITHUB_API = "https://api.github.com"


def parse_github_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)


async def fetch_github_repositories(username: str, access_token: str | None = None) -> list[dict]:
    headers = {"Accept": "application/vnd.github+json"}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            f"{GITHUB_API}/users/{username}/repos",
            params={"sort": "pushed", "per_page": 50},
            headers=headers,
        )
        response.raise_for_status()
        return response.json()


async def sync_github(db: Session, user: User, username: str, access_token: str | None = None) -> ConnectedAccount:
    repos = await fetch_github_repositories(username, access_token)
    account = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == user.id, ConnectedAccount.kind == SourceKind.github)
        .one_or_none()
    )
    if not account:
        account = ConnectedAccount(user_id=user.id, kind=SourceKind.github, external_username=username)
        db.add(account)

    account.external_username = username
    account.access_token = access_token
    account.raw_snapshot = {"repository_count": len(repos), "synced_from": "github"}
    account.last_synced_at = datetime.utcnow()

    for repo in repos:
        full_name = repo["full_name"]
        record = (
            db.query(GitHubRepository)
            .filter(GitHubRepository.user_id == user.id, GitHubRepository.full_name == full_name)
            .one_or_none()
        )
        if not record:
            record = GitHubRepository(user_id=user.id, full_name=full_name)
            db.add(record)
        record.description = repo.get("description")
        record.language = repo.get("language")
        record.stars = repo.get("stargazers_count") or 0
        record.forks = repo.get("forks_count") or 0
        record.open_issues = repo.get("open_issues_count") or 0
        record.pushed_at = parse_github_datetime(repo.get("pushed_at"))
        record.raw = repo

    db.commit()
    db.refresh(account)
    return account


def delete_github_source(db: Session, user: User) -> None:
    db.query(GitHubRepository).filter(GitHubRepository.user_id == user.id).delete()
    db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == user.id,
        ConnectedAccount.kind == SourceKind.github,
    ).delete()
    db.commit()

