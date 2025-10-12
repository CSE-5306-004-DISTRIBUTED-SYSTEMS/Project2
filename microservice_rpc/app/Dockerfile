FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY ./requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

# Copy source code
COPY . .

# Expose both ports for primary and backup servers
EXPOSE 50051 50052

# Default command (can be overridden in docker-compose)
CMD ["python", "primary_server.py"]