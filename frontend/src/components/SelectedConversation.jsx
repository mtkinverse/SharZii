import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import axios from 'axios';
import { useUserContext } from '../contexts/userContext';
import CallInterface from './CallInterface';

const SelectedConversation = ({ selectedConversation, user, onClose, newMessage, setNewMessage, onSendMessage, onMessagesUpdate }) => {
    const messagesContainerRef = useRef(null);
    const [showGoToBottom, setShowGoToBottom] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const { token } = useUserContext();
    const [allowScroll, setAllowScroll] = useState(true);
    const [isCalling, setIsCalling] = useState(false);

    // Load initial messages when conversation is selected
    useEffect(() => {
        if (selectedConversation?.id) {
            loadInitialMessages();
        }
    }, [selectedConversation?.id]);

    useEffect(() => {
        if (allowScroll) {
            
            scrollToBottom();
        }
        else setAllowScroll(prev => !prev);
    }, [selectedConversation?.messages]);

    const loadInitialMessages = async () => {
        if (!selectedConversation?.id || isLoading) return;
        setIsLoading(true);
        try {
            const currentTime = new Date().toISOString();
            const response = await axios.get(`/api/messages/?destination=${selectedConversation.id}&before_timestamp=${currentTime}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const messages = response.data.results
                .map(message => ({
                    id: message.id,
                    text: message.content,
                    sender: message.sender_username,
                    timestamp: message.timestamp
                }))
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            onMessagesUpdate(messages);
            setHasMore(messages.length === 20);
        } catch (error) {
            console.error('Error loading initial messages:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    // Show/hide 'Go to Bottom' button
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        
        // If not at the bottom, show button
        setShowGoToBottom(scrollTop + clientHeight < scrollHeight - 20);

        // If scrolled to top and there are more messages, load more
        if (scrollTop === 0 && hasMore && !isLoading && selectedConversation?.messages?.length > 0) {
            loadMoreMessages();
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        scrollToBottom();
        onSendMessage(e);
    };

    const loadMoreMessages = async () => {
        if (!selectedConversation?.id || isLoading || !hasMore) return;

        if (selectedConversation.messages.length === 0) {
            setHasMore(false);
            return;
        }
        setAllowScroll(false);
        setIsLoading(true);
        try {
            const earliestMessage = selectedConversation.messages[0];
            const timestamp = new Date(earliestMessage.timestamp).toISOString();
            const response = await axios.get(`/api/messages/?destination=${selectedConversation.id}&before_timestamp=${timestamp}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const newMessages = response.data.results
                .map(message => ({
                    id: message.id,
                    text: message.content,
                    sender: message.sender_username,
                    timestamp: message.timestamp
                }))
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            if (newMessages.length === 0) {
                setHasMore(false);
            } else {
                // Remove any duplicates and combine messages
                const existingMessageIds = new Set(selectedConversation.messages.map(m => m.id));
                const uniqueNewMessages = newMessages.filter(message => !existingMessageIds.has(message.id));
                
                if (uniqueNewMessages.length > 0) {
                    const updatedMessages = [...uniqueNewMessages, ...selectedConversation.messages];
                    onMessagesUpdate(updatedMessages);
                }
                setHasMore(newMessages.length === 20);
            }
        } catch (error) {
            console.error('Error loading more messages:', error);
            if (error.response?.status === 400) {
                setHasMore(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatMessageTime = (timestamp) => {
        return format(new Date(timestamp), "h:mm a");
    };

    if (!selectedConversation) return null;

    return (
        <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-theme-6 flex items-center">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-theme-7 flex items-center justify-center text-theme-3 text-lg font-semibold">
                        {selectedConversation.name.charAt(0)}
                    </div>
                    {selectedConversation.online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-theme-5"></div>
                    )}
                </div>
                <div className="ml-3">
                    <h3 className="font-semibold text-theme-3">{selectedConversation.name}</h3>
                    <p className="text-xs text-theme-3 opacity-70">{selectedConversation.online ? "Online" : "Offline"}</p>
                </div>
                <div className="ml-auto flex space-x-3">
                    <button 
                        onClick={() => setIsCalling(true)}
                        className="text-theme-2 hover:text-theme-0 transition-colors bg-theme-3 hover:shadow-md hover:shadow-theme-3/40 rounded-full p-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                        </svg>
                    </button>
                    <button
                        className="text-theme-3/80 hover:text-theme-3 transition-colors hover:shadow-md rounded-full p-2"
                        onClick={onClose}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-theme-5 bg-opacity-30 w-4/5 mx-auto border-x border-x-theme-3/20 relative"
                ref={messagesContainerRef}
                onScroll={handleScroll}
                style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
                {isLoading && (
                    <div className="text-center py-2 text-theme-3">
                        Loading more messages...
                    </div>
                )}
                <div className="space-y-4">
                    {selectedConversation.messages.map((message, index) => (
                        <div key={`receiver-${selectedConversation.id}-sender-${message.sender == user.username ? "user" : message.sender}-message-${index}`} className={`flex ${message.sender == user.username ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender == user.username
                                    ? "bg-theme-0 text-theme-3 rounded-br-none"
                                    : "bg-theme-6 text-theme-3 rounded-bl-none"
                                    }`}
                            >
                                <p>{message.text}</p>
                                <p
                                    className={`text-xs mt-1 text-theme-3 opacity-70`}
                                >
                                    {formatMessageTime(message.timestamp)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                {showGoToBottom && (
                    <button
                        className="fixed bottom-24 right-10 bg-theme-0 text-theme-3 rounded-full p-3 shadow hover:bg-theme-1 transition-colors z-50 flex items-center justify-center"
                        onClick={scrollToBottom}
                        style={{ position: 'absolute', right: '50%', transform: 'translateX(50%)', bottom: '20px' }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-theme-6">
                <form onSubmit={handleSendMessage} className="flex items-center">
                    <button type="button" className="text-theme-3 hover:text-theme-0 transition-colors mr-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                        </svg>
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-theme-5 text-theme-3 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-theme-0"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="ml-3 cursor-pointer bg-theme-0 text-theme-3 rounded-full p-2 hover:bg-theme-1 transition-colors"
                        disabled={!newMessage.trim()}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l8 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Call Interface */}
            {isCalling && (
                <CallInterface
                    receiver={selectedConversation}
                    onEndCall={() => setIsCalling(false)}
                />
            )}
        </>
    );
};

export default SelectedConversation; 