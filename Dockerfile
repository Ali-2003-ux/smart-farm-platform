FROM python:3.10-slim

WORKDIR /app

# Copy everything (handles both Folder upload and Flat upload)
COPY . .

# Install dependencies identifying where requirements.txt is
RUN if [ -f "backend/requirements.txt" ]; then pip install --no-cache-dir -r backend/requirements.txt; else pip install --no-cache-dir -r requirements.txt; fi

# Run the app checking if backend folder exists or if it's flat
CMD ["sh", "-c", "if [ -d 'backend' ]; then uvicorn backend.main:app --host 0.0.0.0 --port 7860; else uvicorn main:app --host 0.0.0.0 --port 7860; fi"]
