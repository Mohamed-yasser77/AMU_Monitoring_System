
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    for model in client.models.list():
        print(f"Name: {model.name}, Display Name: {model.display_name}")
except Exception as e:
    print(f"Error listing models: {e}")

try:
    print("\nTesting simple generation...")
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents='Hi'
    )
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error testing generation: {e}")
