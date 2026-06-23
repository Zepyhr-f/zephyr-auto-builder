from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "hermes-orchestrator-backend"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/hermes_orchestrator"
    hermes_base_url: str = "http://localhost:8081"
    hermes_api_key: str = ""
    worker_interval: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
