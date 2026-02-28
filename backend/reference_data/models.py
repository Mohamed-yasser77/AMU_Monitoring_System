from django.db import models

class AntimicrobialFamily(models.Model):
    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    comments = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class SpeciesGroup(models.Model):
    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.code

class Molecule(models.Model):
    name = models.CharField(max_length=255, unique=True)
    family = models.ForeignKey(AntimicrobialFamily, on_delete=models.CASCADE, related_name='molecules')

    def __str__(self):
        return self.name

class Tissue(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class MoleculeSpecies(models.Model):
    molecule = models.ForeignKey(Molecule, on_delete=models.CASCADE)
    species_group = models.ForeignKey(SpeciesGroup, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('molecule', 'species_group')

    def __str__(self):
        return f"{self.molecule.name} - {self.species_group.code}"

class MRLLimit(models.Model):
    molecule = models.ForeignKey(Molecule, on_delete=models.CASCADE)
    species_group = models.ForeignKey(SpeciesGroup, on_delete=models.CASCADE)
    tissue = models.ForeignKey(Tissue, on_delete=models.CASCADE)
    mrl_mgkg = models.FloatField()
    withdrawal_days = models.IntegerField(help_text="Standard withdrawal period in days", null=True, blank=True)

    class Meta:
        unique_together = ('molecule', 'species_group', 'tissue')

    def __str__(self):
        return f"{self.molecule.name} - {self.species_group.code} - {self.tissue.name}: {self.mrl_mgkg}"
