from django.http import JsonResponse
from .models import Molecule, SpeciesGroup, MoleculeSpecies

def molecules_by_species(request):
    species_code = request.GET.get('species')
    if not species_code:
        return JsonResponse({'error': 'Species parameter is required'}, status=400)
    
    try:
        species_group = SpeciesGroup.objects.get(code=species_code)
        # Get molecules associated with this species
        molecule_ids = MoleculeSpecies.objects.filter(species_group=species_group).values_list('molecule_id', flat=True)
        molecules = Molecule.objects.filter(id__in=molecule_ids).values('id', 'name').order_by('name')
        
        return JsonResponse(list(molecules), safe=False)
    except SpeciesGroup.DoesNotExist:
        return JsonResponse({'error': 'Invalid species code'}, status=404)
