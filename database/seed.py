from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["club-matcher"]
collection = db["clubs"]

with open("clubs.json", "r") as f:
    data = json.load(f)

collection.insert_many(data)
print(f"Inserted {len(data)} clubs!")