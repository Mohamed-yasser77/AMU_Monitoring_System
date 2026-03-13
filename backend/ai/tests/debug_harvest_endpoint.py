
import os
import django
import json
import sys
from datetime import date

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

from ai.views import HarvestForecastView
from django.test import RequestFactory
from amu_monitoring.users.models import User

def test_harvest_endpoint():
    print("Testing Harvest Forecast Endpoint...")
    factory = RequestFactory()
    user, _ = User.objects.get_or_create(email_address="test@example.com", 
                                         defaults={'first_name': 'Test', 'last_name': 'User'})
    
    # Payload for a RAG-only molecule (not in CSV)
    data = {
        "molecule": "Amoxicillin",
        "species": "BOV",
        "treatment_date": "2024-03-20"
    }
    
    request = factory.post('/api/ai/harvest-forecast/', 
                          data=json.dumps(data), 
                          content_type='application/json')
    request.user = user
    
    view = HarvestForecastView.as_view()
    response = view(request)
    
    print(f"Status: {response.status_code}")
    print(f"Body: {json.dumps(json.loads(response.content), indent=2)}")

if __name__ == "__main__":
    test_harvest_endpoint()
