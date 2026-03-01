import jwt
from django.conf import settings
from django.http import JsonResponse
from .users.models import User

class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # List of paths that don't require authentication
        exempt_paths = [
            '/api/login/',
            '/api/register/',
            '/admin/',
        ]
        
        # Check if the path is exempt
        if any(request.path.startswith(path) for path in exempt_paths):
            return self.get_response(request)

        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authentication credentials were not provided.'}, status=401)

        parts = auth_header.split(' ')
        if len(parts) != 2:
            return JsonResponse({'error': 'Invalid Authorization header format.'}, status=401)
            
        token = parts[1]

        try:
            # Decode token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            if not user_id:
                return JsonResponse({'error': 'Token payload missing user identifier.'}, status=401)
                
            # Attach user to request - use primary key directly
            try:
                request.user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Authorized user not found in system.'}, status=401)
                
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Credentials expired. Please login again.'}, status=401)
        except (jwt.InvalidTokenError, jwt.DecodeError):
            return JsonResponse({'error': 'Invalid authentication token.'}, status=401)
        except Exception:
            # Log full error internally, return generic message to user
            return JsonResponse({'error': 'Authentication process failed.'}, status=401)

        return self.get_response(request)
