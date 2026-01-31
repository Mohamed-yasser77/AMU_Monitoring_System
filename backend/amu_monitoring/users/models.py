from django.db import models

class User(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email_address = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    
    ROLE_CHOICES = [
        ('farmer', 'Farmer'),
        ('vet', 'Vet'),
        ('regulator', 'Regulator'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='farmer')

    # Profile fields (initially empty for vets)
    state = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    