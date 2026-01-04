FROM python:3.10-slim

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN if [ -f "backend/requirements.txt" ]; then pip install --no-cache-dir -r backend/requirements.txt; else pip install --no-cache-dir -r requirements.txt; fi

# Run with PYTHONPATH fix
CMD ["sh", "-c", "if [ -d 'backend' ]; then export PYTHONPATH=$PYTHONPATH:/app/backend && uvicorn backend.main:app --host 0.0.0.0 --port 7860; else uvicorn main:app --host 0.0.0.0 --port 7860; fi"]
