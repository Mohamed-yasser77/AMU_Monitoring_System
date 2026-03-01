from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email_address, password=None, **extra_fields):
        if not email_address:
            raise ValueError('The Email field must be set')
        email_address = self.normalize_email(email_address)
        user = self.model(email_address=email_address, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email_address, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email_address, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email_address = models.EmailField(unique=True)
    # password is provided by AbstractBaseUser

    ROLE_CHOICES = [
        ('farmer', 'Farmer'),
        ('vet', 'Vet'),
        ('data_operator', 'Data operator'),
        ('regulator', 'Regulator'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='data_operator')

    state = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email_address'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class DataOperator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='data_operator_profile')
    designation = models.CharField(max_length=100, blank=True, null=True)
    organization = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.user.email_address

