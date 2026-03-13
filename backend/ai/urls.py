from django.urls import path
from .views import RegulatoryQueryView, HarvestForecastView

urlpatterns = [
    path('regulatory-query/', RegulatoryQueryView.as_view(), name='ai-regulatory-query'),
    path('harvest-forecast/', HarvestForecastView.as_view(), name='ai-harvest-forecast'),
]
