from fastapi import APIRouter
from app.api.routes.workflows import router as workflows_router
from app.api.routes.steps import router as steps_router
from app.api.routes.rules import router as rules_router
from app.api.routes.executions import router as executions_router

router = APIRouter()
router.include_router(workflows_router, prefix="/workflows", tags=["workflows"])
router.include_router(steps_router, tags=["steps"])
router.include_router(rules_router, tags=["rules"])
router.include_router(executions_router, tags=["executions"])
