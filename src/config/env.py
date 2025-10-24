from functools import cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=('.env.example', '.env'),
        env_file_encoding='utf-8',
        env_nested_delimiter='__',
        case_sensitive=False,
        extra='ignore',
    )

    secret_key: str = ''
    debug: bool = False


@cache
def get_app_settings() -> AppSettings:
    return AppSettings()
