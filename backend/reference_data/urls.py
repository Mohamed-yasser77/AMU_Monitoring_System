from django.urls import path
from . import views

urlpatterns = [
    path('molecules/', views.molecules_by_species, name='molecules_by_species'),
]
