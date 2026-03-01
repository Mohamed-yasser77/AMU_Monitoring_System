from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from django.contrib.auth.hashers import check_password
from django.conf import settings
from .models import User
import json
import jwt
import datetime

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email_address = data.get('email_address')
            password = data.get('password')

            if not all([email_address, password]):
                return JsonResponse({'error': 'Email and password are required.'}, status=400)

            try:
                user = User.objects.get(email_address=email_address)
                
                # Check password using Django's built-in method
                if not user.check_password(password):
                     return JsonResponse({'error': 'Invalid credentials.'}, status=401)
                
                if not user.is_active:
                    return JsonResponse({'error': 'Account is disabled.'}, status=403)

                # Generate JWT
                token_payload = {
                    'user_id': user.id,
                    'email': user.email_address,
                    'role': user.role,
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
                }
                token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm='HS256')

                return JsonResponse({
                    'message': 'Login successful.',
                    'token': token,
                    'user_name': f"{user.first_name} {user.last_name}",
                    'email': user.email_address,
                    'role': user.role,
                    'profile_completed': all([user.state, user.district, user.address, user.phone_number]),
                    'profile': {
                        'state': user.state,
                        'district': user.district,
                        'address': user.address,
                        'phone_number': user.phone_number
                    }
                }, status=200)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid credentials.'}, status=401)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)
        except Exception:
            return JsonResponse({'error': 'Authentication process failed.'}, status=500)
