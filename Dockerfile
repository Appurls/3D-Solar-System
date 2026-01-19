FROM python:3.11-slim

WORKDIR /app

# System deps (optional but common)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# ---- CHANGE THIS to your actual app entrypoint ----
# Example: if you have app.py with `app = Flask(__name__)`:
# CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

