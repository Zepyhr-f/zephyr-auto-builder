from __future__ import annotations

import logging

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()

    app = FastAPI(title=settings.app_name)
    from app.api.routes.health import router as health_router
    app.include_router(health_router)
    app.include_router(api_router, prefix=settings.api_prefix)

    @app.on_event("startup")
    async def start_workers():
        import asyncio
        from app.workers.planning_worker import worker_loop
        app.state.worker_task = asyncio.create_task(worker_loop())
        logger.info("background worker loop started")

    @app.on_event("shutdown")
    async def stop_workers():
        task = getattr(app.state, "worker_task", None)
        if task:
            task.cancel()
            logger.info("background worker loop stopped")

    return app


app = create_app()
