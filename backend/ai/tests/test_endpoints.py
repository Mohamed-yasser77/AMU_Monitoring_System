import json
import jwt
from django.conf import settings
from django.test import TestCase, Client
from django.urls import reverse
from amu_monitoring.users.models import User
from ai.models import AIQueryLog

class AIEndpointsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email_address='testvet@example.com',
            password='testpassword123',
            role='vet',
            first_name='Test',
            last_name='Vet'
        )
        # Generate JWT token
        self.token = jwt.encode(
            {'user_id': self.user.id},
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        self.headers = {
            'HTTP_AUTHORIZATION': f'Bearer {self.token}',
            'content_type': 'application/json'
        }

    def test_regulatory_query_endpoint(self):
        """Test the regulatory query endpoint with a valid query."""
        url = reverse('ai-regulatory-query')
        payload = {
            'query': 'What is the withdrawal period for Colistin in poultry?',
            'species': 'AVI'
        }
        
        response = self.client.post(
            url, 
            data=json.dumps(payload),
            **self.headers
        )
        
        print(f"\n[Regulatory Query Response]: {response.status_code}")
        print(response.content.decode())
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('answer', data)
        self.assertIn('confidence', data)
        self.assertTrue(AIQueryLog.objects.filter(user=self.user, query_type='regulatory').exists())

    def test_harvest_forecast_endpoint_csv(self):
        """Test the harvest forecast endpoint for a molecule found in CSV."""
        url = reverse('ai-harvest-forecast')
        payload = {
            'molecule': 'Colistin sulfate',
            'species': 'AVI',
            'treatment_date': '2026-03-01'
        }
        
        response = self.client.post(
            url, 
            data=json.dumps(payload),
            **self.headers
        )
        
        print(f"\n[Harvest Forecast (CSV) Response]: {response.status_code}")
        print(response.content.decode())
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['method'], 'csv_direct_lookup')
        self.assertIn('safe_harvest_date', data)
        self.assertEqual(data['withdrawal_days'], 1) # Matches CSV: Colistin sulfate / AVI = 1 day

    def test_harvest_forecast_endpoint_rag(self):
        """Test the harvest forecast endpoint for a molecule requiring RAG fallback."""
        url = reverse('ai-harvest-forecast')
        # Using a fake molecule that won't be in CSV but might trigger RAG
        payload = {
            'molecule': 'GenericAntibioticX',
            'species': 'AVI',
            'treatment_date': '2026-03-01'
        }
        
        response = self.client.post(
            url, 
            data=json.dumps(payload),
            **self.headers
        )
        
        print(f"\n[Harvest Forecast (RAG) Response]: {response.status_code}")
        print(response.content.decode())
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Even if it flags for review, it should return a 200 status with flagged=True
        self.assertTrue(data.get('flagged_for_review') is not None)

    def test_rate_limiting(self):
        """Test that the daily rate limit is enforced."""
        from django.conf import settings
        limit = getattr(settings, 'AI_RATE_LIMIT_PER_DAY', 20)
        
        # Create (limit) dummy logs for today
        for _ in range(limit):
            AIQueryLog.objects.create(
                user=self.user,
                query_type='regulatory',
                query_text='test',
                response_text='test'
            )
            
        url = reverse('ai-regulatory-query')
        payload = {'query': 'test'}
        response = self.client.post(
            url, 
            data=json.dumps(payload),
            **self.headers
        )
        
        self.assertEqual(response.status_code, 429)
        self.assertIn('limit', response.json()['error'])
