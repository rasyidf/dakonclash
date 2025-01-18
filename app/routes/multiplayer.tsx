import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '~/lib/utils';
import { Spinner } from '~/components/ui/spinner';

// Debug constants for WebRTC configuration
const statusColors: Record<Partial<RTCIceConnectionState> | "disconnected" | "creating" | "waiting" | "joining" | "connecting" | "checking" | "connected", string> = {
  disconnected: 'text-red-500',
  creating: 'text-blue-500',
  waiting: 'text-amber-500',
  joining: 'text-blue-500',
  connecting: 'text-amber-500',
  checking: 'text-amber-500',
  connected: 'text-emerald-500',
  closed: 'text-red-500',
  completed: 'text-emerald-500',
  failed: 'text-red-600',
  new: 'text-blue-500',
};

type StatusColorKey = keyof typeof statusColors;

interface ConnectionData {
  sdp: string;
  type: 'offer' | 'answer';
}

// Improved compression for shorter URLs
const compressData = (data: any): string => {
  console.debug('[CompressData] Input size:', JSON.stringify(data).length);
  // Remove unnecessary SDP lines and compress
  if (data.sdp) {
    data.sdp = data.sdp
      .split('\n')
      .filter((line: string) => !line.startsWith('a=ice-options:'))
      .filter((line: string) => !line.startsWith('a=msid-semantic:'))
      .join('\n');
  }
  
  const jsonStr = JSON.stringify(data);
  const compressed = btoa(jsonStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  console.debug('[CompressData] Compressed size:', compressed.length);
  return compressed;
};

const decompressData = (compressed: string): any => {
  console.debug('[DecompressData] Attempting to decompress data of length:', compressed.length);
  try {
    const base64 = compressed.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decompressed = JSON.parse(atob(padded));
    console.debug('[DecompressData] Successfully decompressed data');
    return decompressed;
  } catch (error) {
    console.error('[DecompressData] Failed to decompress:', error);
    throw new Error('Invalid connection data');
  }
};

const GameConnection = () => {
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StatusColorKey>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [gameId, setGameId] = useState('');

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

  const initializePeerConnection = () => {
    console.debug('[PeerConnection] Initializing with local network only configuration');
    const config: RTCConfiguration = {
      iceServers: [], // Empty array for LAN-only connections
      iceTransportPolicy: 'relay', // Forces local network connections
      iceCandidatePoolSize: 0 // No need for candidate pool in LAN
    };

    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      console.debug('[ICE] New candidate:', event.candidate?.candidate);
      if (event.candidate) {
        // Only use local network candidates
        if (event.candidate.candidate.includes('host')) {
          console.debug('[ICE] Adding local network candidate to queue');
          iceCandidatesQueue.current.push(event.candidate);
          
          // For host: update gameId with the latest offer
          if (isHost && pc.localDescription) {
            updateGameUrl();
          }
        } else {
          console.debug('[ICE] Ignoring non-local candidate');
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.debug('[ICE] State change:', pc.iceConnectionState);
      console.debug('[ICE] Gathering state:', pc.iceGatheringState);
      setConnectionStatus(pc.iceConnectionState as StatusColorKey);
    };

    pc.onconnectionstatechange = () => {
      console.debug('[Connection] State change:', pc.connectionState);
      console.debug('[Connection] Signaling state:', pc.signalingState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'failed') {
        setErrorMessage('Connection failed. Please try again.');
        setConnectionStatus('disconnected');
      }
    };

    return pc;
  };

  const updateGameUrl = () => {
    if (!peerConnection.current?.localDescription) return;

    const connectionData: ConnectionData = {
      sdp: peerConnection.current.localDescription.sdp,
      type: peerConnection.current.localDescription.type as 'offer' | 'answer'
    };

    const compressedData = compressData(connectionData);
    const baseUrl = window.location.origin;
    const gameUrl = `${baseUrl}/multiplayer?g=${compressedData}`;
    setGameId(gameUrl);
  };

  const setupDataChannel = (channel: RTCDataChannel) => {
    console.debug('[DataChannel] Setting up channel:', channel.label);
    
    channel.onopen = () => {
      console.debug('[DataChannel] Opened with config:', {
        ordered: channel.ordered,
        maxRetransmits: channel.maxRetransmits
      });
      console.log('Data channel opened');
      setConnectionStatus('connected');
      
      // Exchange ICE candidates through data channel once connected
      if (iceCandidatesQueue.current.length > 0) {
        channel.send(JSON.stringify({
          type: 'ice-candidates',
          candidates: iceCandidatesQueue.current.map(c => c.toJSON())
        }));
      }
    };

    channel.onclose = () => {
      console.debug('[DataChannel] Closed - Last state:', channel.readyState);
      console.log('Data channel closed');
      setConnectionStatus('disconnected');
    };

    channel.onmessage = async (event) => {
      console.debug('[DataChannel] Received message of size:', event.data.length);
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ice-candidates' && peerConnection.current) {
          for (const candidate of message.candidates) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      } catch (error) {
        console.error('[DataChannel] Message parsing failed:', error);
        console.error('Error handling message:', error);
      }
    };

    channel.onerror = (error) => {
      console.error('[DataChannel] Error details:', {
        error,
        channelState: channel.readyState
      });
      console.error('Data channel error:', error);
      setErrorMessage('Data channel error occurred');
    };
  };

  const handleHostGame = async () => {
    console.debug('[Host] Starting host game setup');
    try {
      setIsHost(true);
      setConnectionStatus('creating');
      setErrorMessage('');

      const pc = initializePeerConnection();
      peerConnection.current = pc;

      dataChannel.current = pc.createDataChannel('gameChannel', {
        ordered: true,
        maxRetransmits: 3
      });
      setupDataChannel(dataChannel.current);

      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      console.debug('[Host] Created data channel:', dataChannel.current.label);
      console.debug('[Host] Local description set:', pc.localDescription?.type);
      
      // Generate initial game URL with just the offer
      updateGameUrl();
      setConnectionStatus('waiting');

    } catch (error) {
      console.error('[Host] Setup failed:', error);
      console.error('Error creating game:', error);
      setErrorMessage('Failed to create game. Please try again.');
      setConnectionStatus('disconnected');
    }
  };

  const handleJoinGame = async (compressedData: string) => {
    console.debug('[Join] Starting join process with data length:', compressedData.length);
    try {
      const connectionData: ConnectionData = decompressData(compressedData);
      
      setIsHost(false);
      setConnectionStatus('joining');
      setErrorMessage('');

      const pc = initializePeerConnection();
      peerConnection.current = pc;

      pc.ondatachannel = (event) => {
        dataChannel.current = event.channel;
        setupDataChannel(dataChannel.current);
      };

      await pc.setRemoteDescription(new RTCSessionDescription({
        sdp: connectionData.sdp,
        type: connectionData.type
      }));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.debug('[Join] Remote description set:', connectionData.type);
      console.debug('[Join] Local answer created:', answer.type);
      
      setConnectionStatus('connecting');

    } catch (error) {
      console.error('[Join] Setup failed:', error);
      console.error('Error joining game:', error);
      setErrorMessage('Failed to join game. Please try again.');
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameData = params.get('g');

    if (gameData) {
      handleJoinGame(gameData);
    }

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const resetConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
    
    iceCandidatesQueue.current = [];
    setErrorMessage('');
    setConnectionStatus('disconnected');
    setGameId('');
    setIsHost(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const getStatusDisplay = () => {
    return (
      <span className={cn(statusColors[connectionStatus] || 'text-gray-100')}>
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
          <div className="text-center text-lg mb-4 px-4 py-2 bg-slate-200 rounded-md">
            {getStatusDisplay()}
          </div>

          {['checking', 'creating', 'connecting'].includes(connectionStatus) && (
            <Spinner size="large" show={true} className="mx-auto" />
          )}

          {connectionStatus === 'disconnected' && (
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

        {connectionStatus === 'waiting' && (
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

        {connectionStatus === 'connected' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600">
              Connected! Ready to play!
            </h2>
            {/* Add your game component here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameConnection;