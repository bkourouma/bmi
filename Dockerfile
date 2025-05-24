# ────────────── Stage 1: Build React Frontend ──────────────
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app/frontend

# Copy package files for better Docker layer caching
COPY webUi/front/package.json webUi/front/package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY webUi/front ./

# Build the React application
RUN npm run build

# ───────────── Stage 2: Build FastAPI Backend + Serve Static ─────────────
FROM python:3.10-slim AS production

# Set working directory
WORKDIR /app

# Install system dependencies for better compatibility
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy FastAPI application code
COPY . .

# Copy the built React frontend from previous stage
COPY --from=frontend-builder /app/frontend/build ./static

# Create necessary directories with proper permissions
RUN mkdir -p /home/data /app/docs /app/chroma_db /app/templates \
    && chmod 755 /home/data /app/docs /app/chroma_db

# Create non-root user for security
RUN adduser --disabled-password --gecos '' --uid 1000 appuser \
    && chown -R appuser:appuser /app /home/data

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Create entrypoint script for better startup handling
RUN printf '#!/bin/sh\n' > /entrypoint.sh \
    && printf 'echo "Starting BMI Chatbot Application..."\n' >> /entrypoint.sh \
    && printf 'mkdir -p /home/data\n' >> /entrypoint.sh \
    && printf 'exec uvicorn app:app --host 0.0.0.0 --port "$PORT"\n' >> /entrypoint.sh \
    && chmod +x /entrypoint.sh

# Use the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
