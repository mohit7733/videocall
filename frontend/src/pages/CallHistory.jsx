import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { FiArrowLeft, FiClock, FiUsers, FiFileText } from 'react-icons/fi';

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    try {
      const response = await api.get('/api/calls/history');
      setCalls(response.data.calls);
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800">Call History</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {calls.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No call history found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Call List */}
            <div className="lg:col-span-1 space-y-4">
              {calls.map((call) => (
                <div
                  key={call._id}
                  onClick={() => setSelectedCall(call)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${
                    selectedCall?._id === call._id
                      ? 'ring-2 ring-blue-500'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <FiClock className="mr-1" />
                      {formatDate(call.endedAt || call.startedAt)}
                    </div>
                    {call.duration > 0 && (
                      <span className="text-sm text-gray-500">
                        {formatDuration(call.duration)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <FiUsers className="mr-1" />
                    {call.participants.length} participant(s)
                  </div>
                  {call.summary?.overview && (
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {call.summary.overview}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Call Details */}
            {selectedCall && (
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Call Details</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Room ID
                    </h3>
                    <p className="text-gray-900">{selectedCall.roomId}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Started At
                    </h3>
                    <p className="text-gray-900">
                      {formatDate(selectedCall.startedAt)}
                    </p>
                  </div>

                  {selectedCall.endedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Ended At
                      </h3>
                      <p className="text-gray-900">
                        {formatDate(selectedCall.endedAt)}
                      </p>
                    </div>
                  )}

                  {selectedCall.duration > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Duration
                      </h3>
                      <p className="text-gray-900">
                        {formatDuration(selectedCall.duration)}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Participants
                    </h3>
                    <div className="space-y-1">
                      {selectedCall.participants.map((participant) => (
                        <div key={participant._id} className="text-gray-900">
                          {participant.name} ({participant.email})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                {selectedCall.transcript && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <FiFileText className="mr-2" />
                      Transcript
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedCall.transcript}
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedCall.summary && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Summary</h3>

                    {selectedCall.summary.overview && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Overview
                        </h4>
                        <p className="text-gray-600">
                          {selectedCall.summary.overview}
                        </p>
                      </div>
                    )}

                    {selectedCall.summary.keyPoints?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Key Points
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {selectedCall.summary.keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedCall.summary.decisions?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Decisions
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {selectedCall.summary.decisions.map((decision, index) => (
                            <li key={index}>{decision}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedCall.summary.actionItems?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Action Items
                        </h4>
                        <ul className="space-y-2">
                          {selectedCall.summary.actionItems.map((item, index) => (
                            <li
                              key={index}
                              className="bg-gray-50 rounded-lg p-3 text-gray-600"
                            >
                              <div className="font-medium">{item.item}</div>
                              {item.assignedTo && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Assigned to: {item.assignedTo}
                                </div>
                              )}
                              {item.dueDate && (
                                <div className="text-sm text-gray-500">
                                  Due: {formatDate(item.dueDate)}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Media Links */}
                {(selectedCall.audioUrl || selectedCall.videoUrl) && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Media Files
                    </h3>
                    <div className="space-y-2">
                      {selectedCall.audioUrl && (
                        <a
                          href={selectedCall.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 block"
                        >
                          Download Audio
                        </a>
                      )}
                      {selectedCall.videoUrl && (
                        <a
                          href={selectedCall.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 block"
                        >
                          Download Video
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;

