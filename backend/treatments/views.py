from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Treatment
from farms.models import Farm, Flock, Animal
import json
from django.core.serializers.json import DjangoJSONEncoder
from amu_monitoring.users.models import User
from django.db.models import Count, Q

@method_decorator(csrf_exempt, name='dispatch')
class TreatmentListCreateView(View):
    def get(self, request):
        farm_id = request.GET.get('farm_id')
        email = request.GET.get('email')
        vet_email = request.GET.get('vet_email')
        flock_id = request.GET.get('flock_id')

        if not farm_id and not email and not vet_email:
            return JsonResponse({'error': 'Farm ID, Email or Vet Email required'}, status=400)
        
        try:
            if farm_id:
                qs = Treatment.objects.filter(farm_id=farm_id)
                if flock_id:
                    qs = qs.filter(flock_id=flock_id)
                treatments = qs.order_by('-date').values(
                    'id', 'antibiotic_name', 'dosage', 'method_intake', 'vet_notes', 'reason', 'treated_for', 'date', 'status',
                    'flock_id', 'flock__flock_tag', 'flock__flock_code',
                    'animal_id', 'animal__animal_tag',
                )
                return JsonResponse(list(treatments), safe=False, status=200)

            elif vet_email:
                try:
                    vet = User.objects.get(email_address=vet_email, role='vet')
                    active_count = Treatment.objects.filter(vet=vet, status='pending').count()
                    if active_count < 7:
                        unassigned = None
                        if vet.district:
                            unassigned = Treatment.objects.filter(
                                farm__district=vet.district,
                                vet__isnull=True,
                                status='pending'
                            ).first()
                            
                        # Fallback to any unassigned
                        if not unassigned:
                            unassigned = Treatment.objects.filter(
                                vet__isnull=True,
                                status='pending'
                            ).first()
                            
                        if unassigned:
                            unassigned.vet = vet
                            unassigned.save()

                    base_fields = (
                        'id', 'antibiotic_name', 'dosage', 'method_intake', 'vet_notes', 'reason', 'treated_for', 'date',
                        'farm__name', 'farm__farm_number', 'farm__village', 'farm__district', 'status',
                        'flock_id', 'flock__flock_tag', 'animal_id', 'animal__animal_tag', 'recorded_by__role',
                        'flock__species_type', 'flock__avg_weight', 'flock__avg_feed_consumption', 'flock__avg_water_consumption'
                    )
                    pending_treatments = Treatment.objects.filter(vet=vet, status='pending').order_by('date').values(*base_fields)
                    history_treatments = Treatment.objects.filter(vet=vet, status='approved').order_by('-date')[:10].values(*base_fields)

                    return JsonResponse({
                        'pending': list(pending_treatments),
                        'history': list(history_treatments)
                    }, status=200)
                except User.DoesNotExist:
                    return JsonResponse({'error': 'Vet not found'}, status=404)

            else:
                # Operator / farmer dashboard - filter by user email
                treatments = Treatment.objects.filter(
                    farm__user__email_address=email
                ).order_by('-date').values(
                    'id', 'antibiotic_name', 'dosage', 'method_intake', 'vet_notes', 'reason', 'treated_for', 'date',
                    'farm__name', 'farm__farm_number', 'status',
                    'flock_id', 'flock__flock_tag', 'flock__flock_code',
                    'animal_id', 'animal__animal_tag', 'recorded_by__role'
                )
                return JsonResponse(list(treatments), safe=False, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            farm_id = data.get('farm')
            flock_id = data.get('flock_id')
            animal_id = data.get('animal_id')
            
            if not farm_id:
                return JsonResponse({'error': 'Farm ID required'}, status=400)
            if not email:
                return JsonResponse({'error': 'User email required'}, status=400)

            user = User.objects.get(email_address=email)
            farm = Farm.objects.get(id=farm_id)

            flock = None
            animal = None

            if flock_id:
                flock = Flock.objects.get(id=flock_id)
                # Validate flock belongs to this farm
                if flock.farm_id != farm.id:
                    return JsonResponse({'error': 'Flock does not belong to this farm'}, status=400)

            if animal_id:
                if not flock:
                    return JsonResponse({'error': 'flock_id required when animal_id is provided'}, status=400)
                animal = Animal.objects.get(id=animal_id, flock=flock)

            # Auto-assign vet by district
            assigned_vet = None
            vets = User.objects.filter(role='vet')
            
            if farm.district:
                for vet in vets.filter(district=farm.district):
                    pending_count = Treatment.objects.filter(vet=vet, status='pending').count()
                    if pending_count < 7:
                        assigned_vet = vet
                        break
            
            # Fallback if no district match or no capacity in district
            if not assigned_vet:
                for vet in vets:
                    pending_count = Treatment.objects.filter(vet=vet, status='pending').count()
                    if pending_count < 7:
                        assigned_vet = vet
                        break
            
            treatment = Treatment.objects.create(
                farm=farm,
                flock=flock,
                animal=animal,
                vet=assigned_vet,
                recorded_by=user,
                status='pending',
                antibiotic_name=data.get('antibiotic_name'),
                dosage=data.get('dosage'),
                method_intake=data.get('method_intake'),
                vet_notes=data.get('vet_notes'),
                reason=data.get('reason'),
                treated_for=data.get('treated_for'),
                date=data.get('date')
            )
            
            return JsonResponse({
                'message': 'Treatment logged successfully',
                'id': treatment.id,
                'flock_id': treatment.flock_id,
                'animal_id': treatment.animal_id,
            }, status=201)

        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Farm.DoesNotExist:
            return JsonResponse({'error': 'Farm not found'}, status=404)
        except Flock.DoesNotExist:
            return JsonResponse({'error': 'Flock not found'}, status=404)
        except Animal.DoesNotExist:
            return JsonResponse({'error': 'Animal not found in specified flock'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class TreatmentActionView(View):
    def post(self, request, treatment_id):
        try:
            data = json.loads(request.body)
            action = data.get('action')  # 'approve' or 'reject'
            
            if action not in ['approve', 'reject']:
                return JsonResponse({'error': 'Invalid action'}, status=400)

            treatment = Treatment.objects.get(id=treatment_id)
            
            if action == 'approve':
                treatment.status = 'approved'
                # Clinical overrides/modifications
                if data.get('antibiotic_name'): treatment.antibiotic_name = data.get('antibiotic_name')
                if data.get('reason'): treatment.reason = data.get('reason')
                if data.get('treated_for'): treatment.treated_for = data.get('treated_for')
                if data.get('dosage'): treatment.dosage = data.get('dosage')
                if data.get('method_intake'): treatment.method_intake = data.get('method_intake')
                if data.get('vet_notes'): treatment.vet_notes = data.get('vet_notes')
            elif action == 'reject':
                treatment.status = 'rejected'
                if data.get('vet_notes'): treatment.vet_notes = data.get('vet_notes')
            
            treatment.save()
            return JsonResponse({'message': f'Treatment {action}d successfully'}, status=200)

        except Treatment.DoesNotExist:
            return JsonResponse({'error': 'Treatment not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class PrescriptionCreateView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('vet_email')
            farm_id = data.get('farm')
            flock_id = data.get('flock_id')
            animal_id = data.get('animal_id')
            
            if not farm_id:
                return JsonResponse({'error': 'Farm ID required'}, status=400)
            if not email:
                return JsonResponse({'error': 'Vet email required'}, status=400)

            # Ensure user is a vet
            vet = User.objects.get(email_address=email, role='vet')
            farm = Farm.objects.get(id=farm_id)

            flock = None
            animal = None

            if flock_id:
                flock = Flock.objects.get(id=flock_id)
                if flock.farm_id != farm.id:
                    return JsonResponse({'error': 'Flock does not belong to this farm'}, status=400)

            if animal_id:
                if not flock:
                    return JsonResponse({'error': 'flock_id required when animal_id is provided'}, status=400)
                animal = Animal.objects.get(id=animal_id, flock=flock)

            treatment = Treatment.objects.create(
                farm=farm,
                flock=flock,
                animal=animal,
                vet=vet,
                recorded_by=vet,
                status='approved',
                antibiotic_name=data.get('antibiotic_name'),
                dosage=data.get('dosage'),
                method_intake=data.get('method_intake'),
                vet_notes=data.get('vet_notes'),
                reason=data.get('reason'),
                treated_for=data.get('treated_for'),
                date=data.get('date')
            )
            
            return JsonResponse({
                'message': 'Prescription logged successfully',
                'id': treatment.id,
            }, status=201)

        except User.DoesNotExist:
            return JsonResponse({'error': 'Vet not found or invalid role'}, status=404)
        except Farm.DoesNotExist:
            return JsonResponse({'error': 'Farm not found'}, status=404)
        except Flock.DoesNotExist:
            return JsonResponse({'error': 'Flock not found'}, status=404)
        except Animal.DoesNotExist:
            return JsonResponse({'error': 'Animal not found in specified flock'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
