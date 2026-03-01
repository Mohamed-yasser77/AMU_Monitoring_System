"""
Tests for bulk flock entry, auto animal tagging, and flock/animal-level treatment logging.
Verified with JWT Authentication.
"""
import json
import jwt
import datetime
from django.test import TestCase, Client
from django.urls import reverse
from django.conf import settings
from amu_monitoring.users.models import User
from farms.models import Owner, Farm, Flock, Animal
from treatments.models import Treatment


def get_auth_headers(user):
    token_payload = {
        'user_id': user.id,
        'email': user.email_address,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm='HS256')
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


class BulkFlockEntryTest(TestCase):
    def setUp(self):
        self.client = Client()

        self.operator = User.objects.create(
            first_name="Data",
            last_name="Operator",
            email_address="operator@example.com",
            role="data_operator",
            district="Salem",
            is_active=True
        )
        self.operator.set_password("password123")
        self.operator.save()
        self.auth_headers = get_auth_headers(self.operator)

        self.owner = Owner.objects.create(name="Test Owner", created_by=self.operator)
        self.farm = Farm.objects.create(
            user=self.operator,
            owner=self.owner,
            name="Test Farm",
            farm_number="FRM001",
            state="Tamil Nadu",
            district="Salem",
            farm_type="commercial",
            total_animals=0,
            avg_weight=1.5,
            avg_feed_consumption=50.0,
            avg_water_consumption=100.0,
        )

    def _bulk_payload(self, **overrides):
        base = {
            "farm_id": self.farm.id,
            "owner_id": self.owner.id,
            "flock_code": "FLK01",
            "species_type": "AVI",
            "count": 10,
            "age_in_weeks": 4,
        }
        base.update(overrides)
        return json.dumps(base)

    def test_bulk_flock_entry_creates_flock_and_animals(self):
        response = self.client.post(
            reverse('flock-bulk-create'),
            data=self._bulk_payload(count=10),
            content_type='application/json',
            **self.auth_headers
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['animals_created'], 10)
        self.assertEqual(data['flock_tag'], 'FRM001-FLK01')

        flock = Flock.objects.get(id=data['id'])
        self.assertEqual(flock.size, 10)
        self.assertEqual(Animal.objects.filter(flock=flock).count(), 10)

    def test_wrong_operator_farm_rejected(self):
        """Operator cannot create flocks on another operator's farm."""
        other_op = User.objects.create(email_address="other@example.com", role="data_operator", is_active=True)
        other_op.set_password("x")
        other_op.save()
        
        other_owner = Owner.objects.create(name="Other Owner", created_by=other_op)
        other_farm = Farm.objects.create(user=other_op, owner=other_owner, name="Other Farm", farm_number="FRM999",
                                          state="Kerala", farm_type="backyard")
        
        # Try to use current operator's token to create flock on other_farm
        response = self.client.post(
            reverse('flock-bulk-create'),
            data=self._bulk_payload(farm_id=other_farm.id),
            content_type='application/json',
            **self.auth_headers
        )
        self.assertEqual(response.status_code, 404)


class FlockAndAnimalTreatmentTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.operator = User.objects.create(
            first_name="Op", last_name="Test",
            email_address="op@example.com", role="data_operator", 
            district="Salem", is_active=True
        )
        self.operator.set_password("pw")
        self.operator.save()
        self.auth_headers = get_auth_headers(self.operator)

        self.vet = User.objects.create(
            email_address="vet@example.com", first_name="Vet", 
            last_name="User", password="pw", role="vet", district="Salem",
            is_active=True
        )
        
        self.owner = Owner.objects.create(name="Owner", created_by=self.operator)
        self.farm = Farm.objects.create(
            user=self.operator, owner=self.owner, name="Farm", farm_number="FRM001",
            state="TN", district="Salem", farm_type="commercial"
        )
        
        # Create flock
        resp = self.client.post(
            reverse('flock-bulk-create'),
            data=json.dumps({
                "farm_id": self.farm.id,
                "owner_id": self.owner.id,
                "flock_code": "FLK01",
                "species_type": "AVI",
                "count": 5
            }),
            content_type='application/json',
            **self.auth_headers
        )
        self.flock = Flock.objects.get(id=resp.json()['id'])
        self.animal = Animal.objects.filter(flock=self.flock).first()

    def _post_treatment(self, extra=None):
        payload = {
            "farm": self.farm.id,
            "antibiotic_name": "Amoxicillin",
            "reason": "treat_disease",
            "treated_for": "respiratory",
            "date": "2024-03-01",
        }
        if extra:
            payload.update(extra)
        return self.client.post(
            reverse('treatment-list-create'),
            data=json.dumps(payload),
            content_type='application/json',
            **self.auth_headers
        )

    def test_treatment_requires_auth(self):
        resp = self.client.post(reverse('treatment-list-create'), data={}, content_type='application/json')
        self.assertEqual(resp.status_code, 401)

    def test_animal_level_treatment(self):
        resp = self._post_treatment({"flock_id": self.flock.id, "animal_id": self.animal.id})
        self.assertEqual(resp.status_code, 201)
        t = Treatment.objects.get(id=resp.json()['id'])
        self.assertEqual(t.flock, self.flock)
        self.assertEqual(t.animal, self.animal)
        self.assertEqual(t.recorded_by, self.operator)
