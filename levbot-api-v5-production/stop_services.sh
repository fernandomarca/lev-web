#!/bin/bash

# Find and kill Redis process
redis_pid=$(pgrep redis-server)
if [ -n "$redis_pid" ]; then
  echo "Stopping Redis (PID: $redis_pid)..."
  kill $redis_pid
fi

# Find and kill Celery worker processes
celery_pids=$(pgrep -f "celery -A utils.celery_app worker")
if [ -n "$celery_pids" ]; then
  echo "Stopping Celery workers (PIDs: $celery_pids)..."
  kill $celery_pids
fi

# Find and kill Uvicorn processes
uvicorn_pids=$(pgrep -f "uvicorn main:app")
if [ -n "$uvicorn_pids" ]; then
  echo "Stopping Uvicorn (PIDs: $uvicorn_pids)..."
  kill -9 $uvicorn_pids
fi

# Find and kill Gunicorn processes forcefully
gunicorn_pids=$(pgrep -f "gunicorn main:app") 
if [ -n "$gunicorn_pids" ]; then
  echo "Forcefully stopping Gunicorn (PIDs: $gunicorn_pids)..."
  kill -9 $gunicorn_pids  # Send SIGKILL to forcefully stop Gunicorn
fi

pids=$(fuser 8000/tcp 2>/dev/null)
if [ -n "$pids" ]; then
  echo "Stopping services on port 8000 (PIDs: $pids)..."
  kill -9 $pids
fi

# ps aux | grep 'uvicorn' | grep -v grep | awk '{print $2}' | xargs kill -9

echo "All processes stopped."