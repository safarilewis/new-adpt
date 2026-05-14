from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_user
from app.db import get_db
from app.models import AnalysisStatus, GeneratedEvaluation, User
from app.schemas import EvaluationOut
from app.services.analysis import run_analysis

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/latest", response_model=EvaluationOut | None)
def latest_analysis(db: Session = Depends(get_db), user: User = Depends(require_user)) -> GeneratedEvaluation | None:
    return (
        db.query(GeneratedEvaluation)
        .filter(GeneratedEvaluation.user_id == user.id)
        .order_by(GeneratedEvaluation.created_at.desc())
        .first()
    )


@router.post("", response_model=EvaluationOut, status_code=201)
def create_analysis(db: Session = Depends(get_db), user: User = Depends(require_user)) -> GeneratedEvaluation:
    evaluation = GeneratedEvaluation(user_id=user.id, status=AnalysisStatus.queued)
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return run_analysis(db, user, evaluation)


@router.post("/{evaluation_id}/review", response_model=EvaluationOut)
def mark_reviewed(
    evaluation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> GeneratedEvaluation:
    evaluation = db.get(GeneratedEvaluation, evaluation_id)
    if not evaluation or evaluation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    if evaluation.status != AnalysisStatus.ready:
        raise HTTPException(status_code=409, detail="Only ready evaluations can be reviewed")
    evaluation.reviewed = True
    db.commit()
    db.refresh(evaluation)
    return evaluation


@router.post("/publish", response_model=dict)
def publish_profile(db: Session = Depends(get_db), user: User = Depends(require_user)) -> dict:
    evaluation = (
        db.query(GeneratedEvaluation)
        .filter(GeneratedEvaluation.user_id == user.id, GeneratedEvaluation.reviewed.is_(True))
        .order_by(GeneratedEvaluation.created_at.desc())
        .first()
    )
    if not evaluation:
        raise HTTPException(status_code=409, detail="Review an analysis before publishing")
    user.published = True
    db.commit()
    return {"published": True, "slug": user.slug}


@router.post("/unpublish", response_model=dict)
def unpublish_profile(db: Session = Depends(get_db), user: User = Depends(require_user)) -> dict:
    user.published = False
    db.commit()
    return {"published": False, "slug": user.slug}

