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
                
                # Check password
                if not check_password(password, user.password):
                    # Fallback for legacy plaintext passwords (optional, but good for transition)
                    if user.password == password:
                        # Auto-migrate to hash
                        from django.contrib.auth.hashers import make_password
                        user.password = make_password(password)
                        user.save()
                    else:
                        return JsonResponse({'error': 'Invalid email or password.'}, status=401)
                
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
                return JsonResponse({'error': 'Invalid email or password.'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
