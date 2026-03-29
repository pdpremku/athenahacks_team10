import json
import re

with open("clubs.json", "r") as f:
    data = json.load(f)

for club in data:
    # remove unneeded fields
    club.pop("org_type", None)
    club.pop("source_url", None)

    # clean name
    name = club.get("name", "")
    name = name.split("\r\n")[0].strip()
    club["name"] = name

    # clean contact - grab everything before "Email"
    contact = club.get("contact", "")
    contact = re.split(r'Email|Mission|Membership', contact)[0].strip().strip(",").strip()
    club["contact"] = contact

    # clean mission - remove \\r\\n
    mission = club.get("mission", "")
    mission = re.sub(r'\\r\\n', ' ', mission).strip()
    club["mission"] = mission

    # clean categories - remove whitespace junk
    categories = club.get("categories", [])
    categories = [re.sub(r'[\r\n\t]', '', cat).strip() for cat in categories if cat.strip()]
    club["categories"] = categories

    # clean membership benefits
    benefits = club.get("membership_benefits", "")
    benefits = re.sub(r'[\r\n\t]', ' ', benefits).strip()
    club["membership_benefits"] = benefits

with open("clubs_clean.json", "w") as f:
    json.dump(data, f, indent=2)

print(f"Cleaned {len(data)} clubs! Check clubs_clean.json")