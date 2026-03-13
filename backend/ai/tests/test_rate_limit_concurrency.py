
import os
import django
import sys
import threading
from django.utils import timezone

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

from ai.views import _check_rate_limit
from amu_monitoring.users.models import User
from django.core.cache import cache

def test_concurrent_rate_limit():
    print("Testing Concurrent Rate Limiting...")
    
    # Get or create a test user
    user, _ = User.objects.get_or_create(username="test_limit_user", email="test@example.com")
    
    # Reset cache for this user
    key = f"ai_limit_{user.id}_{timezone.now().date()}"
    cache.delete(key)
    
    results = []
    
    def attempt_query():
        results.append(_check_rate_limit(user))
    
    # Spawn 25 threads (limit is 20)
    threads = []
    for _ in range(25):
        t = threading.Thread(target=attempt_query)
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    
    success_count = results.count(True)
    fail_count = results.count(False)
    
    print(f"Total Attempts: {len(results)}")
    print(f"Successes: {success_count} (Expected: 20)")
    print(f"Failures: {fail_count} (Expected: 5)")
    
    if success_count == 20:
        print("PASS: Rate limit held firm.")
    elif success_count > 20:
        print(f"FAIL: Race condition allowed {success_count} requests!")
    else:
        print(f"Inconsistent result: {success_count} successes.")

if __name__ == "__main__":
    test_concurrent_rate_limit()
