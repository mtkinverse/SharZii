from django.contrib import admin
from .models import CustomUser, Message, VoiceCall  # adjust as needed

admin.site.register(CustomUser)
admin.site.register(Message)
admin.site.register(VoiceCall)
