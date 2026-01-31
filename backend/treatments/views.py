from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Treatment
from farms.models import Farm
import json
from django.core.serializers.json import DjangoJSONEncoder
from amu_monitoring.users.models import User
from django.db.models import Count, Q

@method_decorator(csrf_exempt, name='dispatch')
class TreatmentListCreateView(View):
    def get(self, request):
        farm_id = request.GET.get('farm_id')
        email = request.GET.get('email')
        vet_email = request.GET.get('vet_email') # For vet dashboard

        if not farm_id and not email and not vet_email:
            return JsonResponse({'error': 'Farm ID, Email or Vet Email required'}, status=400)
        
        try:
            if farm_id:
                treatments = Treatment.objects.filter(farm_id=farm_id).order_by('-date').values()
            elif vet_email:
                # For Vet Dashboard: Get assigned treatments
                try:
                    vet = User.objects.get(email_address=vet_email, role='vet')
                    # Check for unassigned treatments in vet's district if vet has capacity
                    # This is "Lazy Assignment" to pick up queued items
                    active_count = Treatment.objects.filter(vet=vet, status='pending').count()
                    if active_count < 7 and vet.district:
                         # Find unassigned pending treatments in district
                         unassigned = Treatment.objects.filter(
                             farm__district=vet.district,
                             vet__isnull=True,
                             status='pending'
                         ).first() # Just pick one
                         
                         if unassigned:
                             unassigned.vet = vet
                             unassigned.save()

                    pending_treatments = Treatment.objects.filter(vet=vet, status='pending').order_by('date').values(
                        'id', 'antibiotic_name', 'reason', 'treated_for', 'date', 
                        'farm__name', 'farm__farm_number', 'farm__village', 'farm__district', 'status'
                    )
                    
                    history_treatments = Treatment.objects.filter(vet=vet, status='approved').order_by('-date')[:10].values(
                        'id', 'antibiotic_name', 'reason', 'treated_for', 'date', 
                        'farm__name', 'farm__farm_number', 'farm__village', 'farm__district', 'status'
                    )
                    
                    return JsonResponse({
                        'pending': list(pending_treatments),
                        'history': list(history_treatments)
                    }, status=200)
                except User.DoesNotExist:
                     return JsonResponse({'error': 'Vet not found'}, status=404)
            else:
                # Filter by user email (Farmer Dashboard)
                treatments = Treatment.objects.filter(farm__user__email_address=email).order_by('-date').values(
                    'id', 'antibiotic_name', 'reason', 'treated_for', 'date', 'farm__name', 'farm__farm_number', 'status'
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
            
            # Auto-assign vet
            assigned_vet = None
            if farm.district:
                # Find vets in district with < 7 pending treatments
                vets = User.objects.filter(role='vet', district=farm.district)
                for vet in vets:
                    pending_count = Treatment.objects.filter(vet=vet, status='pending').count()
                    if pending_count < 7:
                        assigned_vet = vet
                        break
            
            treatment = Treatment.objects.create(
                farm=farm,
                vet=assigned_vet,
                status='pending',
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

@method_decorator(csrf_exempt, name='dispatch')
class TreatmentActionView(View):
    def post(self, request, treatment_id):
        try:
            data = json.loads(request.body)
            action = data.get('action') # 'approve' or 'reject'
            
            if action not in ['approve', 'reject']:
                 return JsonResponse({'error': 'Invalid action'}, status=400)

            treatment = Treatment.objects.get(id=treatment_id)
            
            if action == 'approve':
                treatment.status = 'approved'
            elif action == 'reject':
                treatment.status = 'rejected'
            
            treatment.save()
            return JsonResponse({'message': f'Treatment {action}d successfully'}, status=200)

        except Treatment.DoesNotExist:
            return JsonResponse({'error': 'Treatment not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
