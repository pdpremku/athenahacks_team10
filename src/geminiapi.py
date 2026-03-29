import os
import numpy as np
from google import genai
from pymongo import MongoClient

def cosine_similarity(vecA, vecB):
        dot_product = np.dot(vecA, vecB)
        normA = np.linalg.norm(vecA)
        normB = np.linalg.norm(vecB)
        if normA == 0 or normB == 0:
            return 0.0
        return dot_product / (normA * normB)

if __name__ == "__main__":
    # Getting user embedding
    userText = "What is the meaning of life?"

    gemini_client = genai.Client()
    userEmbedding = gemini_client.models.embed_content(
            model="gemini-embedding-001",
            contents=userText
    )
    
    # Getting club embedding matrix from MongoDB
    mongo_client = MongoClient("mongodb+srv://rainykwe:<db_password>@athenahacks-group10.bakv29k.mongodb.net/?appName=athenahacks-group10")
    db = mongo_client["club-matcher"]
    
    
    clubText = doc["club_descriptions"]
    for club in clubText:
        contentEmb = gemini_client.models.embed_content(
                model="gemini-embedding-001",
                contents=club
        )
        clubEmbedding = contentEmb.embeddings[0].values
        clubEmbeddings = np.array(clubEmbedding['data'][0]['embedding'])
    
    similarity = cosine_similarity(userEmbedding, clubEmbedding)
    print(f"Cosine Similarity: {similarity}")