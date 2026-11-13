FROM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/requirements.lock /app/backend/requirements.lock
RUN pip install --no-cache-dir -r /app/backend/requirements.lock
COPY backend /app/backend
COPY --from=frontend /build/dist /app/frontend/dist
RUN useradd --create-home dekanat
USER dekanat
WORKDIR /app/backend
EXPOSE 8000
CMD ["python", "-m", "app.bootstrap"]
