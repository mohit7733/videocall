import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import api from '../utils/api';
import { FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiSave } from 'react-icons/fi';

const VideoCall = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Don't initialize WebRTC until user is loaded
  const {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isConnected,
    isRecording,
    startRecording,
    stopRecording,
    getRecordedAudio,
    cleanup
  } = useWebRTC(roomId, user?.id);

  // useEffect(() => {
  //   return () => {
  //     cleanup();
  //   };
  // }, [cleanup]);

  // Show loading if user is not available
  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleEndCall = async () => {
    try {
      // Stop recording if active
      if (isRecording) {
        stopRecording();
      }

      // Get recorded audio
      const audioBlob = getRecordedAudio();
      
      if (audioBlob) {
        setIsProcessing(true);
        
        // Upload recording
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('roomId', roomId);

        await api.post('/api/calls/upload-recording', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      // End call
      await api.post(`/api/calls/end/${roomId}`);
      
      cleanup();
      navigate('/');
    } catch (error) {
      console.error('Error ending call:', error);
      cleanup();
      navigate('/');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Room: {roomId}</h2>
          <p className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Connecting...'}
          </p>
        </div>
        {isProcessing && (
          <div className="text-yellow-400">
            Processing recording...
          </div>
        )}
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Remote Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-4xl mb-4">👤</div>
                  <p>Waiting for participant...</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-4xl mb-4">You</div>
                  <p>Loading camera...</p>
                </div>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Recording
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6 flex justify-center space-x-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${
            isMuted
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          } transition-colors`}
        >
          {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${
            !isVideoEnabled
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          } transition-colors`}
        >
          {isVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
        </button>

        <button
          onClick={handleEndCall}
          disabled={isProcessing}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <FiPhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;

