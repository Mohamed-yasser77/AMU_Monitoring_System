from django.db import models
from farms.models import Farm
from amu_monitoring.users.models import User

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

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='treatments')
    vet = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_treatments')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='treatments_recorded')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    antibiotic_name = models.CharField(max_length=100)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    treated_for = models.CharField(max_length=20, choices=TREATED_FOR_CHOICES)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.antibiotic_name} - {self.farm.name} - {self.status}"
