from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Message
import json

User = get_user_model()

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        print("WebSocket connection attempt received")
        # Accept the connection first
        await self.accept()
        print("WebSocket connection accepted")
        
        # Initialize user as None
        self.user = None
        self.room_group_name = None

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected with code: {close_code}")
        if hasattr(self, 'room_group_name') and self.room_group_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive_json(self, content, **kwargs):
        print("Received JSON:", content)
        
        # Handle authentication
        if content.get('type') == 'auth':
            await self.handle_auth(content)
        # Handle messages
        elif content.get('type') == 'message':
            await self.handle_message(content)
        else:
            print("Unknown message type received")

    async def handle_auth(self, content):
        try:
            token = content.get('token', '').replace('Bearer ', '')
            print("Token received:", token)
            
            # Validate JWT token
            access_token = AccessToken(token)
            user_id = access_token.payload.get('user_id')
            print("User ID from token:", user_id)
            
            user = await self.get_user(user_id)
            print("User found:", user)
            
            if user:
                self.user = user
                self.room_group_name = f"chat_{user.id}"
                
                # Join room group
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                print(f"User {user.username} joined room {self.room_group_name}")
                
                # Send connection success message
                await self.send_json({
                    "type": "connection_success",
                    "message": "WebSocket connection established"
                })
                print('message sent')
                
                # Fetch undelivered messages
                messages = await self.get_unread_messages(user.id)
                for msg in messages:
                    # Get sender username asynchronously
                    print(msg)
                    sender = await self.get_user(msg.sender)
                    await self.send_json({
                        "type": "message",
                        "sender_id": sender.id,
                        "sender_username": sender.username,
                        "content": msg.content,
                        "timestamp": str(msg.timestamp),
                    })
                    # Mark message as read asynchronously
                    await self.mark_message_as_read(msg.id)
                print('undelivered messages fetched')
            else:
                print("User not found")
                await self.close()
        except Exception as e:
            print(f"Authentication error: {e}")
            await self.close()

    async def handle_message(self, content):
        if not self.user:
            print("User not authenticated")
            return

        receiver_id = content.get('receiver')
        message_content = content.get('content')
        
        # Save message to database
        message = await self.save_message(self.user.id, receiver_id, message_content)
        
        # Send message to receiver's room group
        await self.channel_layer.group_send(
            f"chat_{receiver_id}",
            {
                "type": "chat_message",
                "message": {
                    "sender": self.user.username,
                    "content": message_content,
                    "timestamp": str(message.timestamp),
                }
            }
        )

    async def chat_message(self, event):
        print("Sending chat message:", event["message"])
        await self.send_json(event["message"])

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_unread_messages(self, user_id):
        return list(Message.objects.filter(receiver=user_id, is_read=False))

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        Message.objects.filter(id=message_id).update(is_read=True)

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, content):
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
        return Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=content
        )