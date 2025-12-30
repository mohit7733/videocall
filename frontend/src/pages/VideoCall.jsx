import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import api from '../utils/api';
import {
  FiPhoneOff,
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiSave,
  FiPause,
  FiPlay,
  FiDownload,
  FiShare,
  FiSettings,
  FiUsers,
  FiMessageSquare,
  FiMaximize,
  FiMinimize
} from 'react-icons/fi';
import { FaRegCircle, FaCircle } from 'react-icons/fa';

const VideoCall = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, paused, stopped
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isConnected,
    isRecording,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getRecordedAudio,
    cleanup
  } = useWebRTC(roomId, user?.id);

  // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     cleanup();
  //     if (timerRef.current) {
  //       clearInterval(timerRef.current);
  //     }
  //     if (audioContextRef.current) {
  //       audioContextRef.current.close();
  //     }
  //   };
  // }, [cleanup]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Call duration timer
  useEffect(() => {
    const callTimer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(callTimer);
  }, []);

  // Audio level visualization
  useEffect(() => {
    if (localStream && isConnected) {
      setupAudioAnalyser();
    }
  }, [localStream, isConnected]);

  const setupAudioAnalyser = () => {
    if (!localStream) return;

    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(localStream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(average / 128, 1));
        requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analyser:', error);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    if (isConnected && startRecording) {
      startRecording();
      setRecordingTime(0);
      setRecordingStatus('recording');
    }
  };

  const handleStopRecording = () => {
    if (stopRecording) {
      stopRecording();
      setRecordingStatus('stopped');
    }
  };

  const handlePauseRecording = () => {
    if (pauseRecording) {
      pauseRecording();
      setRecordingStatus('paused');
    }
  };

  const handleResumeRecording = () => {
    if (resumeRecording) {
      resumeRecording();
      setRecordingStatus('recording');
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !isMuted;
        audioTracks.forEach(track => {
          track.enabled = newState;
        });
        setIsMuted(newState);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !isVideoEnabled;
        videoTracks.forEach(track => {
          track.enabled = newState;
        });
        setIsVideoEnabled(newState);
      }
    }
  };

  const toggleFullscreen = () => {
    const element = document.documentElement;
    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const sendChatMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: user.name || 'You',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      // Here you would typically send the message via WebRTC data channel
    }
  };

  const handleEndCall = async () => {
    try {
      // Stop recording if active
      if (isRecording || recordingStatus === 'recording' || recordingStatus === 'paused') {
        handleStopRecording();
      }

      // Wait a moment for recording to finalize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get recorded audio
      let audioBlob = null;
      if (getRecordedAudio) {
        audioBlob = getRecordedAudio();
      }

      console.log("Audio Blob:", audioBlob);

      if (audioBlob && audioBlob.size > 0) {
        setIsProcessing(true);

        // Upload recording
        const formData = new FormData();
        formData.append('audio', audioBlob, `recording_${roomId}_${Date.now()}.webm`);
        formData.append('roomId', roomId);
        formData.append('userId', user.id);
        formData.append('duration', recordingTime);

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

  const downloadRecording = () => {
    const audioBlob = getRecordedAudio();
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call_recording_${roomId}_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Loading user data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <h2 className="text-xl font-bold">Room: {roomId}</h2>
          </div>
          <div className="hidden md:block text-sm text-gray-300">
            <span>Call duration: {formatTime(callDuration)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isRecording && (
            <div className="flex items-center bg-red-900/30 px-3 py-1 rounded-full">
              <FaCircle className="text-red-500 mr-2 animate-pulse" />
              <span className="text-sm">Recording: {formatTime(recordingTime)}</span>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center bg-yellow-900/30 px-3 py-1 rounded-full">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-yellow-500 mr-2"></div>
              <span className="text-sm">Processing...</span>
            </div>
          )}

          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle Chat"
          >
            <FiMessageSquare size={20} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Video Container */}
        <div className={`relative bg-black ${showChat ? 'w-3/4' : 'w-full'}`}>
          <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {/* Remote Video - Enhanced */}
            <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
              {remoteStream ? (
                <div className="relative w-full h-full">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                    Remote Participant
                  </div>
                  {/* Audio level visualization */}
                  {!isMuted && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center space-x-1">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-100 ${audioLevel > i / 8 ? 'bg-green-500' : 'bg-gray-500'
                              }`}
                            style={{ height: `${(i + 1) * 4}px` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-50">👤</div>
                    <p className="text-gray-400">Waiting for participant...</p>
                    <div className="mt-4 flex space-x-2 justify-center">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-150"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Local Video - Enhanced */}
            <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
              {localStream ? (
                <div className="relative w-full h-full">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!isVideoEnabled ? 'opacity-50' : ''}`}
                  />
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    You
                  </div>

                  {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                        Camera is off
                      </div>
                    </div>
                  )}

                  {isRecording && (
                    <div className="absolute top-4 right-4 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center animate-pulse">
                      <FaCircle className="mr-2" />
                      <span className="text-sm">REC {formatTime(recordingTime)}</span>
                    </div>
                  )}

                  {/* Connection quality indicator */}
                  <div className="absolute bottom-4 right-4">
                    <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-xs text-white">
                        {isConnected ? 'Good' : 'Connecting...'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-50">📱</div>
                    <p className="text-gray-400">Initializing your camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map(message => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${message.sender === 'You' ? 'bg-blue-900/30 ml-8' : 'bg-gray-700/30 mr-8'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm text-blue-300">{message.sender}</span>
                    <span className="text-xs text-gray-400">{message.timestamp}</span>
                  </div>
                  <p className="text-white text-sm mt-1">{message.text}</p>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <FiMessageSquare className="mx-auto text-4xl mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Controls */}
      <div className="bg-gradient-to-t from-gray-800 to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Recording Controls */}
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={!isConnected}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all ${isConnected
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <FaRegCircle className="mr-2" />
                  Start Recording
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* <button
                    onClick={recordingStatus === 'paused' ? handleResumeRecording : handlePauseRecording}
                    className="flex items-center px-4 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
                  >
                    {recordingStatus === 'paused' ? <FiPlay className="mr-2" /> : <FiPause className="mr-2" />}
                    {recordingStatus === 'paused' ? 'Resume' : 'Pause'}
                  </button> */}
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center px-4 py-3 rounded-lg bg-red-700 hover:bg-red-800 text-white transition-colors"
                  >
                    <FiSave className="mr-2" />
                    Stop & Save
                  </button>
                </div>
              )}

              {recordingStatus === 'stopped' && (
                <button
                  onClick={downloadRecording}
                  className="flex items-center px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <FiDownload className="mr-2" />
                  Download
                </button>
              )}
            </div>

            {/* Media Controls */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-700/50 backdrop-blur-sm px-4 py-2 rounded-full">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-all ${isMuted
                    ? 'bg-red-600 text-white transform scale-110'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-all ${!isVideoEnabled
                    ? 'bg-red-600 text-white transform scale-110'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                  title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoEnabled ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
                </button>
              </div>

              {/* Call Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {/* Add screen share functionality */ }}
                  className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                  title="Share Screen"
                >
                  <FiShare size={20} />
                </button>

                <button
                  onClick={handleEndCall}
                  disabled={isProcessing}
                  className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="End Call"
                >
                  <FiPhoneOff size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span>Audio: {isMuted ? 'Muted' : 'On'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Video: {isVideoEnabled ? 'On' : 'Off'}</span>
                </div>
              </div>
              <div className="text-right">
                <span>Call ID: {roomId}</span>
                <span className="mx-2">•</span>
                <span>{formatTime(callDuration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;