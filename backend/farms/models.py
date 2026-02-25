from django.db import models
from amu_monitoring.users.models import User


class Owner(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owners_created')

    def __str__(self):
        return self.name


class Farm(models.Model):
    FARM_TYPE_CHOICES = [
        ('backyard', 'Backyard'),
        ('commercial', 'Commercial'),
    ]

    SPECIES_CHOICES = [
        ('AVI', 'Avian (Poultry/Birds)'),
        ('BOV', 'Bovine (Cattle)'),
        ('SUI', 'Suine (Pigs/Swine)'),
        ('CAP', 'Caprine (Goats)'),
        ('OVI', 'Ovine (Sheep)'),
        ('EQU', 'Equine (Horses)'),
        ('LEP', 'Leporine (Rabbits)'),
        ('PIS', 'Pisces (Fish)'),
        ('CAM', 'Camelids (Camels)'),
        ('API', 'Apiculture (Bees)'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farms', help_text="The Data Operator or user managing this farm")
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=255)
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True, null=True)
    village = models.CharField(max_length=100, blank=True, null=True)
    farm_number = models.CharField(max_length=100)
    farm_type = models.CharField(max_length=20, choices=FARM_TYPE_CHOICES)
    species_type = models.CharField(max_length=20, choices=SPECIES_CHOICES)
    total_animals = models.IntegerField()
    avg_weight = models.FloatField(help_text="Average weight in kg")
    avg_feed_consumption = models.FloatField(help_text="Average feed consumption in kg/day")
    avg_water_consumption = models.FloatField(help_text="Average water consumption in litres/day")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.farm_number}"


class Flock(models.Model):
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='flocks')
    farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, blank=True, related_name='flocks')
    flock_tag = models.CharField(max_length=50)
    species_type = models.CharField(max_length=20, choices=Farm.SPECIES_CHOICES)
    size = models.IntegerField()
    age_in_weeks = models.IntegerField(blank=True, null=True)

    class Meta:
        unique_together = ('owner', 'flock_tag')

    def __str__(self):
        return f"{self.flock_tag} - {self.owner.name}"


class Animal(models.Model):
    flock = models.ForeignKey(Flock, on_delete=models.CASCADE, related_name='animals')
    animal_tag = models.CharField(max_length=50)
    date_of_birth = models.DateField(blank=True, null=True)
    sex = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        unique_together = ('flock', 'animal_tag')

    def __str__(self):
        return f"{self.animal_tag} ({self.flock.flock_tag})"


class Problem(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='problems')
    flock = models.ForeignKey(Flock, on_delete=models.SET_NULL, null=True, blank=True, related_name='problems')
    animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True, related_name='problems')
    description = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    date_reported = models.DateField(auto_now_add=True)
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='problems_reported')

    def __str__(self):
        return f"Problem {self.id} for {self.owner.name}"
