import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def test_openai():
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("FAIL: OPENAI_API_KEY not found in .env")
        return

    # Cleaning the key from spaces if any
    api_key = api_key.split('=')[-1].strip() if '=' in api_key else api_key.strip()

    client = OpenAI(api_key=api_key)

    try:
        print("Testing OpenAI API with gpt-4o-mini...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Write a one-sentence bedtime story about a unicorn."}],
            max_tokens=60
        )
        print(f"Success! Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"FAIL: {e}")

if __name__ == "__main__":
    test_openai()
