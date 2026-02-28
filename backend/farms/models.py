from django.db import models
from amu_monitoring.users.models import User

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
    ('MIX', 'Mixed (Multi-species)'),
]


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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farms', help_text="The Data Operator or user managing this farm")
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=255)
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True, null=True)
    village = models.CharField(max_length=100, blank=True, null=True)
    farm_number = models.CharField(max_length=100)
    farm_type = models.CharField(max_length=20, choices=FARM_TYPE_CHOICES)
    # species_type is now optional — farms can host multiple species via flocks
    species_type = models.CharField(max_length=20, choices=SPECIES_CHOICES, blank=True, null=True, help_text="Primary species (optional — use flocks for multi-species)")
    total_animals = models.IntegerField(default=0)
    avg_weight = models.FloatField(help_text="Average weight in kg", default=0.0)
    avg_feed_consumption = models.FloatField(help_text="Average feed consumption in kg/day", default=0.0)
    avg_water_consumption = models.FloatField(help_text="Average water consumption in litres/day", default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.farm_number}"


class Flock(models.Model):
    """
    A flock/herd is a group of animals of the same species on a farm.
    A farm can have multiple flocks of different species.
    Tag format: {farm.farm_number}-{flock_code}-{serial:03d}
    e.g. FRM001-FLK01-001
    """
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='flocks')
    farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, blank=True, related_name='flocks')
    flock_code = models.CharField(max_length=20, blank=True, null=True, help_text="Short alphanumeric code, unique per farm (e.g. FLK01)")
    flock_tag = models.CharField(max_length=100, blank=True, null=True, help_text="Composite tag: farm_number-flock_code (auto-generated)")
    species_type = models.CharField(max_length=20, choices=SPECIES_CHOICES)
    size = models.IntegerField(help_text="Number of animals in this flock")
    age_in_weeks = models.IntegerField(blank=True, null=True)
    avg_weight = models.FloatField(help_text="Average weight in kg", default=0.0)
    avg_feed_consumption = models.FloatField(help_text="Average feed consumption in kg/day", default=0.0)
    avg_water_consumption = models.FloatField(help_text="Average water consumption in litres/day", default=0.0)

    class Meta:
        unique_together = ('farm', 'flock_code')

    def __str__(self):
        return f"{self.flock_tag} ({self.size} animals)"

    @property
    def withdrawal_status(self):
        """
        Calculates safety status strictly based on treatment dates and withdrawal periods.
        Does NOT use animal age or harvest age.
        Checks ALL approved treatments for this flock to find the latest safe harvest date.
        """
        from treatments.models import Treatment
        from reference_data.models import MRLLimit
        from datetime import date, timedelta
        
        # Get all approved treatments for this flock
        approved_treatments = Treatment.objects.filter(
            flock=self, 
            status='approved'
        )

        max_safe_date = None
        is_under_withdrawal = False
        today = date.today()

        for treatment in approved_treatments:
            if not self.species_type:
                continue
                
            mrls = MRLLimit.objects.filter(
                molecule__name=treatment.antibiotic_name,
                species_group__code=self.species_type
            )
            
            max_days = 0
            if mrls.exists():
                days_list = [mrl.withdrawal_days for mrl in mrls if mrl.withdrawal_days is not None]
                if days_list:
                    max_days = max(days_list)
            
            if max_days > 0:
                # Safe date = date treatment was administered + withdrawal days
                treatment_safe_date = treatment.date + timedelta(days=max_days)
                
                if max_safe_date is None or treatment_safe_date > max_safe_date:
                    max_safe_date = treatment_safe_date
        
        if max_safe_date and today <= max_safe_date:
            is_under_withdrawal = True
            
        return {
            'safe_harvest_date': max_safe_date.isoformat() if max_safe_date else None,
            'is_under_withdrawal': is_under_withdrawal
        }


class Animal(models.Model):
    """
    Individual animal with auto-generated tag: {farm_number}-{flock_code}-{serial:03d}
    e.g. FRM001-FLK01-023
    """
    flock = models.ForeignKey(Flock, on_delete=models.CASCADE, related_name='animals')
    animal_tag = models.CharField(max_length=100, unique=True, help_text="Auto-generated: farm_number-flock_code-NNN")
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
