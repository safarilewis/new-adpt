from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from app.models import ConnectedAccount, LeetCodeSnapshot, SourceKind, User


LEETCODE_GRAPHQL = "https://leetcode.com/graphql"


async def fetch_leetcode_profile(username: str) -> dict:
    query = """
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
    """
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(LEETCODE_GRAPHQL, json={"query": query, "variables": {"username": username}})
        response.raise_for_status()
        payload = response.json()
    matched = payload.get("data", {}).get("matchedUser")
    if not matched:
        raise ValueError("LeetCode username was not found")
    return matched


def counts_by_difficulty(profile: dict) -> dict[str, int]:
    rows = profile.get("submitStats", {}).get("acSubmissionNum", [])
    return {row["difficulty"].lower(): row.get("count", 0) for row in rows}


async def sync_leetcode(db: Session, user: User, username: str) -> LeetCodeSnapshot:
    profile = await fetch_leetcode_profile(username)
    counts = counts_by_difficulty(profile)
    snapshot = LeetCodeSnapshot(
        user_id=user.id,
        username=username,
        total_solved=counts.get("all", 0),
        easy_solved=counts.get("easy", 0),
        medium_solved=counts.get("medium", 0),
        hard_solved=counts.get("hard", 0),
        ranking=profile.get("profile", {}).get("ranking"),
        raw=profile,
    )
    account = (
        db.query(ConnectedAccount)
        .filter(ConnectedAccount.user_id == user.id, ConnectedAccount.kind == SourceKind.leetcode)
        .one_or_none()
    )
    if not account:
        account = ConnectedAccount(user_id=user.id, kind=SourceKind.leetcode, external_username=username)
        db.add(account)
    account.external_username = username
    account.raw_snapshot = profile
    account.last_synced_at = datetime.utcnow()
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot


def delete_leetcode_source(db: Session, user: User) -> None:
    db.query(LeetCodeSnapshot).filter(LeetCodeSnapshot.user_id == user.id).delete()
    db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == user.id,
        ConnectedAccount.kind == SourceKind.leetcode,
    ).delete()
    db.commit()

