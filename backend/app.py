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

# temporary club rec code
def get_club_recommendations(gender, major, about):
    prompt = f"""
    Student Profile:
    - Gender: {gender}
    - Major: {major}
    - About: {about}

    Recommend 5 college clubs that would be a great fit.
    For each club, include:
    - name
    - reason why it matches the student
    """

    print(prompt)

    return [
        {
            "name": "Computer Science Club",
            "reason": f"Great for a {major} student interested in {about}"
        },
        {
            "name": "Cultural Association",
            "reason": f"Matches your background and identity as {gender}"
        },
        {
            "name": "Volunteer Club",
            "reason": f"Fits your interests mentioned: {about}"
        },
        {
            "name": "Entrepreneurship Club",
            "reason": f"Useful for building skills alongside {major}"
        },
        {
            "name": "Social Impact Club",
            "reason": f"Aligns with your personal interests and goals"
        }
    ]

@app.post("/recommend")
async def recommend(profile: UserProfile):
    print(profile.gender, profile.major, profile.about)

    club_recommendations = get_club_recommendations(
        profile.gender,
        profile.major,
        profile.about
    )

    return {"clubs": club_recommendations}