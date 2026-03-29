from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["club-matcher"]

clubs_collection = db["clubs"]
users_collection = db["users"]