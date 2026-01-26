from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from .models import User
from django.contrib.auth.hashers import make_password
import json
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(View):
    def post(self, request):
        try:
            print("RegisterView POST request received")
            data = json.loads(request.body)
            print(f"Request data: {data}")
            
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            email_address = data.get('email_address')
            password = data.get('password')
            role = data.get('role')

            if not all([first_name, last_name, email_address, password, role]):
                print("Missing fields")
                return JsonResponse({'error': 'All fields are required.'}, status=400)
            
            valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
            if role not in valid_roles:
                return JsonResponse({'error': 'Invalid role selected.'}, status=400)

            if User.objects.filter(email_address=email_address).exists():
                print(f"User already exists: {email_address}")
                return JsonResponse({'error': 'Email already registered.'}, status=400)

            print(f"Creating user: {email_address} with role {role}")
            hashed_password = make_password(password)
            user = User.objects.create(
                first_name=first_name,
                last_name=last_name,
                email_address=email_address,
                password=hashed_password,
                role=role
            )
            print(f"User created successfully with ID: {user.id}")
            return JsonResponse({'message': 'User registered successfully.'}, status=201)
        except Exception as e:
            print(f"Exception in RegisterView: {e}")
            return JsonResponse({'error': str(e)}, status=500)
