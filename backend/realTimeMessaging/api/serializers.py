from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Message, VoiceCall, CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id","username","password","age","location"]
        extra_kwargs = {"password" : {"write_only" : True}}
    
    def create(self,validData):
        password = validData.pop("password")
        user = CustomUser(**validData)
        user.set_password(password)
        user.save()
        return user

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'sender_username', 'receiver_username', 'content', 'timestamp', 'is_read']

class VoiceCallSerializer(serializers.ModelSerializer):
    caller_username = serializers.CharField(source='caller.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    call_duration = serializers.ReadOnlyField()

    class Meta:
        model = VoiceCall
        fields = ['id', 'caller', 'receiver', 'caller_username', 'receiver_username', 'started_at', 'ended_at', 'status', 'webrtc_session_id', 'call_duration']
