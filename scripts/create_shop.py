"""
create_shop.py

Purpose: Script to create a shop entity via API call.
Usage: python scripts/create_shop.py
Dependencies: requests, API server
"""
import requests
import json

with open("shop.json", "r") as f:
    data = json.load(f)

url = "http://127.0.0.1:8000/api/v1/shops/"
headers = {"Content-Type": "application/json"}
response = requests.post(url, headers=headers, json=data)
print(response.status_code)
print(response.text)
