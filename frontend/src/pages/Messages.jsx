"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { format } from "date-fns" // You'll need to install this: npm install date-fns
import { useModal } from "../contexts/modalContext"
import { useUserContext } from "../contexts/userContext"
import axios from "axios"
import SelectedConversation from "../components/SelectedConversation"

const Message = () => {
    // State for the selected conversation
    const [selectedConversation, setSelectedConversation] = useState(null)
    // State for search query
    const [searchQuery, setSearchQuery] = useState("")
    // State for new message input
    const [newMessage, setNewMessage] = useState("")
    // Ref for scrolling to bottom of messages
    const messagesEndRef = useRef(null)
    const [newConversationUsername, setNewConversationUsername] = useState("")
    const [userSearchError, setUserSearchError] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [showNewConversationModal, setShowNewConversationModal] = useState(false)

    const {showModal} = useModal()

    const {conversations, setConversations, sendMessage, user, refreshToken} = useUserContext()

    // Filter conversations based on search query
    const filteredConversations = useMemo(() => {
        return conversations.filter((conversation) =>
            conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

    // Handle sending a new message
    const handleSendMessage = (e) => {
        e.preventDefault()
        if (newMessage.trim() === "" || !selectedConversation) return

        sendMessage(selectedConversation.id, newMessage)

        const updatedConversations = conversations.map((conversation) => {
            if (conversation.id === selectedConversation.id) {
                const newMessageObj = {
                    id: conversation.messages.length + 1,
                    text: newMessage,
                    sender: user.username,
                    receiver: conversation.name,
                    timestamp: new Date(),
                    is_read: false
                }
                return {
                    ...conversation,
                    lastMessage: newMessage,
                    timestamp: new Date(),
                    messages: [...conversation.messages, newMessageObj],
                }
            }
            return conversation
        })

        setConversations(updatedConversations)
        setSelectedConversation(updatedConversations.find((c) => c.id === selectedConversation.id))
        setNewMessage("")
    }

    // Mark conversation as read when selected
    const handleSelectConversation = (conversation) => {
        if (conversation.unread > 0) {
            const updatedConversations = conversations.map((c) => (c.id === conversation.id ? { ...c, unread: 0 } : c))
            setConversations(updatedConversations)
            setSelectedConversation({ ...conversation, unread: 0 })
        } else {
            setSelectedConversation(conversation)
        }
    }

    // Format timestamp for conversation list
    const formatConversationTime = (timestamp) => {
        const today = new Date()
        const messageDate = new Date(timestamp)

        if (messageDate.toDateString() === today.toDateString()) {
            return format(messageDate, "h:mm a")
        } else if (messageDate > new Date(today.setDate(today.getDate() - 7))) {
            return format(messageDate, "EEE")
        } else {
            return format(messageDate, "MM/dd/yy")
        }
    }

    // Format timestamp for message bubbles
    const formatMessageTime = (timestamp) => {
        return format(new Date(timestamp), "h:mm a")
    }

    const handleNewConversation = () => {
        setShowNewConversationModal(true)
    }

    const handleSearchUser = async () => {
        if (!newConversationUsername.trim()) {
            setUserSearchError("Please enter a username")
            return
        }

        setIsSearching(true)
        setUserSearchError("")
        const token = localStorage.getItem('token')

        try {
            const response = await axios.get(`/api/user?username=${newConversationUsername}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.status === 200 && response.data) {
                // User exists, send initial message
                console.log('whoooooooo user found ', response.data)
                // return
                await sendMessage(response.data.id, `Hi ${newConversationUsername}`)
                
                // Add to conversations
                const newConversation = {
                    id: response.data.id,
                    name: newConversationUsername,
                    avatar: "/avatars/default.jpg",
                    lastMessage: `Hi ${newConversationUsername}`,
                    timestamp: new Date(),
                    unread: 0,
                    online: false,
                    messages: [
                        {
                            id: 1,
                            text: `Hi ${newConversationUsername}`,
                            sender: { id: user.id, username: user.username },
                            receiver: { id: response.data.id, username: newConversationUsername },
                            timestamp: new Date(),
                            is_read: false
                        }
                    ]
                }

                setConversations([newConversation, ...conversations])
                setSelectedConversation(newConversation)
                setNewConversationUsername("")
                setShowNewConversationModal(false)
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setUserSearchError("User not found")
            } else if (error.response?.status === 401) {
                refreshToken()
            } else {
                setUserSearchError("An error occurred while searching for the user")
            }
            console.log(error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleMessagesUpdate = (newMessages) => {
        // Update selected conversation
        setSelectedConversation(prev => ({
            ...prev,
            messages: newMessages
        }));

        // Update conversations list
        setConversations(prevConversations => {
            const updatedConversations = prevConversations.map(conv => {
                if (conv.id === selectedConversation.id) {
                    return {
                        ...conv,
                        messages: newMessages,
                        lastMessage: newMessages[newMessages.length - 1]?.text || conv.lastMessage,
                        timestamp: newMessages[newMessages.length - 1]?.timestamp || conv.timestamp
                    };
                }
                return conv;
            });

            // Update localStorage
            localStorage.setItem(`conversations-user${user.username}`, JSON.stringify(updatedConversations));
            return updatedConversations;
        });
    };

    // Update selected conversation when conversations change
    useEffect(() => {
        if (selectedConversation?.id) {
            const updatedConversation = conversations.find(conv => conv.id === selectedConversation.id);
            if (updatedConversation) {
                setSelectedConversation(updatedConversation);
            }
        }
    }, [conversations]);

    // Load initial conversations from localStorage
    useEffect(() => {
        const storedConversations = JSON.parse(localStorage.getItem(`conversations-user${user.username}`)) || [];
        setConversations(storedConversations);
    }, [user.username]);

    return (
        <div className="flex h-screen bg-theme-4">
            {/* Conversation List Sidebar */}
            <div className="w-1/4 border-r border-theme-6 flex flex-col">
                {/* Search Bar */}
                <div className="p-4 border-b border-theme-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full bg-theme-5 text-theme-3 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-theme-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute left-3 top-2.5 text-theme-3">
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
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className={`flex items-center p-4 border-b border-theme-6 cursor-pointer transition-colors duration-200 ${selectedConversation?.id === conversation.id ? "bg-theme-6" : "hover:bg-theme-5"
                                    }`}
                                onClick={() => handleSelectConversation(conversation)}
                            >
                                {/* Avatar with online indicator */}
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-theme-7 flex items-center justify-center text-theme-3 text-lg font-semibold">
                                        {conversation.name.charAt(0)}
                                    </div>
                                    {conversation.online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-theme-5"></div>
                                    )}
                                </div>

                                {/* Conversation details */}
                                <div className="ml-4 flex-1">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-theme-3">{conversation.name}</h3>
                                        <span className="text-xs text-theme-3 opacity-70">
                                            {formatConversationTime(conversation.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm text-theme-3 opacity-70 truncate w-40">{conversation.lastMessage}</p>
                                        {conversation.unread > 0 && (
                                            <span className="bg-theme-0 text-theme-3 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {conversation.unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-theme-3 opacity-70">No conversations found</div>
                    )}
                </div>
            </div>

            {/* Message Area */}
            <div className="w-[70%] flex flex-col">
                {selectedConversation ? (
                    <SelectedConversation
                        selectedConversation={selectedConversation}
                        user={user}
                        onClose={() => setSelectedConversation(null)}
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        onSendMessage={handleSendMessage}
                        onMessagesUpdate={handleMessagesUpdate}
                    />
                ) : (
                    // Welcome Screen (when no conversation is selected)
                    <div className="flex-1 flex flex-col items-center justify-center bg-theme-5 bg-opacity-30">
                        <div className="w-24 h-24 rounded-full bg-theme-2 outline outline-1 outline-theme-3/20 bg-opacity-20 flex items-center justify-center mb-6">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-theme-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-theme-3 mb-2">Welcome to Messages</h2>
                        <p className="text-theme-3 opacity-70 text-center max-w-md mb-8">
                            Select a conversation from the list to start chatting or search for a specific contact.
                        </p>
                        <div className="grid grid-cols-2 gap-4 max-w-lg">
                            <div className="bg-theme-6 p-4 rounded-lg text-center hover:shadow-md hover:shadow-theme-3/40 hover:bg-theme-5 transition-colors cursor-pointer"
                                onClick={handleNewConversation}
                            >
                                <div className="w-12 h-12 rounded-full bg-theme-2 outline outline-1 outline-theme-3/20 bg-opacity-20 flex items-center justify-center mx-auto mb-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 text-theme-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-theme-3 mb-1">New Message</h3>
                                <p className="text-xs text-theme-3 opacity-70">Start a new conversation</p>
                            </div>
                            <div className="bg-theme-6 p-4 rounded-lg text-center hover:shadow-md hover:shadow-theme-3/40 hover:bg-theme-5 transition-colors cursor-pointer"
                                onClick={() => {
                                    showModal({
                                        title: "Create Group",
                                        text: "This feature will be available soon",
                                        options: {1:'OK'}
                                    })
                                }}
                            >
                                <div className="w-12 h-12 rounded-full bg-theme-2 outline outline-1 outline-theme-3/20 bg-opacity-20 flex items-center justify-center mx-auto mb-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 text-theme-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-theme-3 mb-1">Create Group</h3>
                                <p className="text-xs text-theme-3 opacity-70">Start a group conversation</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* New Conversation Modal */}
            {showNewConversationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-r from-theme-6 to-theme-7 via-theme-6 p-6 rounded-lg shadow-lg w-96 text-theme-3">
                        <h2 className="text-2xl font-bold mb-4">Start New Conversation</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2" htmlFor="username">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={newConversationUsername}
                                onChange={(e) => setNewConversationUsername(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-theme-2 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Enter username"
                            />
                            {userSearchError && (
                                <p className="text-red-500 text-xs italic mt-1">{userSearchError}</p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowNewConversationModal(false)}
                                className="bg-theme-3 hover:bg-theme-2 text-theme-2 hover:text-theme-3 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSearchUser}
                                disabled={isSearching}
                                className="bg-theme-3 hover:bg-theme-2 hover:text-theme-3 text-theme-2 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                            >
                                {isSearching ? "Searching..." : "Start Conversation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Message;
