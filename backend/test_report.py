import os
import django
from django.test import RequestFactory
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

from farms.views import OperatorReportView
from amu_monitoring.users.models import User

def test_view():
    factory = RequestFactory()
    # Find a data operator user
    user = User.objects.filter(role='data_operator').first()
    if not user:
        print("No Data Operator user found in DB. Test cannot proceed.")
        return

    request = factory.get('/api/operator-report/')
    request.user = user
    
    view = OperatorReportView.as_view()
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("PDF generation successful!")
            with open('test_report_output_debug.pdf', 'wb') as f:
                f.write(response.content)
            print("Saved to test_report_output_debug.pdf")
        else:
            print(f"Error Content: {response.content}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_view()
