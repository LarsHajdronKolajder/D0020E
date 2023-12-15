from flask import Flask
from users import routes
from users import app

@app.route('/')
def home():
    return "login"

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=107)