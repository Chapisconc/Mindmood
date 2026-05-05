import requests

url = "https://mindmood-ai.onrender.com/analyze"
data = {"text": "Mi novio me engaño"}

response = requests.post(url, json=data)
print(response.json())
