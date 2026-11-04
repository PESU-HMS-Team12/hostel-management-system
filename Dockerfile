# Multi-stage production Dockerfile for Hostel Management System (HMS)
FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app/

# Create non-root system user for security
RUN groupadd -r hmsgroup && useradd -r -g hmsgroup -d /app -s /sbin/nologin hmsuser && \
    mkdir -p /app/staticfiles && \
    chown -R hmsuser:hmsgroup /app

USER hmsuser

# Collect static files into staticfiles directory
RUN python manage.py collectstatic --noinput

# Expose HTTP port
EXPOSE 8000

# Container healthcheck using health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/ || exit 1

# Production WSGI server
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
