import os
import django
import requests

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

def run():
    print("Testing Backend API for Safe Harvest Date Serialization...")
    
    # Let's request the 1st farm and the flocks endpoint to see if they serialize properly
    
    url = "http://localhost:8000/api/flocks/?email=operator1@example.com"
    try:
        response = requests.get(url)
        data = response.json()
        print("Status for Flocks Endpoint:", response.status_code)
        
        # Test if the key exists in our data
        if len(data) > 0:
            flock = data[0]
            print("\nKeys inside the first flock response:")
            print(flock.keys())
            
            if 'safe_harvest_date' in flock and 'is_under_withdrawal' in flock:
                 print("\n✅ SUCCESS! Safe harvest parameters found in /api/flocks/")
                 print(f"Sample Flock: Safe Harvest: {flock['safe_harvest_date']} | Under Withdrawal: {flock['is_under_withdrawal']}")
            else:
                 print("❌ FAILURE! Missing withdrawal keys in /api/flocks/")
        else:
            print("No flocks found for this operator.")
    except Exception as e:
        print("Error connecting to API:", str(e))

if __name__ == '__main__':
    run()
