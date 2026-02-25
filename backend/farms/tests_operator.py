import json
from django.test import TestCase, Client
from django.urls import reverse
from amu_monitoring.users.models import User
from farms.models import Owner, Farm, Flock
from treatments.models import Treatment

class DataOperatorAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create Data Operator
        self.operator = User.objects.create(
            first_name="Data",
            last_name="Operator",
            email_address="operator@example.com",
            password="password123",
            role="data_operator",
            district="Salem"
        )
        
        # Create another operator for testing isolation
        self.other_operator = User.objects.create(
            first_name="Other",
            last_name="Operator",
            email_address="other@example.com",
            password="password123",
            role="data_operator"
        )

        # Create a Vet
        self.vet = User.objects.get_or_create(
            first_name="Vet",
            last_name="User",
            email_address="vet@example.com",
            password="password123",
            role="vet",
            district="Salem"
        )[0]

    def test_create_owner_and_farm(self):
        # 1. Create Owner
        response = self.client.post(
            reverse('owner-list-create'),
            data=json.dumps({
                "email": self.operator.email_address,
                "name": "Arun Kumar",
                "phone_number": "9876543210",
                "state": "Tamil Nadu",
                "district": "Salem",
                "village": "Mallasamudram",
                "address": "123 Main St"
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        owner_id = response.json()['id']
        
        # Verify owner is linked to operator
        owner = Owner.objects.get(id=owner_id)
        self.assertEqual(owner.created_by, self.operator)

        # 2. Create Farm
        response = self.client.post(
            reverse('farm-list-create'),
            data=json.dumps({
                "email": self.operator.email_address,
                "owner_id": owner_id,
                "name": "Arun's Poultry",
                "state": "Tamil Nadu",
                "district": "Salem",
                "farm_number": "FRM001",
                "farm_type": "commercial",
                "species_type": "AVI",
                "total_animals": 500,
                "avg_weight": 1.5,
                "avg_feed_consumption": 50.0,
                "avg_water_consumption": 100.0
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        
        # Verify farm is linked to operator
        farm = Farm.objects.get(id=response.json()['id'])
        self.assertEqual(farm.user, self.operator)

    def test_operator_isolation(self):
        # Create data for operator 1
        owner = Owner.objects.create(name="Owner 1", created_by=self.operator)
        Farm.objects.create(user=self.operator, owner=owner, name="Farm 1", farm_number="F1", total_animals=10, avg_weight=1, avg_feed_consumption=1, avg_water_consumption=1)
        
        # Create data for operator 2
        other_owner = Owner.objects.create(name="Owner 2", created_by=self.other_operator)
        Farm.objects.create(user=self.other_operator, owner=other_owner, name="Farm 2", farm_number="F2", total_animals=10, avg_weight=1, avg_feed_consumption=1, avg_water_consumption=1)
        
        # Fetch farms as operator 1
        response = self.client.get(reverse('farm-list-create'), {'email': self.operator.email_address})
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['name'], "Farm 1")
        
        # Fetch owners as operator 1
        response = self.client.get(reverse('owner-list-create'), {'email': self.operator.email_address})
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['name'], "Owner 1")

    def test_log_treatment_recorded_by(self):
        owner = Owner.objects.create(name="Owner 1", created_by=self.operator)
        farm = Farm.objects.create(user=self.operator, owner=owner, name="Farm 1", farm_number="F1", district="Salem", total_animals=10, avg_weight=1, avg_feed_consumption=1, avg_water_consumption=1)
        
        # Log treatment
        response = self.client.post(
            reverse('treatment-list-create'),
            data=json.dumps({
                "email": self.operator.email_address,
                "farm": farm.id,
                "antibiotic_name": "Amoxicillin",
                "reason": "treat_disease",
                "treated_for": "respiratory",
                "date": "2024-02-25"
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        
        # Verify treatment has recorded_by set
        treatment = Treatment.objects.get(id=response.json()['id'])
        self.assertEqual(treatment.recorded_by, self.operator)
        self.assertEqual(treatment.vet, self.vet) # Auto-assigned because of district match
