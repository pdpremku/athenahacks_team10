from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
import google.generativeai as genai
import os
import json

load_dotenv()

app = FastAPI()

# allows your frontend to talk to the backend
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# connect to MongoDB
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["club-matcher"]
clubs_collection = db["clubs"]

# connect to Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

@app.post("/match")
async def match_clubs(user: dict):
    # get all clubs from MongoDB
    clubs = list(clubs_collection.find({}, {"_id": 0}))
    
    prompt = f"""
    Student profile: {user}
    Available clubs: {clubs}
    
    Return the top 5 matching clubs as a JSON array with fields:
    name, reason, match (high or medium)
    Return ONLY the JSON, no extra text.
    """
    
    response = model.generate_content(prompt)
    matches = json.loads(response.text)
    return {"matches": matches}