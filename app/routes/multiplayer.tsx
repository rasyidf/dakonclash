import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '~/lib/utils';
const statusColors = {
  disconnected: 'text-red-600',
  creating: 'text-yellow-600',
  waiting: 'text-yellow-600',
  joining: 'text-yellow-600',
  connecting: 'text-yellow-600',
  connected: 'text-green-600',
} as const;

type StatusColorKey = keyof typeof statusColors;

const GameConnection = () => {
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StatusColorKey>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [gameId, setGameId] = useState('');

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);

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

      // Create shareable URL with offer
      const offerString = btoa(JSON.stringify(pc.localDescription));
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

      // Parse and set remote description
      const offer = JSON.parse(atob(offerString));
      await pc.setRemoteDescription(offer);

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

      // Create answer URL parameter
      const answerString = btoa(JSON.stringify(pc.localDescription));
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

  // Add this new effect to handle answer in host mode
  useEffect(() => {
    if (isHost && peerConnection.current) {
      const params = new URLSearchParams(window.location.search);
      const answer = params.get('answer');
      
      if (answer) {
        try {
          const answerSDP = JSON.parse(atob(answer));
          peerConnection.current.setRemoteDescription(answerSDP)
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