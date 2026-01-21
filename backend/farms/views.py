from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Farm
import json
from amu_monitoring.users.models import User
from django.forms.models import model_to_dict

@method_decorator(csrf_exempt, name='dispatch')
class FarmListCreateView(View):
    def get(self, request):
        email = request.GET.get('email')
        if not email:
             return JsonResponse({'error': 'User email required'}, status=400)
        
        try:
            user = User.objects.get(email_address=email)
            farms = Farm.objects.filter(user=user).values()
            return JsonResponse(list(farms), safe=False, status=200)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            if not email:
                return JsonResponse({'error': 'User email required'}, status=400)
            
            user = User.objects.get(email_address=email)
            
            farm = Farm.objects.create(
                user=user,
                name=data.get('name'),
                state=data.get('state'),
                village=data.get('village'),
                farm_number=data.get('farm_number'),
                farm_type=data.get('farm_type'),
                species_type=data.get('species_type'),
                total_animals=data.get('total_animals'),
                avg_weight=data.get('avg_weight'),
                avg_feed_consumption=data.get('avg_feed_consumption'),
                avg_water_consumption=data.get('avg_water_consumption')
            )
            return JsonResponse({'message': 'Farm created successfully', 'id': farm.id}, status=201)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class FarmDetailView(View):
    def get(self, request, farm_id):
        try:
            farm = Farm.objects.get(id=farm_id)
            return JsonResponse(model_to_dict(farm), status=200)
        except Farm.DoesNotExist:
            return JsonResponse({'error': 'Farm not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def put(self, request, farm_id):
        try:
            farm = Farm.objects.get(id=farm_id)
            data = json.loads(request.body)
            
            farm.name = data.get('name', farm.name)
            farm.state = data.get('state', farm.state)
            farm.village = data.get('village', farm.village)
            farm.farm_number = data.get('farm_number', farm.farm_number)
            farm.farm_type = data.get('farm_type', farm.farm_type)
            farm.species_type = data.get('species_type', farm.species_type)
            farm.total_animals = data.get('total_animals', farm.total_animals)
            farm.avg_weight = data.get('avg_weight', farm.avg_weight)
            farm.avg_feed_consumption = data.get('avg_feed_consumption', farm.avg_feed_consumption)
            farm.avg_water_consumption = data.get('avg_water_consumption', farm.avg_water_consumption)
            
            farm.save()
            return JsonResponse({'message': 'Farm updated successfully'}, status=200)
        except Farm.DoesNotExist:
            return JsonResponse({'error': 'Farm not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
