from datetime import datetime, timedelta

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.models import ConnectedAccount


def free_tier_refresh_days() -> int:
    return max(0, get_settings().free_tier_refresh_days)


def next_free_tier_refresh_at(account: ConnectedAccount) -> datetime | None:
    if not account.last_synced_at:
        return None
    return account.last_synced_at + timedelta(days=free_tier_refresh_days())


def assert_free_tier_refresh_allowed(account: ConnectedAccount | None) -> None:
    if not account or not account.last_synced_at:
        return

    next_refresh_at = next_free_tier_refresh_at(account)
    if next_refresh_at and datetime.utcnow() < next_refresh_at:
        days = free_tier_refresh_days()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": f"Free tier profiles can refresh once every {days} days.",
                "next_refresh_at": next_refresh_at.isoformat(),
                "refresh_interval_days": days,
            },
        )
