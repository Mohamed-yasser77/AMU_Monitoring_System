from django.http import JsonResponse
from .models import Molecule, SpeciesGroup, MoleculeSpecies, MRLLimit

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

def drug_list(request):
    molecules = Molecule.objects.select_related('family').prefetch_related('mrllimit_set__species_group', 'mrllimit_set__tissue').all().order_by('name')
    
    data = []
    for mol in molecules:
        mrls = []
        for mrl in mol.mrllimit_set.all():
            mrls.append({
                'species': mrl.species_group.code,
                'tissue': mrl.tissue.name,
                'limit': mrl.mrl_mgkg
            })
            
        data.append({
            'id': mol.id,
            'name': mol.name,
            'family': mol.family.name,
            'category': mol.family.category,
            'comments': mol.family.comments,
            'mrls': mrls
        })
        
    return JsonResponse(data, safe=False)
