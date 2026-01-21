from django.db import models
from farms.models import Farm

class Treatment(models.Model):
    REASON_CHOICES = [
        ('treat_disease', 'Treat Disease'),
        ('prophylactic', 'Prophylactic'),
        ('other', 'Other'),
    ]

    TREATED_FOR_CHOICES = [
        ('enteric', 'Enteric'),
        ('respiratory', 'Respiratory'),
        ('reproductive', 'Reproductive'),
        ('other', 'Other'),
    ]

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='treatments')
    antibiotic_name = models.CharField(max_length=100)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    treated_for = models.CharField(max_length=20, choices=TREATED_FOR_CHOICES)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.antibiotic_name} - {self.farm.name} - {self.date}"
