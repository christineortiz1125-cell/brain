#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Error: backend/.env not found. Copy .env.example and fill in your keys."
  exit 1
fi

export $(grep -v '^#' .env | xargs)

echo "Starting Brain backend on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
