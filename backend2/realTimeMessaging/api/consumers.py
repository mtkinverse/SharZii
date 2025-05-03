from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Message
from asgiref.sync import sync_to_async
import json

User = get_user_model()

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        print("WebSocket connection attempt received")
        await self.accept()
        print("WebSocket connection accepted")
        
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
        
        if content.get('type') == 'auth':
            await self.handle_auth(content)
        elif content.get('type') == 'message':
            await self.handle_message(content)
        else:
            print("Unknown message type received")

    @sync_to_async
    def decode_token(self, token):
        access_token = AccessToken(token)
        return access_token.payload.get("user_id")

    async def handle_auth(self, content):
        try:
            token = content.get('token', '').replace('Bearer ', '')
            print("Token received:", token)
            
            user_id = await self.decode_token(token)
            print("User ID from token:", user_id)
            
            user = await self.get_user(user_id)
            print("User found:", user)
            
            if user:
                self.user = user
                self.room_group_name = f"chat_{user.id}"
                
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                print(f"User {user.username} joined room {self.room_group_name}")
                
                await self.send_json({
                    "type": "connection_success",
                    "message": "WebSocket connection established"
                })
                print('message sent')
                
                # Handle unread messages after successful authentication
                await self.handle_unread_messages()
            else:
                print("User not found")
                await self.close()
        except Exception as e:
            print(f"Authentication error: {e}")
            await self.close()

    async def handle_unread_messages(self):
        try:
            # Fetch unread messages
            messages = await self.get_unread_messages(self.user.id)
            print('messages fetched ', len(messages))
            
            for msg in messages:
                # Get sender username asynchronously
                print('details of message')
                print(msg.id, msg.sender.id, msg.sender.username, msg.content, msg.timestamp)
                sender = await self.get_user(msg.sender.id)
                print('sender received ', sender.id)
                await self.send_json({
                    "type": "message",
                    "sender_id": sender.id,
                    "sender_username": sender.username,
                    "content": msg.content,
                    "timestamp": str(msg.timestamp),
                })
                print('message sent')
                # Mark message as read asynchronously
                await self.mark_message_as_read(msg.id)
                print('message marked as read')
            
            print('undelivered messages fetched')
        except Exception as e:
            print(f"Error handling unread messages: {e}")

    async def handle_message(self, content):
        if not self.user:
            print("User not authenticated")
            return

        receiver_id = content.get('receiver')
        message_content = content.get('content')
        
        message = await self.save_message(self.user.id, receiver_id, message_content)
        if message:
            # Get sender username asynchronously
            sender_username = await self.get_username(self.user.id)
            
            await self.channel_layer.group_send(
                f"chat_{receiver_id}",
                {
                    "type": "chat_message",
                    "message": {
                        "sender_username": sender_username,
                        "sender_id": self.user.id,
                        "content": message_content,
                        "timestamp": str(message.timestamp),
                        "type": "message"
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
    def get_username(self, user_id):
        try:
            return User.objects.get(id=user_id).username
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_unread_messages(self, user_id):
        print('get_unread_messages for user_id:', user_id)
        try:
            # First check if there are any messages for this user
            all_messages = Message.objects.filter(receiver_id=user_id)
            print('Total messages for user:', all_messages.count())
            
            # Then check unread messages and order by timestamp
            unread_messages = Message.objects.filter(
                receiver_id=user_id,
                is_read=False
            ).select_related('sender').order_by('timestamp')
            
            print('Unread messages count:', unread_messages.count())
            messages_list = list(unread_messages)
            print('Messages list length:', len(messages_list))
            
            # Print details of each message for debugging
            for msg in messages_list:
                print(f'Message ID: {msg.id}, Sender: {msg.sender.id}, Receiver: {msg.receiver.id}, Is Read: {msg.is_read}, Timestamp: {msg.timestamp}')
            
            return messages_list
        except Exception as e:
            print(f'Error in get_unread_messages: {e}')
            return []

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        Message.objects.filter(id=message_id).update(is_read=True)

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, content):
        try:
            print(f"Attempting to save message - Sender: {sender_id}, Receiver: {receiver_id}")
            # Get sender and receiver objects
            sender = User.objects.get(id=sender_id)
            receiver = User.objects.get(id=receiver_id)
            
            # Create and save the message
            message = Message.objects.create(
                sender=sender,
                receiver=receiver,
                content=content,
                is_read=False  # Explicitly set is_read to False for new messages
            )
            print(f"Message created successfully - ID: {message.id}")
            return message
        except Exception as e:
            print(f"Error saving message: {e}")
            return None

class CallConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room']
        self.room_group_name = f"call_{self.room_name}"
        
        # Add this channel to the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"WebRTC connection established for room: {self.room_name}")

    async def disconnect(self, close_code):
        # Remove this channel from the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"WebRTC connection closed for room: {self.room_name}")

    async def receive_json(self, content, **kwargs):
        message_type = content.get('type')
        
        if message_type == 'create-offer':
            # Handle SDP offer
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_message',
                    'message': {
                        'type': 'offer',
                        'sdp': content.get('sdp'),
                        'sender': self.channel_name
                    }
                }
            )
        elif message_type == 'create-answer':
            # Handle SDP answer
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_message',
                    'message': {
                        'type': 'answer',
                        'sdp': content.get('sdp'),
                        'sender': self.channel_name
                    }
                }
            )
        elif message_type == 'ice-candidate':
            # Handle ICE candidate
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_message',
                    'message': {
                        'type': 'ice-candidate',
                        'candidate': content.get('candidate'),
                        'sender': self.channel_name
                    }
                }
            )

    async def call_message(self, event):
        # Send the message to all other clients in the room
        if self.channel_name != event['message']['sender']:
            await self.send_json(event['message'])