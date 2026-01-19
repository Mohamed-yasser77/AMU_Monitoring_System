from django.db import models

class User(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email_address = models.EmailField(unique=True)
    password = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
