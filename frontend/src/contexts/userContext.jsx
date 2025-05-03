import { createContext, useContext, useState, useEffect } from 'react';
import socketManager from '../socket';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const messsageHandler = message => {
        setConversations(prevConversations => {
            console.log('prevConversations', prevConversations, message);
            const isExist = prevConversations.find(ele => ele.id == message.sender_id);

            if (isExist) {
                return prevConversations.map(ele => {
                    if (ele.id == message.sender_id) {
                        return {
                            ...ele,
                            unread: ele.unread + 1,
                            lastMessage: message.content,
                            timestamp: message.timestamp,
                            messages: [...ele.messages, {
                                id: message.id,
                                text: message.content,
                                sender: message.sender_username,
                                timestamp: message.timestamp,
                            }]
                        };
                    }
                    return ele;
                });
            } else {
                const newMessage = {
                    id: message.sender_id,
                    name: message.sender_username,
                    lastMessage: message.content,
                    timestamp: message.timestamp,
                    unread: 1,
                    online: false,
                    messages: [
                        {
                            id: message.id,
                            text: message.content,
                            sender: user.username,
                            timestamp: message.timestamp,
                        }
                    ]
                }
                return [...prevConversations, newMessage];
            }
        });
    }

    useEffect(() => {
        if (token && user) {
            try {
                // Connect to WebSocket when token and user are available
                console.log('token', token);
                console.log('user', user);
                socketManager.connect(token);

                socketManager.addMessageHandler(messsageHandler);

                socketManager.addErrorHandler(error => {
                    console.error('WebSocket error:', error);
                    if (error.message === 'Token expired') {
                        refreshToken();
                    }
                });

                // CLEANUP: remove the handler when effect re-runs or component unmounts
                return () => {
                    socketManager.removeMessageHandler(messsageHandler);
                };

            } catch (error) {
                console.error('WebSocket connection error:', error);
                // Handle connection error (e.g., show error message)
            }
        } else {
            // Disconnect from WebSocket when no token or user
            socketManager.disconnect();
        }
    }, [token, user]);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
        setConversations(JSON.parse(localStorage.getItem(`conversations-user${userData.username}`)) || []);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.setItem('user', "");
        localStorage.setItem('token', "");
        socketManager.reconnectTimeout = undefined;
        socketManager.disconnect();
    };

    const sendMessage = (receiverId, message) => {
        socketManager.sendMessage(receiverId, message)
    }

    const refreshToken = async () => {
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/user/refresh/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.status === 200) {
            setToken(response.data.access);
            localStorage.setItem('token', response.data.access);
        }
    }

    useEffect(() => {
        if (conversations.length > 0) {
            localStorage.setItem(`conversations-user${user.username}`, JSON.stringify(conversations));
        }
    }, [conversations]);

    return (
        <UserContext.Provider value={{ user, token, login, logout, conversations, setConversations, sendMessage, refreshToken }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};
