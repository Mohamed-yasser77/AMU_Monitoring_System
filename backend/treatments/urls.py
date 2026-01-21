from django.urls import path
from .views import TreatmentListCreateView

urlpatterns = [
    path('', TreatmentListCreateView.as_view(), name='treatment-list-create'),
]
