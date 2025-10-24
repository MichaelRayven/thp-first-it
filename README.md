# Тестовое задание для "Первая IT-компания"

## Локальная разработка

### Установка uv (менеджер пакетов)

```bash
pip install uv
```

### Настройка окружения

```bash
uv venv --python 3.13
uv sync
```

### Commands

```bash
# Запуск pre-commit hook
uv run poe lint

# Запуск локального сервера
uv run poe run_server

# Запуск комманд с помощью manage.py
uv run poe manage_py

# Сгенерировать миграции
uv run poe make_migrations

# Применить миграции
uv run poe migrate
```
