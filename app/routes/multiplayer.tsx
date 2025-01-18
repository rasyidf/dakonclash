import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '~/lib/utils';
const statusColors: Record<Partial<RTCIceConnectionState> | "disconnected" | "creating" | "waiting" | "joining" | "connecting" | "checking" | "connected", string> = {
  disconnected: 'text-red-500',   // Bright red for clearly broken connection
  creating: 'text-blue-500',      // Blue for initialization
  waiting: 'text-amber-500',      // Amber for waiting states
  joining: 'text-blue-500',       // Blue for initialization
  connecting: 'text-amber-500',   // Amber for intermediate states
  checking: 'text-amber-500',     // Amber for verification
  connected: 'text-emerald-500',  // Emerald for successful connection
  closed: 'text-red-500',         // Red for terminated connection
  completed: 'text-emerald-500',  // Emerald for successful ICE completion
  failed: 'text-red-600',         // Dark red for connection failure
  new: 'text-blue-500',           // Blue for new connection
};

type StatusColorKey = keyof typeof statusColors; // | RTCIceConnectionState;

interface ConnectionData {
  description: RTCSessionDescription;
  candidates: RTCIceCandidate[];
}

const GameConnection = () => {
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StatusColorKey>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [gameId, setGameId] = useState('');

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const iceCandidates = useRef<RTCIceCandidate[]>([]);

  // Initialize WebRTC on component mount
  useEffect(() => {
    // Check URL parameters for game joining
    const params = new URLSearchParams(window.location.search);
    const offer = params.get('offer');

    if (offer) {
      handleJoinGame(offer);
    }

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    pc.oniceconnectionstatechange = () => {
      setConnectionStatus(pc.iceConnectionState as StatusColorKey);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected' as StatusColorKey);
      } else if (pc.connectionState === 'failed') {
        setErrorMessage('Connection failed. Please try again.');
        setConnectionStatus('disconnected' as StatusColorKey);
      }
    };

    // Add ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.current.push(event.candidate);
      }
    };

    return pc;
  };

  const handleHostGame = async () => {
    try {
      setIsHost(true);
      setConnectionStatus('creating' as StatusColorKey);

      const pc = initializePeerConnection();
      peerConnection.current = pc;

      // Create data channel
      dataChannel.current = pc.createDataChannel('gameChannel');
      setupDataChannel(dataChannel.current);

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>(resolve => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              resolve();
            }
          };
        }
      });

      // Create connection data with description and candidates
      const connectionData: ConnectionData = {
        description: pc.localDescription as RTCSessionDescription,
        candidates: iceCandidates.current
      };

      // Create shareable URL with offer
      const offerString = btoa(JSON.stringify(connectionData));
      // Use the current host for the game URL
      const baseUrl = window.location.origin;
      const gameUrl = `${baseUrl}/multiplayer?offer=${offerString}`;
      setGameId(gameUrl);
      setConnectionStatus('waiting' as StatusColorKey);

    } catch (error) {
      console.error('Error creating game:', error);
      setErrorMessage('Failed to create game. Please try again.');
      setConnectionStatus('disconnected' as StatusColorKey);
    }
  };

  const handleJoinGame = async (offerString: string) => {
    try {
      // Validate the offer string
      if (!offerString || typeof offerString !== 'string') {
        throw new Error('Invalid game link');
      }

      setIsHost(false);
      setConnectionStatus('joining' as StatusColorKey);

      const pc = initializePeerConnection();
      peerConnection.current = pc;

      // Set up data channel handler
      pc.ondatachannel = (event) => {
        dataChannel.current = event.channel;
        setupDataChannel(dataChannel.current);
      };

      // Parse connection data
      const connectionData: ConnectionData = JSON.parse(atob(offerString));
      
      // Set remote description
      await pc.setRemoteDescription(connectionData.description);
      
      // Add received ICE candidates
      for (const candidate of connectionData.candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }

      // Create and set local answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Wait for ICE gathering to complete
      await new Promise<void>(resolve => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              resolve();
            }
          };
        }
      });

      // Create answer data with description and candidates
      const answerData: ConnectionData = {
        description: pc.localDescription as RTCSessionDescription,
        candidates: iceCandidates.current
      };

      const answerString = btoa(JSON.stringify(answerData));
      // Append answer to URL without navigating
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('answer', answerString);
      window.history.replaceState({}, '', newUrl);

      setConnectionStatus('connecting' as StatusColorKey);
    } catch (error) {
      console.error('Error joining game:', error);
      setErrorMessage('Failed to join game. Please try again.');
      setConnectionStatus('disconnected' as StatusColorKey);
    }
  };

  // Modify the answer handling effect
  useEffect(() => {
    if (isHost && peerConnection.current) {
      const params = new URLSearchParams(window.location.search);
      const answer = params.get('answer');

      if (answer) {
        try {
          const answerData: ConnectionData = JSON.parse(atob(answer));
          peerConnection.current.setRemoteDescription(answerData.description)
            .then(async () => {
              // Add received ICE candidates
              for (const candidate of answerData.candidates) {
                await peerConnection.current!.addIceCandidate(
                  new RTCIceCandidate(candidate)
                );
              }
            })
            .catch(error => {
              console.error('Error setting remote description:', error);
              setErrorMessage('Failed to establish connection. Please try again.');
              setConnectionStatus('disconnected' as StatusColorKey);
            });
        } catch (error) {
          console.error('Error parsing answer:', error);
        }
      }
    }
  }, [isHost]);

  const setupDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      console.log('Data channel opened');
      setConnectionStatus('connected' as StatusColorKey);
    };

    channel.onclose = () => {
      console.log('Data channel closed');
      setConnectionStatus('disconnected' as StatusColorKey);
    };

    channel.onmessage = (event: { data: any; }) => {
      // Handle incoming game messages
      console.log('Received message:', event.data);
      // You'll want to implement your game message handling here
    };
  };

  const resetConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
    setErrorMessage('');
    setConnectionStatus('disconnected');
    setGameId('');
    setIsHost(false);
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);
  };

  const getStatusDisplay = () => {
    return (
      <span className={cn(statusColors[connectionStatus] || 'text-gray-600')}>
        {connectionStatus}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl text-center font-bold text-gray-800 mb-8">Dakon Clash Connection</h1>

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            <p className="mb-2">{errorMessage}</p>
            <button
              onClick={resetConnection}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="text-center mb-4">
            Connection Status: {getStatusDisplay()}
          </div>

          {connectionStatus.toString() === 'disconnected' && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleHostGame}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Host New Game
              </button>
            </div>
          )}
        </div>

        {connectionStatus.toString() === 'waiting' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Share this QR Code to invite player:</h2>
              <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                <QRCodeSVG value={gameId} size={256} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-gray-700 font-medium">Or share this link:</p>
              <input
                type="text"
                value={gameId}
                readOnly
                className="w-full p-2 border rounded-lg bg-gray-50"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        )}

        {connectionStatus.toString() === 'connected' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600">
              Connected! Ready to play!
            </h2>
            {/* You'll want to transition to your game component here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameConnection;