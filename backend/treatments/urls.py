from django.urls import path
from .views import TreatmentListCreateView, TreatmentActionView, PrescriptionCreateView

urlpatterns = [
    path('', TreatmentListCreateView.as_view(), name='treatment-list-create'),
    path('<int:treatment_id>/action/', TreatmentActionView.as_view(), name='treatment-action'),
    path('prescribe/', PrescriptionCreateView.as_view(), name='prescription-create'),
]
