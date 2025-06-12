class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.messageHandlers = new Set();
        this.errorHandlers = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.connectionHandlers = new Set();
    }

    connect(token) {
        if (this.socket) {
            this.disconnect();
        }

        try {
            // const baseUrl = '192.168.0.120'
            const baseUrl = import.meta.env.VITE_WEBSOCKET_URL
            // Create WebSocket connection
            const wsUrl = `ws://${baseUrl}:8000/ws/chat/`;

            this.socket = new WebSocket(wsUrl);

            // Set up event handlers
            this.socket.onopen = () => {
                console.log('WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;

                // Send authentication message
                const authMessage = {
                    type: 'auth',
                    token: `Bearer ${token}`
                };

                this.socket.send(JSON.stringify(authMessage));
            };

            this.socket.onclose = (event) => {

                this.isConnected = false;

                // Clear any existing reconnect timeout
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                }

                // Attempt to reconnect if not manually disconnected
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;

                    this.reconnectTimeout = setTimeout(() => {
                        const token = localStorage.getItem('token');
                        if (token) {
                            this.connect(token);
                        }
                    }, 1000 * this.reconnectAttempts);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error details:', {
                    error: error,
                    readyState: this.socket?.readyState,
                    url: this.socket?.url
                });
                this.errorHandlers.forEach(handler => handler(error));

            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);


                    // Handle different message types
                    if (data.type === 'connection_success') {

                        this.connectionHandlers.forEach(handler => handler(true));
                    } else if (data.type === 'message') {
                        this.messageHandlers.forEach(handler => handler(data));
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.errorHandlers.forEach(handler => handler(error));
        }
    }

    disconnect() {
        if (this.socket) {

            this.socket.close();
            this.socket = null;
            this.isConnected = false;
            this.reconnectAttempts = 0;

            // Clear any existing reconnect timeout
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        }
    }

    sendMessage(receiverId, content) {
        if (!this.isConnected) {
            throw new Error('Socket is not connected');
        }

        const message = {
            type: 'message',
            receiver: receiverId,
            content: content
        };

        this.socket.send(JSON.stringify(message));
    }

    addMessageHandler(handler) {
        this.messageHandlers.add(handler);
    }

    removeMessageHandler(handler) {
        this.messageHandlers.delete(handler);
    }

    addErrorHandler(handler) {
        this.errorHandlers.add(handler);
    }

    removeErrorHandler(handler) {
        this.errorHandlers.delete(handler);
    }

    addConnectionHandler(handler) {
        this.connectionHandlers.add(handler);
    }

    removeConnectionHandler(handler) {
        this.connectionHandlers.delete(handler);
    }

    isSocketConnected() {
        return this.isConnected;
    }
}

// Create a singleton instance
const socketManager = new SocketManager();

export default socketManager; 