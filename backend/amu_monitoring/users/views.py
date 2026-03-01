from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from .models import User
from django.contrib.auth.hashers import make_password
import json
import logging

logger = logging.getLogger(__name__)
from amu_monitoring.utils import login_required_json

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            email_address = data.get('email_address')
            password = data.get('password')
            role = data.get('role')

            if not all([first_name, last_name, email_address, password, role]):
                return JsonResponse({'error': 'All fields are required.'}, status=400)
            
            valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
            if role not in valid_roles:
                return JsonResponse({'error': 'Invalid role selected.'}, status=400)

            if User.objects.filter(email_address=email_address).exists():
                return JsonResponse({'error': 'Email already registered.'}, status=400)

            hashed_password = make_password(password)
            user = User.objects.create(
                first_name=first_name,
                last_name=last_name,
                email_address=email_address,
                password=hashed_password,
                role=role
            )
            return JsonResponse({'message': 'User registered successfully.', 'user_id': user.id}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON payload.'}, status=400)
        except Exception:
            return JsonResponse({'error': 'An unexpected error occurred during registration.'}, status=500)

@method_decorator(login_required_json, name='dispatch')
class UpdateProfileView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            user = request.user

            # Update fields
            if 'state' in data: user.state = data['state']
            if 'district' in data: user.district = data['district']
            if 'address' in data: user.address = data['address']
            if 'phone_number' in data: user.phone_number = data['phone_number']
            
            user.save()
            
            return JsonResponse({
                'message': 'Profile updated successfully.',
                'user': {
                    'state': user.state,
                    'district': user.district,
                    'address': user.address,
                    'phone_number': user.phone_number
                }
            }, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
