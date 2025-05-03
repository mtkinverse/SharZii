from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound
from .serializers import UserSerializer, MessageSerializer
from rest_framework.generics import ListAPIView
from .models import Message, CustomUser
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.exceptions import ValidationError
from rest_framework import status
from datetime import datetime
# Create your views here.

class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class MessagePagination(PageNumberPagination):
    page_size = 20  # Default
    page_size_query_param = 'page_size'
    max_page_size = 100

class MessageCursorPagination(CursorPagination):
    page_size = 20
    ordering = '-timestamp'
    cursor_query_param = 'cursor'

class MessageListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer
    pagination_class = MessageCursorPagination

    def get_queryset(self):
        user = self.request.user
        destination_id = self.request.query_params.get('destination')
        before_timestamp = self.request.query_params.get('before_timestamp')

        if not destination_id:
            raise ValidationError({'destination': 'This query parameter is required.'})
        
        if not before_timestamp:
            raise ValidationError({'before_timestamp': 'This query parameter is required.'})

        # Get all messages between the users
        messages = Message.objects.filter(
            sender=user.id, receiver=destination_id
        ) | Message.objects.filter(
            sender=destination_id, receiver=user.id
        )

        try:
            before_date = datetime.fromisoformat(before_timestamp.replace('Z', '+00:00'))
            messages = messages.filter(timestamp__lt=before_date)
        except ValueError:
            raise ValidationError({'before_timestamp': 'Invalid timestamp format'})

        # Mark unread messages as read
        unread_messages = messages.filter(
            receiver=user.id,
            is_read=False
        )
        unread_messages.update(is_read=True)

        # Return messages ordered by timestamp
        print('messages', messages)
        return messages.order_by('-timestamp')

class UserLookupView(APIView):
    permission_classes = [IsAuthenticated]
    # serializer_class = UserSerializer

    def get(self, request):
        username = request.query_params.get('username')
        user_id = request.query_params.get('id')

        if not username and not user_id:
            return Response({
                'error': 'Either username or id parameter is required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            if username:
                user = CustomUser.objects.get(username=username)
            else:
                user = CustomUser.objects.get(id=user_id)
            
            return Response({
                'id': user.id,
                'username': user.username,
                'age': user.age,
                'location': user.location
            })
        except CustomUser.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
