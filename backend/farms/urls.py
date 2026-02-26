from django.urls import path
from .views import (
    FarmListCreateView,
    FarmDetailView,
    OwnerListCreateView,
    OwnerDetailView,
    FlockListCreateView,
    BulkFlockCreateView,
    AnimalListCreateView,
    ProblemListCreateView,
)

urlpatterns = [
    path('farms/', FarmListCreateView.as_view(), name='farm-list-create'),
    path('farms/<int:farm_id>/', FarmDetailView.as_view(), name='farm-detail'),
    path('owners/', OwnerListCreateView.as_view(), name='owner-list-create'),
    path('owners/<int:owner_id>/', OwnerDetailView.as_view(), name='owner-detail'),
    path('flocks/bulk/', BulkFlockCreateView.as_view(), name='flock-bulk-create'),  # Must be before flock-list-create
    path('flocks/', FlockListCreateView.as_view(), name='flock-list-create'),
    path('animals/', AnimalListCreateView.as_view(), name='animal-list-create'),
    path('problems/', ProblemListCreateView.as_view(), name='problem-list-create'),
]
