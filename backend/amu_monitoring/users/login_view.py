from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from .models import User
import json

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
                user = User.objects.get(email_address=email_address, password=password)
                return JsonResponse({'message': 'Login successful.', 'user_name': f"{user.first_name} {user.last_name}"}, status=200)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid email or password.'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
