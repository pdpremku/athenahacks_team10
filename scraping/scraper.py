import requests
from bs4 import BeautifulSoup
import json

UNIVERSITY = "USC"
URL = "https://engage.usc.edu/club_signup?view=all&"

def fetch_page(url):
    headers = {"User-Agent": "Mozilla/5.0"}
    print(f"Fetching club directory from {url}...")
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

        name = h2.get_text(strip=True)
        link_tag = h2.find("a")
        url = link_tag["href"] if link_tag else ""

        text_block = li.get_text(separator=" ", strip=True)
        mission = ""
        if "Mission" in text_block:
            mission = text_block.split("Mission")[-1].split("Membership Benefits")[0].strip()

        categories = []
        for part in li.get_text(separator="|", strip=True).split("|"):
            part = part.strip()
            if any(cat in part for cat in [
                "Academic", "Career", "Social", "Service", "Pre-Professional",
                "Ethnic/Cultural", "Health & Wellness", "Spiritual", "Political",
                "Recreation", "Environmental", "Visual & Performing Arts", "Design Team"
            ]):
                categories = [c.strip() for c in part.split(",")]

        clubs.append({
            "name": name,
            "url": url,
            "categories": categories,
            "mission": mission[:300],
            "university": UNIVERSITY,  # tag each club with its school
        })

    return clubs

def save_to_json(clubs, filename="clubs.json"):
    with open(filename, "w") as f:
        json.dump(clubs, f, indent=2)
    print(f"Saved {len(clubs)} clubs to {filename}")

def scrape(url):
    html = fetch_page(url)
    clubs = parse_clubs(html)
    return clubs

clubs = scrape(URL)

for club in clubs[:5]:
    print(f"\nName: {club['name']}")
    print(f"University: {club['university']}")
    print(f"Categories: {club['categories']}")
    print(f"Mission: {club['mission'][:100]}")
    print("---")

print(f"\nTotal clubs scraped: {len(clubs)}")
save_to_json(clubs)