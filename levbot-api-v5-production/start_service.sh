#!/bin/bash

# redis-server &  # Start Redis in the background

# sleep 5  # Wait for Redis to start

# Start Celery worker
# celery -A utils.celery_app worker -E --concurrency=4 --loglevel=INFO --optimization=fair -f "celery.log" &

# Start Uvicorn server
# uvicorn main:app --timeout-keep-alive 15 --host 127.0.0.1 --port 8000 --workers 16 --log-level info &
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 16 --log-level info &

# gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000 --timeout 360 --workers 16 --access-logfile - --error-logfile - --log-level info &

echo "Redis, Celery, and Uvicorn started in the background."