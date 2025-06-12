import { useState, useEffect, useRef } from 'react';
import { useUserContext } from '../contexts/userContext';

const CallInterface = ({ receiver, onEndCall }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callStatus, setCallStatus] = useState('initializing');
    const [error, setError] = useState(null);
    const [connectionState, setConnectionState] = useState('new');
    const [isInitiator, setIsInitiator] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const { user, sendCallMessage, setCallMessageHandler, isCallWsConnected, callConnected, setCallConnected } = useUserContext();

    useEffect(() => {
        if (!callConnected)
            initializeCall();
        setCallStatus('connected')
        return () => {
            cleanup();
        };
    }, []);

    const updateCallStatus = (status, error = null) => {

        if (status == 'connected') {
            setCallStatus('connected')
            setCallConnected(true);


        }
        else

            setCallStatus(status);
        if (error) {
            setError(error);
        }
    };

    // useEffect(()=>{
    //     if(callStatus == 'connected'){

    //     }
    //     setCallConnected(true)
    // },[callStatus])

    const initializeCall = async () => {
        try {
            updateCallStatus('requesting_media');
            // Get local media stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            updateCallStatus('media_acquired');

            // Create RTCPeerConnection
            updateCallStatus('creating_peer_connection');
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            };
            const pc = new RTCPeerConnection(configuration);
            peerConnectionRef.current = pc;
            peerConnectionRef.current.pendingCandidates = [];  // Initialize pending candidates array

            // Monitor connection state changes
            pc.onconnectionstatechange = () => {

                setConnectionState(pc.connectionState);
                switch (pc.connectionState) {
                    case 'connected':
                        updateCallStatus('connected');
                        break;
                    case 'disconnected':
                    case 'failed':
                        updateCallStatus('error', 'Connection failed');
                        break;
                    case 'closed':
                        updateCallStatus('ended');
                        break;
                }
            };

            // Monitor ICE connection state
            pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', pc.iceConnectionState);
            };

            // Add local stream to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && isCallWsConnected) {

                    sendCallMessage({
                        type: 'ice-candidate',
                        candidate: event.candidate,
                        sender: user.username,
                        receiver: receiver.name
                    });
                }
            };

            // Handle remote stream
            pc.ontrack = (event) => {

                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                // Update call status when we receive the remote stream
                if (peerConnectionRef.current?.signalingState === 'stable') {
                    updateCallStatus('connected');
                }
            };

            // Set up WebSocket message handler
            setCallMessageHandler(async (event) => {
                try {
                    const message = JSON.parse(event.data);



                    switch (message.type) {
                        case 'offer':
                            // Only process offer if we're not the initiator
                            if (!isInitiator) {



                                // If we're in a non-stable state, close the existing connection and create a new one
                                if (peerConnectionRef.current?.signalingState !== 'stable') {

                                    cleanup();
                                    await initializeCall();
                                }

                                const offer = new RTCSessionDescription({
                                    type: 'offer',
                                    sdp: message.sdp
                                });

                                try {
                                    await peerConnectionRef.current.setRemoteDescription(offer);


                                    const answer = await peerConnectionRef.current.createAnswer();


                                    await peerConnectionRef.current.setLocalDescription(answer);


                                    const answerMessage = {
                                        type: 'create-answer',
                                        sdp: answer.sdp,
                                        sender: user.username,
                                        receiver: message.sender
                                    };
                                    console.log('Sending answer message:', answerMessage);
                                    sendCallMessage(answerMessage);
                                } catch (error) {
                                    console.error('Error processing offer:', error);
                                    updateCallStatus('error', 'Failed to process offer');
                                }
                            } else {
                                console.log('Ignoring offer - we are the initiator');
                            }
                            break;
                        case 'answer':
                            console.log('Received answer, current state:', {
                                isInitiator,
                                messageInitiator: message.initiator,
                                signalingState: peerConnectionRef.current?.signalingState
                            });

                            if (peerConnectionRef.current?.signalingState === 'have-local-offer') {
                                // Normal answer processing
                                updateCallStatus('receiving_answer');
                                console.log('Processing answer from:', message.sender);

                                try {
                                    const answer = new RTCSessionDescription({
                                        type: 'answer',
                                        sdp: message.sdp
                                    });

                                    await peerConnectionRef.current.setRemoteDescription(answer);


                                    // Process any pending ICE candidates
                                    if (peerConnectionRef.current.pendingCandidates && peerConnectionRef.current.pendingCandidates.length > 0) {

                                        for (const candidate of peerConnectionRef.current.pendingCandidates) {
                                            try {
                                                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));

                                            } catch (error) {
                                                console.error('Error adding pending ICE candidate:', error);
                                            }
                                        }
                                        peerConnectionRef.current.pendingCandidates = [];
                                    }
                                } catch (error) {
                                    console.error('Error setting remote description:', error);
                                    updateCallStatus('error', 'Failed to process answer');
                                }
                            } else if (peerConnectionRef.current?.signalingState === 'stable') {
                                // We're in stable state, need to restart negotiation

                                try {
                                    // Create a new offer
                                    const offer = await peerConnectionRef.current.createOffer();
                                    await peerConnectionRef.current.setLocalDescription(offer);

                                    // Send the new offer
                                    const offerMessage = {
                                        type: 'create-offer',
                                        sdp: offer.sdp,
                                        sender: user.username,
                                        receiver: receiver.name
                                    };

                                    sendCallMessage(offerMessage);
                                } catch (error) {
                                    console.error('Error creating new offer:', error);
                                    updateCallStatus('error', 'Failed to restart negotiation');
                                }
                            } else {

                                // If we're in a non-stable state and not have-local-offer, we might need to restart the connection
                                if (peerConnectionRef.current?.signalingState !== 'stable' &&
                                    peerConnectionRef.current?.signalingState !== 'have-local-offer') {

                                    cleanup();
                                    await initializeCall();
                                }
                            }
                            break;
                        case 'ice-candidate':
                            try {


                                if (peerConnectionRef.current?.remoteDescription) {

                                    const candidate = new RTCIceCandidate(message.candidate);
                                    await peerConnectionRef.current.addIceCandidate(candidate);

                                } else {

                                    if (!peerConnectionRef.current.pendingCandidates) {
                                        peerConnectionRef.current.pendingCandidates = [];
                                    }
                                    peerConnectionRef.current.pendingCandidates.push(message.candidate);

                                }
                            } catch (e) {
                                console.error('Error adding ICE candidate:', e);
                            }
                            break;

                        case 'end-call':
                            cleanup();
                            setCallConnected(false);

                        default:

                    }
                } catch (error) {
                    console.error('Error handling WebSocket message:', error);
                    updateCallStatus('error', 'Error processing call data');
                }
            });

            // Create and send offer
            await createAndSendOffer(pc);

        } catch (error) {
            console.error('Call initialization error:', error);
            updateCallStatus('error', 'Failed to initialize call');
            cleanup();
        }
    };

    const createAndSendOffer = async (pc) => {
        try {
            updateCallStatus('creating_offer');
            const offer = await pc.createOffer();


            // Set local description before sending the offer
            await pc.setLocalDescription(offer);


            updateCallStatus('sending_offer');
            setIsInitiator(true);

            const message = {
                type: 'create-offer',
                sdp: offer.sdp,
                sender: user.username,
                receiver: receiver.name
            };

            sendCallMessage(message);
        } catch (error) {
            console.error('Error creating offer:', error);
            updateCallStatus('error', 'Failed to create call offer');
        }
    };

    const cleanup = () => {
        console.log('Cleaning up call resources');
        // Stop all media tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });

            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            setRemoteStream(null);
            localVideoRef.current = null
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Reset states
        setIsInitiator(false);
        setConnectionState('new');

    };

    const handleEndCall = () => {
        setCallConnected(false)
        sendCallMessage({
            type: 'end-call',
            sender: user.username,
            receiver: receiver.name
        })
        cleanup();
        onEndCall();
        localVideoRef.current = null
        remoteVideoRef.current = null
        peerConnectionRef.current = null
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-theme-6 p-6 rounded-lg shadow-lg w-96 text-theme-3">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Call with {receiver.username}</h2>
                    <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded text-sm ${callStatus === 'connected' ? 'bg-green-500' :
                            callStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}>
                            {callStatus}
                        </span>
                        {connectionState !== 'new' && (
                            <span className="text-xs text-theme-3 opacity-70 mt-1">
                                Connection: {connectionState}
                            </span>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-2 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            className="w-full h-48 rounded-lg bg-theme-7"
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                            You
                        </div>
                    </div>
                    <div className="relative">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            className="w-full h-48 rounded-lg bg-theme-7"
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                            {receiver.username}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={handleEndCall}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1a1 1 0 000 2v1a1 1 0 000 2v1a1 1 0 000 2v1a1 1 0 000 2v1a1 1 0 000 2v1a2 2 0 002 2h14a2 2 0 002-2v-1a1 1 0 000-2v-1a1 1 0 000-2v-1a1 1 0 000-2v-1a1 1 0 000-2v-1a1 1 0 000-2V5a2 2 0 00-2-2H5z"
                            />
                        </svg>
                        End Call
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallInterface; 