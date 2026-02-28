"""
Tests for bulk flock entry, auto animal tagging, and flock/animal-level treatment logging.
"""
import json
from django.test import TestCase, Client
from django.urls import reverse
from amu_monitoring.users.models import User
from farms.models import Owner, Farm, Flock, Animal
from treatments.models import Treatment


class BulkFlockEntryTest(TestCase):
    def setUp(self):
        self.client = Client()

        self.operator = User.objects.create(
            first_name="Data",
            last_name="Operator",
            email_address="operator@example.com",
            password="password123",
            role="data_operator",
            district="Salem",
        )
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
            "email": self.operator.email_address,
            "farm_id": self.farm.id,
            "owner_id": self.owner.id,
            "flock_code": "FLK01",
            "species_type": "AVI",
            "count": 10,
            "age_in_weeks": 4,
        }
        base.update(overrides)
        return json.dumps(base)

    # ── CORE BULK CREATION ──────────────────────────────────────────────────

    def test_bulk_flock_entry_creates_flock_and_animals(self):
        """Bulk entry with count=10 should create 1 Flock + 10 Animals."""
        response = self.client.post(
            reverse('flock-bulk-create'),
            data=self._bulk_payload(count=10),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201, response.json())
        data = response.json()
        self.assertEqual(data['animals_created'], 10)
        self.assertEqual(data['flock_tag'], 'FRM001-FLK01')

        # Verify DB objects
        flock = Flock.objects.get(id=data['flock_id'])
        self.assertEqual(flock.size, 10)
        self.assertEqual(flock.flock_code, 'FLK01')
        self.assertEqual(Animal.objects.filter(flock=flock).count(), 10)

    def test_auto_tag_format(self):
        """Animal tags must follow {farm_number}-{flock_code}-{serial:03d} format."""
        response = self.client.post(
            reverse('flock-bulk-create'),
            data=self._bulk_payload(count=5),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        flock_id = response.json()['flock_id']
        tags = list(Animal.objects.filter(flock_id=flock_id).values_list('animal_tag', flat=True).order_by('animal_tag'))
        expected = [f"FRM001-FLK01-{i:03d}" for i in range(1, 6)]
        self.assertEqual(tags, expected)

    def test_farm_total_animals_incremented(self):
        """farm.total_animals must increase by the count."""
        self.client.post(
            reverse('flock-bulk-create'),
            data=self._bulk_payload(count=50),
            content_type='application/json',
        )
        self.farm.refresh_from_db()
        self.assertEqual(self.farm.total_animals, 50)

    def test_second_flock_different_species_same_farm(self):
        """A farm can have multiple flocks of different species."""
        self.client.post(reverse('flock-bulk-create'), data=self._bulk_payload(flock_code="FLK01", species_type="AVI", count=100), content_type='application/json')
        resp2 = self.client.post(reverse('flock-bulk-create'), data=self._bulk_payload(flock_code="FLK02", species_type="BOV", count=20), content_type='application/json')
        self.assertEqual(resp2.status_code, 201)
        self.assertEqual(Flock.objects.filter(farm=self.farm).count(), 2)
        self.farm.refresh_from_db()
        self.assertEqual(self.farm.total_animals, 120)

    # ── VALIDATION ──────────────────────────────────────────────────────────

    def test_duplicate_flock_code_rejected(self):
        """Same flock_code on the same farm must return 400."""
        self.client.post(reverse('flock-bulk-create'), data=self._bulk_payload(flock_code="FLK01"), content_type='application/json')
        response = self.client.post(reverse('flock-bulk-create'), data=self._bulk_payload(flock_code="FLK01"), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('already exists', response.json()['error'])

    def test_count_zero_rejected(self):
        """count=0 must return 400."""
        response = self.client.post(reverse('flock-bulk-create'), data=self._bulk_payload(count=0), content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_count_over_limit_rejected(self):
        """count > 10000 must return 400."""
        response = self.client.post(reverse('flock-bulk-create'), data=self._bulk_payload(count=10001), content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_wrong_operator_farm_rejected(self):
        """Operator cannot create flocks on another operator's farm."""
        other_op = User.objects.create(email_address="other@example.com", password="x", role="data_operator")
        other_owner = Owner.objects.create(name="Other Owner", created_by=other_op)
        other_farm = Farm.objects.create(user=other_op, owner=other_owner, name="Other Farm", farm_number="FRM999",
                                          state="Kerala", farm_type="backyard", total_animals=0,
                                          avg_weight=1, avg_feed_consumption=1, avg_water_consumption=1)
        response = self.client.post(
            reverse('flock-bulk-create'),
            data=json.dumps({"email": self.operator.email_address, "farm_id": other_farm.id,
                              "owner_id": self.owner.id, "flock_code": "FLK01", "species_type": "AVI", "count": 5}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 404)
        
    def test_flock_age_updates_dynamically(self):
        """Flock age should be calculated correctly based on date_of_birth."""
        from datetime import date, timedelta
        
        # Create a flock with age 4 weeks
        response = self.client.post(
            reverse('flock-bulk-create'),
            data=self._bulk_payload(count=10, age_in_weeks=4),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        flock_id = response.json()['flock_id']
        
        # Verify initial age
        flock = Flock.objects.get(id=flock_id)
        self.assertEqual(flock.age_in_weeks, 4)
        
        # Manually move date_of_birth back by 2 weeks (simulating 2 weeks passing)
        flock.date_of_birth = flock.date_of_birth - timedelta(weeks=2)
        flock.save()
        
        # Verify age increased to 6
        self.assertEqual(flock.age_in_weeks, 6)


class FlockAndAnimalTreatmentTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.operator = User.objects.create(
            first_name="Op", last_name="Test",
            email_address="op@example.com", password="pw",
            role="data_operator", district="Salem",
        )
        self.vet = User.objects.get_or_create(
            email_address="vet@example.com",
            defaults={"first_name": "Vet", "last_name": "User", "password": "pw", "role": "vet", "district": "Salem"},
        )[0]
        self.owner = Owner.objects.create(name="Owner", created_by=self.operator)
        self.farm = Farm.objects.create(
            user=self.operator, owner=self.owner, name="Farm", farm_number="FRM001",
            state="TN", district="Salem", farm_type="commercial",
            total_animals=0, avg_weight=1, avg_feed_consumption=1, avg_water_consumption=1,
        )
        # Create flock with 5 animals via bulk endpoint
        resp = self.client.post(
            reverse('flock-bulk-create'),
            data=json.dumps({"email": self.operator.email_address, "farm_id": self.farm.id,
                              "owner_id": self.owner.id, "flock_code": "FLK01",
                              "species_type": "AVI", "count": 5}),
            content_type='application/json',
        )
        self.flock = Flock.objects.get(id=resp.json()['flock_id'])
        self.animal = Animal.objects.filter(flock=self.flock).first()

    def _post_treatment(self, extra=None):
        payload = {
            "email": self.operator.email_address,
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
        )

    def test_farm_level_treatment(self):
        """Treatment without flock_id or animal_id applies farm-wide."""
        resp = self._post_treatment()
        self.assertEqual(resp.status_code, 201)
        t = Treatment.objects.get(id=resp.json()['id'])
        self.assertIsNone(t.flock)
        self.assertIsNone(t.animal)

    def test_flock_level_treatment(self):
        """Treatment with flock_id targets the whole flock."""
        resp = self._post_treatment({"flock_id": self.flock.id})
        self.assertEqual(resp.status_code, 201, resp.json())
        t = Treatment.objects.get(id=resp.json()['id'])
        self.assertEqual(t.flock, self.flock)
        self.assertIsNone(t.animal)

    def test_animal_level_treatment(self):
        """Treatment with flock_id + animal_id targets a single animal."""
        resp = self._post_treatment({"flock_id": self.flock.id, "animal_id": self.animal.id})
        self.assertEqual(resp.status_code, 201, resp.json())
        t = Treatment.objects.get(id=resp.json()['id'])
        self.assertEqual(t.flock, self.flock)
        self.assertEqual(t.animal, self.animal)

    def test_animal_without_flock_rejected(self):
        """Providing animal_id without flock_id must return 400."""
        resp = self._post_treatment({"animal_id": self.animal.id})
        self.assertEqual(resp.status_code, 400)

    def test_get_treatments_returns_flock_and_animal_info(self):
        """GET /api/treatments/?email=... returns flock and animal tag fields."""
        self._post_treatment({"flock_id": self.flock.id, "animal_id": self.animal.id})
        resp = self.client.get(reverse('treatment-list-create'), {'email': self.operator.email_address})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(len(data) > 0)
        t = data[0]
        self.assertIn('flock_id', t)
        self.assertIn('animal__animal_tag', t)
