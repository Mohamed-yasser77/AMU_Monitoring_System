import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

from reference_data.models import Molecule, SpeciesGroup, Tissue, MRLLimit

def run():
    print("Injecting Mock Withdrawal Periods into existing MRLLimit records...")

    # Define our mock dataset [Molecule Name, Species Code, Tissue Name, Withdrawal Days]
    mock_data = [
        # AVIAN MOCK DATA (Chickens, Poultry)
        ("Amoxicillin", "AVI", "Muscle", 4),
        ("Amoxicillin", "AVI", "Skin + Fat", 4),
        ("Amoxicillin", "AVI", "Liver", 4),
        ("Amoxicillin", "AVI", "Kidney", 4),
        ("Amoxicillin", "AVI", "Eggs", 0), 

        ("Oxytetracycline", "AVI", "Muscle", 7),
        ("Oxytetracycline", "AVI", "Fat", 7),
        ("Oxytetracycline", "AVI", "Liver", 7),
        ("Oxytetracycline", "AVI", "Kidney", 7),
        ("Oxytetracycline", "AVI", "Eggs", 7),

        ("Enrofloxacin", "AVI", "Muscle", 8),
        ("Enrofloxacin", "AVI", "Fat", 8),
        ("Enrofloxacin", "AVI", "Liver", 8),
        ("Enrofloxacin", "AVI", "Kidney", 8),
        ("Enrofloxacin", "AVI", "Eggs", 9), 

        # CATTLE MOCK DATA
        ("Amoxicillin", "BOV", "Muscle", 14),
        ("Amoxicillin", "BOV", "Liver", 14),
        ("Amoxicillin", "BOV", "Kidney", 14),
        ("Amoxicillin", "BOV", "Milk", 3), # ~72 hours

        ("Oxytetracycline", "BOV", "Muscle", 28),
        ("Oxytetracycline", "BOV", "Liver", 28),
        ("Oxytetracycline", "BOV", "Kidney", 28),
        ("Oxytetracycline", "BOV", "Milk", 4), # 96 hours

        ("Penicillin G", "BOV", "Muscle", 10),
        ("Penicillin G", "BOV", "Liver", 10),
        ("Penicillin G", "BOV", "Kidney", 10),
        ("Penicillin G", "BOV", "Milk", 3), # 72 hours
        
        # SUINE MOCK DATA (Pigs)
        ("Amoxicillin", "SUI", "Muscle", 14),
        ("Amoxicillin", "SUI", "Fat", 14),
        ("Amoxicillin", "SUI", "Liver", 14),
        ("Amoxicillin", "SUI", "Kidney", 14),

        ("Oxytetracycline", "SUI", "Muscle", 28),
        ("Oxytetracycline", "SUI", "Fat", 28),
        ("Oxytetracycline", "SUI", "Liver", 28),
        ("Oxytetracycline", "SUI", "Kidney", 28),

        # APRAMYCIN MOCK DATA
        ("Apramycin", "AVI", "Muscle", 7),
        ("Apramycin", "AVI", "Liver", 7),
        ("Apramycin", "AVI", "Kidney", 7),
        ("Apramycin", "BOV", "Muscle", 28),
        ("Apramycin", "BOV", "Liver", 28),
        ("Apramycin", "BOV", "Kidney", 28),
        ("Apramycin", "SUI", "Muscle", 14),
        ("Apramycin", "SUI", "Liver", 14),
        ("Apramycin", "SUI", "Kidney", 14),
    ]

    records_updated = 0
    records_skipped = 0

    for mol_name, species_code, tissue_name, w_days in mock_data:
        try:
            # First ensure the base entities exist
            tissue, _ = Tissue.objects.get_or_create(name=tissue_name)
            species_group, _ = SpeciesGroup.objects.get_or_create(code=species_code, defaults={'description': f'Mock Entity {species_code}'})
            molecule, _ = Molecule.objects.get_or_create(name=mol_name, defaults={'family_id': 1}) # Needs a valid family ID, assume 1 exists
            
            mrl_limit, created = MRLLimit.objects.get_or_create(
                molecule=molecule, 
                species_group=species_group, 
                tissue=tissue,
                defaults={'mrl_mgkg': 0.0} # Default MRL if we are forcing it to exist
            )
            
            mrl_limit.withdrawal_days = w_days
            mrl_limit.save()
            
            if created:
                records_updated += 1
                print(f"✨ Created NEW & Updated {mol_name} for {species_code} ({tissue_name}) -> {w_days} days")
            else:
                records_updated += 1
                print(f"✅ Updated existing {mol_name} for {species_code} ({tissue_name}) -> {w_days} days")
                
        except Exception as e:
            print(f"❌ Error updating {mol_name} - {species_code}: {str(e)}")

    print("\n--- INJECTION SUMMARY ---")
    print(f"Total updated: {records_updated}")
    print(f"Total skipped: {records_skipped}")
    print("-------------------------\n")

if __name__ == '__main__':
    run()
