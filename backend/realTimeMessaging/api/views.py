from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UserSerializer, MessageSerializer
from rest_framework.generics import ListAPIView
from .models import Message,CustomUser, Message
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError

# Create your views here.



class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class MessagePagination(PageNumberPagination):
    page_size = 20  # Default
    page_size_query_param = 'page_size'
    max_page_size = 100

class MessageListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer
    pagination_class = MessagePagination

    def get_queryset(self):
        user = self.request.user
        destination_id = self.request.query_params.get('destination')

        if not destination_id:
            raise ValidationError({'destination': 'This query parameter is required.'})

        return Message.objects.filter(
            sender=user.id, receiver=destination_id
        ) | Message.objects.filter(
            sender=destination_id, receiver=user.id
        ).order_by('-timestamp')