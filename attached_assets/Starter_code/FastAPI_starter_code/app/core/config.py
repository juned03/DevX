from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Insurance API"
    database_url: str = "sqlite:///./dev.sqlite3"

    class Config:
        env_prefix = ""
        env_file = ".env"

settings = Settings()


