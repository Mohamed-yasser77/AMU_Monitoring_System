from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.db.models import Q
from django.db import transaction
from .models import Farm, Owner, Flock, Animal, Problem
from treatments.models import Treatment
from reference_data.models import MRLLimit
import json
from amu_monitoring.users.models import User
from datetime import timedelta, date


@method_decorator(csrf_exempt, name='dispatch')
class FarmListCreateView(View):
    def get(self, request):
        email = request.GET.get('email')
        if not email:
            return JsonResponse({'error': 'User email required'}, status=400)

        try:
            user = User.objects.get(email_address=email)
            if user.role == 'vet':
                # Vets can see all farms to provide prescriptions
                farms = Farm.objects.all().values()
            else:
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

            owner = None
            owner_id = data.get('owner_id')
            owner_name = data.get('owner_name')
            
            if owner_id:
                try:
                    owner = Owner.objects.get(id=owner_id)
                except Owner.DoesNotExist:
                    return JsonResponse({'error': 'Owner not found'}, status=404)
            elif owner_name:
                owner = Owner.objects.create(
                    name=owner_name,
                    email=data.get('owner_email'),
                    phone_number=data.get('owner_phone_number'),
                    address=data.get('owner_address'),
                    created_by=user,
                )

            farm = Farm.objects.create(
                user=user,
                owner=owner,
                name=data.get('name'),
                state=data.get('state'),
                district=data.get('district'),
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
            data = model_to_dict(farm)
            
            # Add flock data with withdrawal status
            flocks_data = []
            for flock in farm.flocks.all():
                status = flock.withdrawal_status
                flocks_data.append({
                    'id': flock.id,
                    'flock_tag': flock.flock_tag,
                    'species_type': flock.species_type,
                    'size': flock.size,
                    'age_in_weeks': flock.age_in_weeks,
                    'is_under_withdrawal': status['is_under_withdrawal'],
                    'safe_harvest_date': status['safe_harvest_date'],
                })
            data['flocks'] = flocks_data
            return JsonResponse(data, status=200)
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
            farm.district = data.get('district', farm.district)
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


@method_decorator(csrf_exempt, name='dispatch')
class OwnerListCreateView(View):
    def get(self, request):
        email = request.GET.get('email')
        query = request.GET.get('q', '')
        if not email:
            return JsonResponse({'error': 'User email required'}, status=400)

        try:
            user = User.objects.get(email_address=email)
            if user.role not in ['data_operator', 'vet', 'regulator']:
                return JsonResponse({'error': 'Not authorized'}, status=403)

            owners = Owner.objects.all()
            if user.role == 'data_operator':
                owners = owners.filter(created_by=user)
            
            if query:
                owners = owners.filter(
                    Q(name__icontains=query)
                    | Q(phone_number__icontains=query)
                ).distinct()

            data = []
            for owner in owners:
                farm_names = list(owner.farms.values_list('name', flat=True))
                data.append(
                    {
                        'id': owner.id,
                        'name': owner.name,
                        'email': owner.email,
                        'phone_number': owner.phone_number,
                        'farms': farm_names,
                    }
                )
            return JsonResponse(data, safe=False, status=200)
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

            user = User.objects.get(email_address=email, role='data_operator')

            owner = Owner.objects.create(
                name=data.get('name'),
                email=data.get('email'),
                phone_number=data.get('phone_number'),
                address=data.get('address'),
                created_by=user,
            )
            return JsonResponse({'id': owner.id}, status=201)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Data operator not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class OwnerDetailView(View):
    def get(self, request, owner_id):
        email = request.GET.get('email')
        if not email:
            return JsonResponse({'error': 'User email required'}, status=400)

        try:
            user = User.objects.get(email_address=email)
            if user.role not in ['data_operator', 'vet', 'regulator']:
                return JsonResponse({'error': 'Not authorized'}, status=403)

            owner = Owner.objects.get(id=owner_id)
            flocks = owner.flocks.all().select_related('farm')
            problems = owner.problems.select_related('flock', 'animal')

            flocks_data = []
            for flock in flocks:
                status = flock.withdrawal_status
                animals_data = []
                for animal in flock.animals.all():
                    animals_data.append({
                        'id': animal.id,
                        'animal_tag': animal.animal_tag,
                        'date_of_birth': animal.date_of_birth.isoformat() if animal.date_of_birth else None,
                        'sex': animal.sex,
                    })
                
                flocks_data.append({
                    'id': flock.id,
                    'flock_tag': flock.flock_tag,
                    'species_type': flock.species_type,
                    'size': flock.size,
                    'age_in_weeks': flock.age_in_weeks, # Uses property now
                    'farm_id': flock.farm_id,
                    'animals': animals_data,
                    'is_under_withdrawal': status['is_under_withdrawal'],
                    'safe_harvest_date': status['safe_harvest_date'],
                })

            problems_data = []
            for problem in problems:
                problems_data.append(
                    {
                        'id': problem.id,
                        'description': problem.description,
                        'severity': problem.severity,
                        'date_reported': problem.date_reported.isoformat(),
                        'flock_id': problem.flock_id,
                        'animal_id': problem.animal_id,
                    }
                )

            data = {
                'id': owner.id,
                'name': owner.name,
                'email': owner.email,
                'phone_number': owner.phone_number,
                'address': owner.address,
                'flocks': flocks_data,
                'problems': problems_data,
            }
            return JsonResponse(data, status=200)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Owner.DoesNotExist:
            return JsonResponse({'error': 'Owner not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def put(self, request, owner_id):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            if not email:
                return JsonResponse({'error': 'User email required'}, status=400)

            user = User.objects.get(email_address=email, role='data_operator')
            owner = Owner.objects.get(id=owner_id)

            owner.name = data.get('name', owner.name)
            owner.phone_number = data.get('phone_number', owner.phone_number)
            owner.state = data.get('state', owner.state)
            owner.district = data.get('district', owner.district)
            owner.village = data.get('village', owner.village)
            owner.address = data.get('address', owner.address)

            owner.save()
            return JsonResponse({'message': 'Owner updated successfully'}, status=200)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Data operator not found'}, status=404)
        except Owner.DoesNotExist:
            return JsonResponse({'error': 'Owner not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class FlockListCreateView(View):
    def get(self, request):
        email = request.GET.get('email')
        owner_id = request.GET.get('owner_id')
        farm_id = request.GET.get('farm_id')
        if not email:
            return JsonResponse({'error': 'User email required'}, status=400)

        try:
            user = User.objects.get(email_address=email)
            if user.role not in ['data_operator', 'vet', 'regulator']:
                return JsonResponse({'error': 'Not authorized'}, status=403)

            flocks = Flock.objects.all()
            if user.role == 'data_operator':
                flocks = flocks.filter(farm__user=user)
                
            if owner_id:
                flocks = flocks.filter(owner_id=owner_id)
            if farm_id:
                flocks = flocks.filter(farm_id=farm_id)

            data = []
            for flock in flocks:
                status = flock.withdrawal_status
                data.append(
                    {
                        'id': flock.id,
                        'owner_id': flock.owner_id,
                        'farm_id': flock.farm_id,
                        'farm_name': flock.farm.name if flock.farm else 'N/A',
                        'flock_tag': flock.flock_tag,
                        'species_type': flock.species_type,
                        'size': flock.size,
                        'age_in_weeks': flock.age_in_weeks,
                        'safe_harvest_date': status['safe_harvest_date'],
                        'is_under_withdrawal': status['is_under_withdrawal'],
                    }
                )
            return JsonResponse(data, safe=False, status=200)
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

            user = User.objects.get(email_address=email, role='data_operator')

            owner_id = data.get('owner_id')
            if not owner_id:
                return JsonResponse({'error': 'Owner id required'}, status=400)

            owner = Owner.objects.get(id=owner_id)
            farm_id = data.get('farm_id')
            farm = None
            if farm_id:
                farm = Farm.objects.get(id=farm_id)

            flock = Flock.objects.create(
                owner=owner,
                farm=farm,
                flock_tag=data.get('flock_tag'),
                species_type=data.get('species_type'),
                size=data.get('size'),
                initial_age_in_weeks=data.get('age_in_weeks'), # Map to initial
            )
            return JsonResponse({'id': flock.id}, status=201)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Data operator not found'}, status=404)
        except Owner.DoesNotExist:
            return JsonResponse({'error': 'Owner not found'}, status=404)
        except Farm.DoesNotExist:
            return JsonResponse({'error': 'Farm not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class AnimalListCreateView(View):
    def get(self, request):
        email = request.GET.get('email')
        flock_id = request.GET.get('flock_id')
        if not email:
            return JsonResponse({'error': 'User email required'}, status=400)

        try:
            user = User.objects.get(email_address=email)
            if user.role not in ['data_operator', 'vet', 'regulator']:
                return JsonResponse({'error': 'Not authorized'}, status=403)

            animals = Animal.objects.all()
            if user.role == 'data_operator':
                animals = animals.filter(flock__farm__user=user)
            
            if flock_id:
                animals = animals.filter(flock_id=flock_id)

            data = []
            for animal in animals:
                data.append(
                    {
                        'id': animal.id,
                        'flock_id': animal.flock_id,
                        'animal_tag': animal.animal_tag,
                        'date_of_birth': animal.date_of_birth.isoformat() if animal.date_of_birth else None,
                        'sex': animal.sex,
                    }
                )
            return JsonResponse(data, safe=False, status=200)
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

            user = User.objects.get(email_address=email, role='data_operator')

            flock_id = data.get('flock_id')
            if not flock_id:
                return JsonResponse({'error': 'Flock id required'}, status=400)

            flock = Flock.objects.get(id=flock_id)

            animal = Animal.objects.create(
                flock=flock,
                animal_tag=data.get('animal_tag'),
                date_of_birth=data.get('date_of_birth'),
                sex=data.get('sex'),
            )
            return JsonResponse({'id': animal.id}, status=201)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Data operator not found'}, status=404)
        except Flock.DoesNotExist:
            return JsonResponse({'error': 'Flock not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ProblemListCreateView(View):
    def get(self, request):
        email = request.GET.get('email')
        owner_id = request.GET.get('owner_id')
        flock_id = request.GET.get('flock_id')
        animal_id = request.GET.get('animal_id')
        if not email:
            return JsonResponse({'error': 'User email required'}, status=400)

        try:
            user = User.objects.get(email_address=email)
            if user.role not in ['data_operator', 'vet', 'regulator']:
                return JsonResponse({'error': 'Not authorized'}, status=403)

            problems = Problem.objects.all()
            if user.role == 'data_operator':
                problems = problems.filter(owner__created_by=user)

            if owner_id:
                problems = problems.filter(owner_id=owner_id)
            if flock_id:
                problems = problems.filter(flock_id=flock_id)
            if animal_id:
                problems = problems.filter(animal_id=animal_id)

            data = []
            for problem in problems:
                data.append(
                    {
                        'id': problem.id,
                        'owner_id': problem.owner_id,
                        'flock_id': problem.flock_id,
                        'animal_id': problem.animal_id,
                        'description': problem.description,
                        'severity': problem.severity,
                        'date_reported': problem.date_reported.isoformat(),
                    }
                )
            return JsonResponse(data, safe=False, status=200)
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

            user = User.objects.get(email_address=email, role='data_operator')

            owner_id = data.get('owner_id')
            if not owner_id:
                return JsonResponse({'error': 'Owner id required'}, status=400)

            owner = Owner.objects.get(id=owner_id)

            flock_id = data.get('flock_id')
            animal_id = data.get('animal_id')

            flock = None
            animal = None

            if flock_id:
                flock = Flock.objects.get(id=flock_id)
            if animal_id:
                animal = Animal.objects.get(id=animal_id)

            problem = Problem.objects.create(
                owner=owner,
                flock=flock,
                animal=animal,
                description=data.get('description'),
                severity=data.get('severity', 'medium'),
                reported_by=user,
            )
            return JsonResponse({'id': problem.id}, status=201)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Data operator not found'}, status=404)
        except Owner.DoesNotExist:
            return JsonResponse({'error': 'Owner not found'}, status=404)
        except Flock.DoesNotExist:
            return JsonResponse({'error': 'Flock not found'}, status=404)
        except Animal.DoesNotExist:
            return JsonResponse({'error': 'Animal not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class BulkFlockCreateView(View):
    """
    POST /api/flocks/bulk/

    Payload:
    {
        "email": "operator@example.com",
        "farm_id": 1,
        "owner_id": 1,
        "flock_code": "FLK01",
        "species_type": "AVI",
        "count": 500,
        "age_in_weeks": 4   (optional)
    }

    Behaviour:
    - Validates operator, farm, owner
    - Composes flock_tag = farm.farm_number + "-" + flock_code
    - Creates Flock record
    - Bulk-creates `count` Animal records with tags:
        {farm_number}-{flock_code}-001 ... {farm_number}-{flock_code}-{count:03d}
    - Increments farm.total_animals by count
    - Returns flock details + animals_created count
    """
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            if not email:
                return JsonResponse({'error': 'User email required'}, status=400)

            user = User.objects.get(email_address=email, role='data_operator')

            farm_id = data.get('farm_id')
            owner_id = data.get('owner_id')
            flock_code = data.get('flock_code', '').strip().upper()
            species_type = data.get('species_type')
            count = data.get('count')
            age_in_weeks = data.get('age_in_weeks')
            
            # New Metrics
            avg_weight = data.get('avg_weight', 0.0)
            avg_feed_consumption = data.get('avg_feed_consumption', 0.0)
            avg_water_consumption = data.get('avg_water_consumption', 0.0)

            # Validate required fields
            if not all([farm_id, owner_id, flock_code, species_type, count]):
                return JsonResponse({'error': 'farm_id, owner_id, flock_code, species_type, and count are required'}, status=400)

            try:
                count = int(count)
                if count <= 0:
                    raise ValueError
            except (TypeError, ValueError):
                return JsonResponse({'error': 'count must be a positive integer'}, status=400)

            if count > 10000:
                return JsonResponse({'error': 'Maximum 10,000 animals per bulk entry'}, status=400)

            farm = Farm.objects.get(id=farm_id, user=user)
            owner = Owner.objects.get(id=owner_id)

            # Check flock_code uniqueness on this farm
            if Flock.objects.filter(farm=farm, flock_code=flock_code).exists():
                return JsonResponse({'error': f'Flock code "{flock_code}" already exists on this farm'}, status=400)

            flock_tag = f"{farm.farm_number}-{flock_code}"

            with transaction.atomic():
                # Calculate date_of_birth from input age
                dob = date.today()
                if age_in_weeks:
                    try:
                        weeks = int(age_in_weeks)
                        dob = date.today() - timedelta(weeks=weeks)
                    except (ValueError, TypeError):
                        pass

                # Create the flock
                flock = Flock.objects.create(
                    owner=owner,
                    farm=farm,
                    flock_code=flock_code,
                    flock_tag=flock_tag,
                    species_type=species_type,
                    size=count,
                    initial_age_in_weeks=age_in_weeks,
                    date_of_birth=dob,
                    avg_weight=float(avg_weight),
                    avg_feed_consumption=float(avg_feed_consumption),
                    avg_water_consumption=float(avg_water_consumption),
                )

                # Bulk-create animals with auto-generated tags
                animals = [
                    Animal(
                        flock=flock,
                        animal_tag=f"{flock_tag}-{i:03d}",
                    )
                    for i in range(1, count + 1)
                ]
                Animal.objects.bulk_create(animals)

                # Increment farm total_animals
                farm.total_animals += count
                farm.save(update_fields=['total_animals'])

            return JsonResponse({
                'message': 'Flock created successfully',
                'flock_id': flock.id,
                'flock_tag': flock_tag,
                'flock_code': flock_code,
                'species_type': species_type,
                'animals_created': count,
                'tag_range': f"{flock_tag}-001 to {flock_tag}-{count:03d}",
            }, status=201)

        except User.DoesNotExist:
            return JsonResponse({'error': 'Data operator not found'}, status=404)
        except Farm.DoesNotExist:
            return JsonResponse({'error': 'Farm not found or not owned by this operator'}, status=404)
        except Owner.DoesNotExist:
            return JsonResponse({'error': 'Owner not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def get(self, request):
        """List all flocks with animal count for a given farm."""
        email = request.GET.get('email')
        farm_id = request.GET.get('farm_id')
        if not email:
            return JsonResponse({'error': 'User email required'}, status=400)
        try:
            user = User.objects.get(email_address=email)
            flocks = Flock.objects.filter(farm__user=user)
            if farm_id:
                flocks = flocks.filter(farm_id=farm_id)
            data = []
            for f in flocks:
                data.append({
                    'id': f.id,
                    'flock_code': f.flock_code,
                    'flock_tag': f.flock_tag,
                    'species_type': f.species_type,
                    'size': f.size,
                    'age_in_weeks': f.age_in_weeks,
                    'farm_id': f.farm_id,
                    'owner_id': f.owner_id,
                })
            return JsonResponse(data, safe=False, status=200)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
