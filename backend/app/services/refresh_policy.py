from datetime import datetime, timedelta

from fastapi import HTTPException, status

from app.models import ConnectedAccount

FREE_TIER_REFRESH_DAYS = 14


def next_free_tier_refresh_at(account: ConnectedAccount) -> datetime | None:
    if not account.last_synced_at:
        return None
    return account.last_synced_at + timedelta(days=FREE_TIER_REFRESH_DAYS)


def assert_free_tier_refresh_allowed(account: ConnectedAccount | None) -> None:
    if not account or not account.last_synced_at:
        return

    next_refresh_at = next_free_tier_refresh_at(account)
    if next_refresh_at and datetime.utcnow() < next_refresh_at:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Free tier profiles can refresh once every 14 days.",
                "next_refresh_at": next_refresh_at.isoformat(),
            },
        )

