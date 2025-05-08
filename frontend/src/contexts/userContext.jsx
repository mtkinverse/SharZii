import { createContext, useContext, useState, useEffect, useRef } from 'react';
import socketManager from '../socket';
import axios from 'axios';
import { useModal } from './modalContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [conversations, setConversations] = useState([]);
    const {showModal} = useModal();
    const callWsRef = useRef(null);
    const [isCallWsConnected, setIsCallWsConnected] = useState(false);
    const callMessageHandlerRef = useRef(null);
    const [callConnected,setCallConnected] = useState(false);
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const messsageHandler = message => {
        setConversations(prevConversations => {
            
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
                
                
                socketManager.connect(token);

                socketManager.addMessageHandler(messsageHandler);

                socketManager.addErrorHandler(error => {
                    console.error('WebSocket error:', error);
                    if (error.message === 'Token expired') {
                        refreshToken();
                    }
                    showModal({
                        title: "Error",
                        text: "Failed to connect to the server",
                        options: {1:'OK'}
                    });
                });

                // CLEANUP: remove the handler when effect re-runs or component unmounts
                return () => {
                    socketManager.removeMessageHandler(messsageHandler);
                };

            } catch (error) {
                console.error('WebSocket connection error:', error);
                showModal({
                    title: "Error",
                    text: "Failed to connect to the server",
                    options: {1:'OK'}
                });
                // Handle connection error (e.g., show error message)
            }
        } else {
            // Disconnect from WebSocket when no token or user
            socketManager.disconnect();
        }
    }, [token, user]);

    // Initialize call WebSocket when user is authenticated
    useEffect(() => {
        if (user?.username) {
            initializeCallWebSocket();
        }
        return () => {
            if (callWsRef.current) {
                callWsRef.current.close();
            }
        };
    }, [user?.username]);

    const initializeCallWebSocket = () => {
        try {
            const baseUrl = '192.168.19.192';
            const ws = new WebSocket(`ws://${baseUrl}:8000/ws/call/${user.username}/?token=${token}`);
            callWsRef.current = ws;

            ws.onopen = () => {
                setIsCallWsConnected(true);
                if (callMessageHandlerRef.current) {
                    ws.onmessage = callMessageHandlerRef.current;
                }
                console.log('Call WebSocket connection opened');
            };

            ws.onerror = (error) => {
                console.error('Call WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('Call WebSocket connection closed');
                setIsCallWsConnected(false);
                // Attempt to reconnect after a delay
                setTimeout(initializeCallWebSocket, 3000);
            };
        } catch (error) {
            console.error('Error initializing call WebSocket:', error);
        }
    };

    const sendCallMessage = (message) => {
        if (callWsRef.current && callWsRef.current.readyState === WebSocket.OPEN) {
            callWsRef.current.send(JSON.stringify(message));
        } else {
            console.error('Call WebSocket is not connected');
        }
    };

    const setCallMessageHandler = (handler) => {
        callMessageHandlerRef.current = handler;
        if (callWsRef.current) {
            callWsRef.current.onmessage = handler;
        }
    };

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

    const value = {
        user,
        setUser,
        token,
        setToken,
        conversations,
        setConversations,
        sendMessage,
        refreshToken,
        callWsRef,
        isCallWsConnected,
        sendCallMessage,
        setCallMessageHandler,
        login,
        logout,
        callConnected,
        setCallConnected
    };

    return (
        <UserContext.Provider value={value}>
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
