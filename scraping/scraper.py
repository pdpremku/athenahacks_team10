import json
import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

UNIVERSITY = "USC"
URL = "https://engage.usc.edu/club_signup?view=all&"

def fetch_clubs(url):
    print(f"Fetching club directory for {UNIVERSITY}...")
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    print(f"Status code: {res.status_code}")
    return res.text

def fetch_clubs(url):
    print(f"Fetching club directory for {UNIVERSITY}...")
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    print(f"Status code: {res.status_code}")
    return res.text

def parse_clubs(html):
    soup = BeautifulSoup(html, "html.parser")
    clubs = []

    for li in soup.select("ul li"):
        h2 = li.find("h2")
        if not h2:
            continue

        # Name is just the text inside the <a> tag within h2
        link_tag = h2.find("a")
        if not link_tag:
            continue
        name = link_tag.get_text(strip=True)
        website = link_tag["href"].strip() if link_tag.get("href") else ""

        # Org type and categories are in a separate element after h2
        # looks like "Recognized Student Organization (RSO) - Academic, Career"
        org_type = ""
        categories = []
        full_text = li.get_text(separator="|", strip=True)
        for part in full_text.split("|"):
            part = part.strip()
            if any(t in part for t in ["RSO", "Student Government", "FSLD", "ORSL", "RCC", "Viterbi", "School or Department", "Residential"]):
                clean = " ".join(part.split())
                if " - " in clean:
                    org_type = clean.split(" - ")[0].strip()
                    categories = [c.strip() for c in clean.split(" - ")[1].split(",")]
                else:
                    org_type = clean
                break

        # Mission
        text_block = li.get_text(separator=" ", strip=True)
        mission = ""
        if "Mission" in text_block:
            mission = text_block.split("Mission")[-1].split("Membership Benefits")[0]
            mission = mission.strip().lstrip(":").strip()[:400]

        # Membership benefits
        benefits = ""
        if "Membership Benefits" in text_block:
            benefits = text_block.split("Membership Benefits")[-1].split("Contact")[0]
            benefits = benefits.strip().lstrip(":").strip()[:400]

        # Contact
        contact = ""
        if "Contact:" in text_block:
            contact = text_block.split("Contact:")[-1].split("Lifetime")[0].strip()

        clubs.append({
            "name": name,
            "org_type": org_type,
            "categories": categories,
            "mission": mission,
            "membership_benefits": benefits,
            "contact": contact,
            "website": website,
            "university": UNIVERSITY,
            "source_url": URL,
        })

    return clubs

def save_to_json(clubs, filename="clubs.json"):
    with open(filename, "w") as f:
        json.dump(clubs, f, indent=2)
    print(f"Saved {len(clubs)} clubs to {filename}")

def scrape(url):
    html = fetch_clubs(url)
    clubs = parse_clubs(html)
    return clubs

# --- Run ---
clubs = scrape(URL)

for club in clubs[:5]:
    print(f"\nName: {club['name']}")
    print(f"Org Type: {club['org_type']}")
    print(f"Categories: {club['categories']}")
    print(f"Mission: {club['mission'][:100]}")
    print("---")

print(f"\nTotal clubs scraped: {len(clubs)}")
save_to_json(clubs)