import geminiapi
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

    club_recommendations = geminiapi.get_club_recommendations(
        profile.gender,
        profile.major,
        profile.about
    )

    return {"clubs": club_recommendations}