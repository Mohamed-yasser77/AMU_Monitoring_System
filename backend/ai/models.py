from django.db import models
from amu_monitoring.users.models import User


class AIQueryLog(models.Model):
    QUERY_TYPE_CHOICES = [
        ('regulatory', 'Regulatory'),
        ('harvest_forecast', 'Harvest Forecast'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='ai_queries')
    query_type = models.CharField(max_length=20, choices=QUERY_TYPE_CHOICES)
    query_text = models.TextField()
    species = models.CharField(max_length=20, blank=True, null=True)
    molecule = models.CharField(max_length=100, blank=True, null=True)

    # Response fields
    response_text = models.TextField(blank=True, null=True)
    confidence = models.FloatField(blank=True, null=True)
    source_citation = models.CharField(max_length=500, blank=True, null=True)
    flagged_for_review = models.BooleanField(default=False)

    # Audit fields (non-negotiable per roadmap)
    retrieved_chunk_ids = models.JSONField(default=list)
    model_version = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} | {self.query_type} | {self.created_at.strftime('%Y-%m-%d %H:%M')}"
