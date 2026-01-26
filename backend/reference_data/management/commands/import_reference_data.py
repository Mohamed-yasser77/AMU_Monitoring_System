import pandas as pd
from django.core.management.base import BaseCommand
from reference_data.models import AntimicrobialFamily, Molecule, SpeciesGroup, Tissue, MoleculeSpecies, MRLLimit
import os

class Command(BaseCommand):
    help = 'Import reference data from Excel files'

    def handle(self, *args, **kwargs):
        base_path = r"D:\PSG TECH 2022-2027\Sem 8\Capstone_AMU_Project\Documentation and data"
        
        file_comments = os.path.join(base_path, "Antimicrobial_Family_comments.xlsx")
        file_molecules = os.path.join(base_path, "Antimicrobial_Family.xlsx")
        file_mrl = os.path.join(base_path, "mrl_limit.xlsx")

        self.stdout.write("Importing Antimicrobial Families...")
        df_comments = pd.read_excel(file_comments, engine='openpyxl')
        for _, row in df_comments.iterrows():
            AntimicrobialFamily.objects.get_or_create(
                name=row['Antimicrobial_Family'],
                defaults={
                    'category': row['Category'],
                    'comments': row['Comments']
                }
            )

        self.stdout.write("Importing Molecules and Species Groups...")
        df_molecules = pd.read_excel(file_molecules, engine='openpyxl')
        for _, row in df_molecules.iterrows():
            family_name = row['Antimicrobial_Family']
            
            # Handle specific mappings or create missing families
            if family_name == 'Polypeptides Cyclic':
                 family_name = 'Polypeptides'

            family, _ = AntimicrobialFamily.objects.get_or_create(name=family_name)

            molecule, created = Molecule.objects.get_or_create(
                name=row['Molecule'],
                defaults={'family': family}
            )

            # Process Species
            species_str = str(row['Species']) if pd.notna(row['Species']) else ""
            if species_str:
                species_codes = [s.strip() for s in species_str.split(',')]
                for code in species_codes:
                    if not code: continue
                    species_group, _ = SpeciesGroup.objects.get_or_create(code=code)
                    MoleculeSpecies.objects.get_or_create(
                        molecule=molecule,
                        species_group=species_group
                    )

        self.stdout.write("Importing MRL Limits...")
        df_mrl = pd.read_excel(file_mrl, engine='openpyxl')
        for _, row in df_mrl.iterrows():
            mol_name = row['molecule_name']
            species_code = row['species_group']
            tissue_name = row['tissue']
            mrl_val = row['mrl_mgkg']

            try:
                molecule = Molecule.objects.get(name=mol_name)
            except Molecule.DoesNotExist:
                # self.stdout.write(self.style.WARNING(f"Molecule {mol_name} not found in MRL sheet, skipping."))
                # Optionally create it or skip. Let's skip to keep data integrity strictly based on Molecule file.
                # Actually, MRL sheet might contain molecules not in the other sheet? 
                # Let's assume we only import MRLs for known molecules.
                continue

            species_group, _ = SpeciesGroup.objects.get_or_create(code=species_code)
            tissue, _ = Tissue.objects.get_or_create(name=tissue_name.strip())

            MRLLimit.objects.get_or_create(
                molecule=molecule,
                species_group=species_group,
                tissue=tissue,
                defaults={'mrl_mgkg': mrl_val}
            )

        self.stdout.write(self.style.SUCCESS('Successfully imported reference data'))
