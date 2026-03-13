import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def diagnostic():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("FAIL: GEMINI_API_KEY not found in .env")
        return
    
    # Just in case there's an extra space or assignment in the env var
    api_key = api_key.split('=')[-1].strip() if '=' in api_key else api_key.strip()
    
    print(f"Testing Gemini key: {api_key[:8]}...{api_key[-4:]}")
    client = genai.Client(api_key=api_key)
    
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents='Say "Key is Working"'
        )
        print(f"SUCCESS: {response.text.strip()}")
    except Exception as e:
        print(f"DIAGNOSTIC RESULT: {e}")

if __name__ == "__main__":
    diagnostic()
