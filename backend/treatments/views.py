from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Treatment
from farms.models import Farm
import json
from django.core.serializers.json import DjangoJSONEncoder

@method_decorator(csrf_exempt, name='dispatch')
class TreatmentListCreateView(View):
    def get(self, request):
        farm_id = request.GET.get('farm_id')
        email = request.GET.get('email')

        if not farm_id and not email:
            return JsonResponse({'error': 'Farm ID or Email required'}, status=400)
        
        try:
            if farm_id:
                treatments = Treatment.objects.filter(farm_id=farm_id).order_by('-date').values()
            else:
                # Filter by user email
                treatments = Treatment.objects.filter(farm__user__email_address=email).order_by('-date').values(
                    'id', 'antibiotic_name', 'reason', 'treated_for', 'date', 'farm__name', 'farm__farm_number'
                )
            return JsonResponse(list(treatments), safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def post(self, request):
        try:
            data = json.loads(request.body)
            farm_id = data.get('farm')
            
            if not farm_id:
                return JsonResponse({'error': 'Farm ID required'}, status=400)

            farm = Farm.objects.get(id=farm_id)
            
            treatment = Treatment.objects.create(
                farm=farm,
                antibiotic_name=data.get('antibiotic_name'),
                reason=data.get('reason'),
                treated_for=data.get('treated_for'),
                date=data.get('date')
            )
            
            return JsonResponse({'message': 'Treatment logged successfully', 'id': treatment.id}, status=201)
        except Farm.DoesNotExist:
            return JsonResponse({'error': 'Farm not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
