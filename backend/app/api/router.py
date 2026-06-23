from fastapi import APIRouter

from app.api.routes.approvals import router as approvals_router
from app.api.routes.plans import router as plans_router
from app.api.routes.system import router as system_router
from app.api.routes.tasks import router as tasks_router

api_router = APIRouter()
api_router.include_router(tasks_router)
api_router.include_router(approvals_router)
api_router.include_router(plans_router)
api_router.include_router(system_router)
