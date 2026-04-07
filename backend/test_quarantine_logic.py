import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

from farms.models import Flock
from treatments.models import Treatment
from reference_data.models import Molecule, SpeciesGroup

def test_withdrawal_status():
    print("Testing Approved-Only Quarantine Logic...")
    
    # Get or create a test flock
    flock = Flock.objects.first()
    if not flock:
        print("No flocks found to test with.")
        return

    # Clear existing treatments for a clean test (optional, but safer for a script)
    # Treatment.objects.filter(flock=flock).delete()
    
    print(f"Testing with Flock: {flock.flock_tag}")
    
    # 1. Check initial status
    status = flock.withdrawal_status
    print(f"Initial status: {'Quarantine' if status['is_under_withdrawal'] else 'Cleared'}")

    from amu_monitoring.users.models import User
    user = User.objects.first()
    if not user:
        print("No users found to test with.")
        return

    # 2. Add a PENDING treatment
    t_pending = Treatment.objects.create(
        farm=flock.farm,
        flock=flock,
        antibiotic_name="Amoxicillin",
        reason="treat_disease",
        treated_for="respiratory",
        date=date.today(),
        status='pending',
        recorded_by=user
    )
    
    status_after_pending = flock.withdrawal_status
    print(f"Status after PENDING treatment: {'Quarantine' if status_after_pending['is_under_withdrawal'] else 'Cleared'}")
    
    if status_after_pending['is_under_withdrawal']:
        print("ERROR: Pending treatment triggered quarantine!")
    else:
        print("SUCCESS: Pending treatment did not trigger quarantine.")

    # 3. Approve the treatment
    t_pending.status = 'approved'
    t_pending.save()
    
    status_after_approved = flock.withdrawal_status
    print(f"Status after APPROVED treatment: {'Quarantine' if status_after_approved['is_under_withdrawal'] else 'Cleared'}")
    
    if status_after_approved['is_under_withdrawal']:
        print("SUCCESS: Approved treatment triggered quarantine.")
    else:
        print("ERROR: Approved treatment did not trigger quarantine!")

    # Cleanup
    t_pending.delete()

if __name__ == "__main__":
    test_withdrawal_status()
