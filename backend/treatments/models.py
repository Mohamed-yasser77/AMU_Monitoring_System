from django.db import models
from farms.models import Farm, Flock, Animal
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

    # Treatment target — farm is always set; flock/animal narrow the scope
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='treatments')
    flock = models.ForeignKey(Flock, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='treatments', help_text="If set, treatment targets this flock only")
    animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='treatments', help_text="If set, treatment targets a single animal in the flock")

    vet = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_treatments')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='treatments_recorded')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    antibiotic_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=100, null=True, blank=True, help_text="e.g. 5ml, 250mg")
    method_intake = models.CharField(max_length=50, null=True, blank=True, help_text="e.g. Oral, Injection, Feed")
    vet_notes = models.TextField(null=True, blank=True)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    treated_for = models.CharField(max_length=20, choices=TREATED_FOR_CHOICES)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        target = self.animal.animal_tag if self.animal else (self.flock.flock_tag if self.flock else self.farm.name)
        return f"{self.antibiotic_name} → {target} ({self.status})"
