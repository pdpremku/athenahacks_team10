from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import geminiapi

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    gender: str
    major: str
    about: str

@app.post("/recommend")
async def recommend(profile: UserProfile):
    print(profile.gender, profile.major, profile.about)
    # your club-matching logic here
    club_recommendations = geminiapi.get_club_recommendations(profile.about)
        
    
    return { "clubs": club_recommendations}