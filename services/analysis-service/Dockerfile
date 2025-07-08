FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5002

# Command to run the application
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5002"]
