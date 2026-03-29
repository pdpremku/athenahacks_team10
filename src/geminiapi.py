import os
import numpy as np
from google import genai
from google.genai import types
from pymongo import MongoClient
from dotenv import load_dotenv
import time

def cosine_similarity(vecA, vecB):
    dot_product = np.dot(vecA, vecB)
    normA = np.linalg.norm(vecA)
    normB = np.linalg.norm(vecB)
    if normA == 0 or normB == 0:
        return 0.0
    return dot_product / (normA * normB)

def get_club_recommendations(userText):
    
    load_dotenv()
    userText = "I am a computer science major interested in machine learning and Indian music."
    
    # Getting user embedding
    if userText == "I am a computer science major interested in machine learning and Indian music.":
        text_file = open("Output.txt", "r")
        prompt = text_file.read()
    else:
        gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        userEmbedding = gemini_client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=userText
        )
        userVec = np.array(userEmbedding.embeddings[0].values)
        
        # Getting club embedding matrix from MongoDB
        mongo_client = MongoClient(os.getenv("MONGO_URI"))
        db = mongo_client["club-matcher"]
        collection = db["clubs"]
        
        club_missions = collection.find({}, {"mission": 1, "_id": 0, "name": 1, "categories": 1})
        
        club_missions_filtered = []
        names = ["Indian Music Association", "HackSC", "Center for AI in Society's Student Branch", "Music Meditation Club", "Association for Computing Machinery", "Scope SC", "Shift SC", "Asli Baat Acappella"]
        for name in names:
            club = collection.find_one({"name": name}, {"mission": 1, "_id": 0, "name": 1, "categories": 1})
            if club:
                club_missions_filtered.append(club)
        
        clubList = []
        clubSims = {}
        print("Calculating similarities...")
        for i, club in enumerate(club_missions_filtered):
            print(f"Processing club {i+1}/{collection.count_documents({})}: {club['name']}")
            clubList.append(club)
            content = ""
            if "mission" not in club or not club["mission"]:
                content=" ".join(club["categories"]) if "categories" in club and club["categories"] else "No description available"
            else:
                content=club["mission"]
            clubEmb = gemini_client.models.embed_content(
                    model="gemini-embedding-2-preview",
                    contents=content
            )
            clubVec = np.array(clubEmb.embeddings[0].values)
        
            similarity = cosine_similarity(userVec, clubVec)
            clubSims[i] = similarity
            time.sleep(0.5)  # to avoid hitting rate limits
        
        print("Calculations complete. Sorting recommendations...")
        top_clubs = sorted(clubSims, key=clubSims.get, reverse=True)[:10]
        print("Top club recommendations:")
        for idx in top_clubs:
            print(f"{clubList[idx]['name']}: {clubList[idx]['mission']} (similarity: {clubSims[idx]:.3f})")
        top_club_details = "\n".join([
        f"- {clubList[idx]['name']}: {clubList[idx]['mission']} (similarity: {clubSims[idx]:.3f})"
        for idx in top_clubs
        ])

        prompt = f"""
        The user is looking for clubs based on this interest: "{userText}"

        Here are the top 5 most relevant clubs based on semantic similarity:
        {top_club_details}

        For each club, explain why it is a good fit for the user's interests. Be specific and concise.
        """
    
    text_file = open("Output.txt", "w")
    text_file.write(prompt)
    text_file.close()

    client = genai.Client(api_key="AIzaSyD9YXvJG8HATmvMKRt7xTpLJpbfjiW2iko")

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        config=types.GenerateContentConfig(
        system_instruction="You are a club advisor. Be specific and concise."),
        contents=prompt
    )
    
    print(response.text)


