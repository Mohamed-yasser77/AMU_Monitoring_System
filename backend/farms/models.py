from django.db import models
from amu_monitoring.users.models import User

class Farm(models.Model):
    FARM_TYPE_CHOICES = [
        ('backyard', 'Backyard'),
        ('commercial', 'Commercial'),
    ]

    SPECIES_CHOICES = [
        ('avian', 'Avian (Poultry/Birds)'),
        ('bovine', 'Bovine (Cattle)'),
        ('suine', 'Suine (Pigs/Swine)'),
        ('caprine', 'Caprine (Goats)'),
        ('ovine', 'Ovine (Sheep)'),
    ]

    ANTIBIOTIC_REASON_CHOICES = [
        ('treat_disease', 'Treat Disease'),
        ('prophylactic', 'Prophylactic'),
        ('other', 'Other'),
    ]

    TREATED_FOR_CHOICES = [
        ('enteric', 'Enteric'),
        ('respiratory', 'Respiratory'),
        ('reproductive', 'Reproductive'),
    ]
    
    ANTIBIOTIC_NAME_CHOICES = [
        ('spectromycin', 'Spectromycin'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=255)
    state = models.CharField(max_length=100)
    village = models.CharField(max_length=100)
    farm_number = models.CharField(max_length=100)
    farm_type = models.CharField(max_length=20, choices=FARM_TYPE_CHOICES)
    species_type = models.CharField(max_length=20, choices=SPECIES_CHOICES)
    total_animals = models.IntegerField()
    avg_weight = models.FloatField(help_text="Average weight in kg")
    avg_feed_consumption = models.FloatField(help_text="Average feed consumption in kg/day")
    avg_water_consumption = models.FloatField(help_text="Average water consumption in litres/day")
    antibiotic_used = models.BooleanField(default=False)
    
    # Conditional fields
    antibiotic_name = models.CharField(max_length=50, choices=ANTIBIOTIC_NAME_CHOICES, null=True, blank=True)
    antibiotic_reason = models.CharField(max_length=20, choices=ANTIBIOTIC_REASON_CHOICES, null=True, blank=True)
    treated_for = models.CharField(max_length=20, choices=TREATED_FOR_CHOICES, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.user.email_address}"
