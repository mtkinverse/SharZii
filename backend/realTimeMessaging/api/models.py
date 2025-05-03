from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    age = models.IntegerField(null=False, blank=False)
    location = models.CharField(max_length=255, null=False, blank=False)

    REQUIRED_FIELDS = ['age','location','password']

    def __str__(self):
        return self.username

class Message(models.Model):
    sender = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

class VoiceCall(models.Model):
    CALL_STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('missed', 'Missed'),
        ('ended', 'Ended'),
    ]

    caller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='outgoing_calls'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='incoming_calls'
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=CALL_STATUS_CHOICES, default='initiated')
    webrtc_session_id = models.CharField(max_length=255, blank=True, null=True)

    def call_duration(self):
        if self.ended_at:
            return (self.ended_at - self.started_at).total_seconds()
        return None

    def __str__(self):
        return f"{self.caller} ➝ {self.receiver} ({self.status})"
