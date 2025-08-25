from fastapi import FastAPI

app = FastAPI()

@app.get('/')
def read_root():
    return {"message": "Market Management System API is running."}
