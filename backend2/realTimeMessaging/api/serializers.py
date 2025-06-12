from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Message, CustomUser

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
