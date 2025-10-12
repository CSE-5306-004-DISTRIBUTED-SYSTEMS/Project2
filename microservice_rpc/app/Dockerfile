## Dockerfile 
FROM python:3.10-slim
WORKDIR /app
## copy python package
COPY ./requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

## copy source ode
COPY . .

## expose 50051 and 50052 for backup server
# EXPOSE 50051
EXPOSE 50052
## run server first
# CMD ["python", "primary_server.py"]
CMD ["python", "backup_server.py"]