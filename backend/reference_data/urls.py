from django.urls import path
from . import views

urlpatterns = [
    path('molecules/', views.molecules_by_species, name='molecules_by_species'),
    path('drugs/', views.drug_list, name='drug_list'),
]
