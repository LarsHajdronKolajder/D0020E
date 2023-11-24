FROM python

WORKDIR /app
COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY . .
EXPOSE 5000
ENV DATABASE_URL="mongodb://mongodb:27017/"

CMD ["python3", "app.py"]