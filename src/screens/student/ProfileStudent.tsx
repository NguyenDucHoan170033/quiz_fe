import React, { useEffect, useState } from "react";
import { Clock, BookOpen, Target, Award, Trophy } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';


interface GameSession {
  id: string;
  gameId: string;
  startTime: Date;
  endTime: Date;
  subject: string;
  completedActivities: {
    activityId: string;
    subject: string;
  }[];
  participants: {
    userId: string;
    totalScore: number;
  }[];
}

interface LearningProfile {
  subject: string;
  bestScore: number;
  totalSessions: number;
  lastPlayed: Date;
  status: 'IMPROVED' | 'DECLINED' | 'MAINTAINED';
}

interface SubjectStrength {
  subject: string;
  bestScore: number;
  totalSessions: number;
  averageScore: number;
  lastPlayed: Date;
}

interface SubjectWeakness {
  subject: string;
  bestScore: number;
  totalSessions: number;
  averageScore: number;
  lastPlayed: Date;
  improvementAreas: string[];
}

interface SubjectProgress {
  subject: string;
  bestScore: number;
  totalSessions: number;
  lastPlayed: Date;
}

interface StudentProgress {
  id: string;
  studentId: string;
  totalScore: number;
  totalSessions: number;
  lastActivityDate: Date;
  recentSessions: GameSession[];
  learningProfile: LearningProfile;
  subjectProgressList: SubjectProgress[];
  displayName?: string;
}

const STUDENT_PROGRESS_API_URL = `${API_BASE_URL}api/student-progress`;

// Add axios interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const ProfileStudent: React.FC = () => {
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get student email from token
  const getStudentEmail = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;

      const tokenPayload = JSON.parse(atob(tokenParts[1]));
      return tokenPayload.sub;
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  };

  useEffect(() => {
    const fetchStudentProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          navigate('/login');
          return;
        }

        const studentEmail = getStudentEmail();
        if (!studentEmail) {
          setError('Could not determine student email');
          setLoading(false);
          navigate('/login');
          return;
        }

        // First update the progress
        await axios.post(
          `${STUDENT_PROGRESS_API_URL}/${studentEmail}/update`,
          {},
          { withCredentials: true }
        );

        // Then get the updated progress
        const response = await axios.get(
          `${STUDENT_PROGRESS_API_URL}/${studentEmail}`,
          { withCredentials: true }
        );

        if (response.data) {
          // Ensure dates are properly parsed and get subject name
          const progress = {
            ...response.data,
            lastActivityDate: new Date(response.data.lastActivityDate),
            recentSessions: response.data.recentSessions?.map((session: any) => ({
              ...session,
              startTime: new Date(session.startTime),
              endTime: new Date(session.endTime),
              subject: session.subject || 'No Subject'
            })) || [],
            subjectProgressList: response.data.subjectProgressList?.map((sp: any) => ({
              ...sp,
              lastPlayed: new Date(sp.lastPlayed)
            })) || [],
            learningProfile: response.data.learningProfile ? {
              ...response.data.learningProfile,
              lastPlayed: new Date(response.data.learningProfile.lastPlayed)
            } : {
              subject: 'No Subject',
              bestScore: 0,
              totalSessions: 0,
              lastPlayed: new Date(),
              status: 'MAINTAINED'
            }
          };
          setStudentProgress(progress);
          setError(null);
        } else {
          setError('No data received from server');
        }
      } catch (error: any) {
        console.error('Error details:', error.response?.data);
        if (error.response?.status === 403 || error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          setError('Authentication failed. Please log in again.');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch student progress');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProgress();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!studentProgress) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No progress data available</p>
        </div>
      </div>
    );
  }

  // Helper function to get student's score from a session
  const getStudentScore = (session: GameSession) => {
    if (!session?.participants || !Array.isArray(session.participants)) {
      return 0;
    }
    const participant = session.participants.find(p => p.userId === studentProgress?.studentId);
    return participant?.totalScore || 0;
  };

  // Helper function to calculate rank
  const calculateRank = (session: GameSession) => {
    if (!session?.participants || !Array.isArray(session.participants)) {
      return 0;
    }
    const sortedParticipants = [...session.participants].sort((a, b) => b.totalScore - a.totalScore);
    const studentIndex = sortedParticipants.findIndex(p => p.userId === studentProgress?.studentId);
    return studentIndex + 1;
  };

  // Helper: Lấy các session trong 7 ngày gần nhất
  const getRecentWeekSessions = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return studentProgress.recentSessions.filter(
      (session) => new Date(session.endTime) >= oneWeekAgo
    );
  };

  // Tính lại Total Score trong 7 ngày gần nhất
  const getWeeklyTotalScore = () => {
    const weekSessions = getRecentWeekSessions();
    return weekSessions.reduce((sum, session) => sum + getStudentScore(session), 0);
  };

  // Tính lại Best Rank trong 7 ngày gần nhất
  const getWeeklyBestRank = () => {
    const weekSessions = getRecentWeekSessions();
    const ranks = weekSessions.map((session) => calculateRank(session)).filter((rank) => rank > 0);
    return ranks.length > 0 ? Math.min(...ranks) : 0;
  };

   return (
    <>
      {/* Background */}
      <div className="!fixed !inset-0 !z-0 !bg-gradient-to-br !from-blue-50 !via-indigo-50 !to-purple-50"></div>

      {/* Aspect Ratio Container */}
      <div className="relative w-full max-w-7xl mx-auto" style={{ aspectRatio: "16/9" }}>
        {/* Main content */}
        <div className="absolute inset-0">
          {/* Date display */}
          <div className="!absolute !top-6 !right-6 !z-20">
            <div className="!relative">
              <div className="!bg-gradient-to-r !from-blue-500 !to-blue-600 !px-6 !py-4 !rounded-2xl !border-0 !shadow-xl">
                <div className="!text-white !font-bold !text-base !text-center">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Welcome message */}
          <div className="!absolute !top-5 !left-6 !z-20">
            <div className="!bg-white !px-6 !py-4 !rounded-2xl !shadow-lg !border-l-4 !border-blue-500">
              <div className="!text-gray-800 !font-bold !text-xl">Welcome, {studentProgress.displayName}!</div>
              <div className="!text-gray-600 !text-sm !mt-1">Continue your learning journey</div>
            </div>
          </div>

          {/* Main content layout */}
          <div className="!pt-32 !pb-6 !flex !gap-6 !px-6">
            {/* Left Column - Stats */}
            <div className="!flex-shrink-0 !w-64 !space-y-6">
              {/* Total Score */}
              <div className="!bg-white !rounded-2xl !shadow-lg !p-6 !border-l-4 !border-yellow-500">
                <div className="!text-center">
                  <div className="!w-12 !h-12 !mx-auto !mb-4 !bg-yellow-100 !rounded-full !flex !items-center !justify-center">
                    <svg className="!w-6 !h-6 !text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="!text-gray-600 !font-semibold !text-sm !mb-2">Total Score</div>
                  <div className="!text-3xl !font-bold !text-gray-800">{studentProgress.totalScore}</div>
                </div>
              </div>

              {/* Best Rank */}
              <div className="!bg-white !rounded-2xl !shadow-lg !p-6 !border-l-4 !border-green-500">
                <div className="!text-center">
                  <div className="!w-12 !h-12 !mx-auto !mb-4 !bg-green-100 !rounded-full !flex !items-center !justify-center">
                    <svg className="!w-6 !h-6 !text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16L3 14l5.5-5.5L12 12l4.5-4.5L22 9l-2 2-4.5-4.5L12 10 8.5 6.5 5 10l-2-2 2 2z" />
                    </svg>
                  </div>
                  <div className="!text-gray-600 !font-semibold !text-sm !mb-2">Best Rank</div>
                  <div className="!text-3xl !font-bold !text-gray-800">#{getWeeklyBestRank()}</div>
                </div>
              </div>
            </div>

            {/* Center Column - Recent Sessions */}
            <div className="!flex-1 !max-w-3xl !min-w-0">
              <div className="!bg-white !rounded-2xl !shadow-lg !p-6 !h-full !flex !flex-col !overflow-hidden">
                <h3 className="!text-gray-800 !font-bold !text-2xl !mb-6 !flex !items-center !justify-center !flex-shrink-0">
                  <div className="!w-8 !h-8 !bg-blue-100 !rounded-full !flex !items-center !justify-center !mr-4">
                    <svg className="!w-5 !h-5 !text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <div className="!text-center">
                    <div className="!text-gray-800 !text-xl">Recent Sessions</div>
                  </div>
                </h3>

                <div className={`!flex-1 !pr-2 !space-y-4 ${studentProgress.recentSessions && studentProgress.recentSessions.length > 5 ? '!overflow-y-auto' : ''}`}>
                  {studentProgress.recentSessions &&
                    Array.isArray(studentProgress.recentSessions) &&
                    studentProgress.recentSessions.map((session, index) => (
                      <div
                        key={session.id}
                        className="!bg-gray-50 !p-4 !rounded-xl !border !border-gray-200 !hover:shadow-md !transition-all !duration-300 !flex-shrink-0"
                      >
                        <div className="!flex !justify-between !items-center !gap-4">
                          <div className="!flex !items-center !flex-1 !min-w-0">
                            <div className="!w-12 !h-12 !rounded-full !bg-blue-100 !flex !items-center !justify-center !mr-4 !flex-shrink-0">
                              <svg className="!w-6 !h-6 !text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                {session.subject === "Math" ? (
                                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                                ) : session.subject === "Science" ? (
                                  <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zM5 9h14V7H5v2z" />
                                ) : (
                                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                )}
                              </svg>
                            </div>
                            <div className="!min-w-0 !flex-1">
                              <h4 className="!font-semibold !text-gray-800 !text-lg !truncate">
                                {session.subject || "No Subject"}
                              </h4>
                              <p className="!text-sm !text-gray-600 !truncate">
                                {new Date(session.startTime).toLocaleDateString("en-US")}
                              </p>
                            </div>
                          </div>
                          <div className="!flex !items-center !space-x-3 !flex-shrink-0">
                            <div className="!text-center !bg-yellow-50 !px-3 !py-2 !rounded-lg !border !border-yellow-200 !min-w-[70px]">
                              <p className="!text-xs !text-yellow-700 !font-semibold !whitespace-nowrap">Score</p>
                              <p className="!font-bold !text-yellow-800 !text-base">{getStudentScore(session)}</p>
                            </div>
                            <div className="!text-center !bg-green-50 !px-3 !py-2 !rounded-lg !border !border-green-200 !min-w-[70px]">
                              <p className="!text-xs !text-green-700 !font-semibold !whitespace-nowrap">Rank</p>
                              <p className="!font-bold !text-green-800 !text-base">#{calculateRank(session)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {(!studentProgress.recentSessions || studentProgress.recentSessions.length === 0) && (
                    <div className="!bg-gray-50 !p-6 !rounded-xl !text-center !border !border-gray-200">
                      <div className="!w-12 !h-12 !bg-gray-200 !rounded-full !flex !items-center !justify-center !mx-auto !mb-4">
                        <svg className="!w-6 !h-6 !text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                      <p className="!text-gray-700 !font-semibold !text-sm !mb-2">No sessions yet</p>
                      <p className="!text-gray-600 !text-xs">Start learning to see history!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Subject Progress */}
            <div className="!flex-shrink-0 !w-80 !min-w-0">
              <div className="!bg-white !rounded-2xl !shadow-lg !p-6 !h-full !flex !flex-col !overflow-hidden">
                <h3 className="!text-gray-800 !font-bold !text-xl !mb-6 !flex !items-center !justify-center !flex-shrink-0">
                  <div className="!w-8 !h-8 !bg-purple-100 !rounded-full !flex !items-center !justify-center !mr-3">
                    <svg className="!w-5 !h-5 !text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zM5 9h14V7H5v2z" />
                    </svg>
                  </div>
                  <div className="!text-center">
                    <div className="!text-gray-800 !text-lg">Subject Progress</div>
                  </div>
                </h3>

                <div className={`!flex-1 !pr-2 !space-y-4 ${studentProgress.subjectProgressList && studentProgress.subjectProgressList.length > 4 ? '!overflow-y-auto' : ''}`}>
                  {studentProgress.subjectProgressList && studentProgress.subjectProgressList.length > 0 ? (
                    studentProgress.subjectProgressList.map((sp, idx) => {
                      const subjectSessions = studentProgress.recentSessions
                        .filter((s) => s.subject === sp.subject)
                        .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
                      const lastSession = subjectSessions[0]
                      const lastScore = lastSession ? getStudentScore(lastSession) : 0
                      let prevBest = 0
                      if (subjectSessions.length > 1) {
                        const prevScores = subjectSessions.slice(1).map((s) => getStudentScore(s))
                        prevBest = prevScores.length > 0 ? Math.max(...prevScores) : 0
                      }
                      let eduMsg = ""
                      let eduColor = ""
                      if (lastScore === sp.bestScore && lastScore > prevBest && lastScore !== 0) {
                        eduMsg = "New record!"
                        eduColor = "!text-red-600"
                      } else if (lastScore === sp.bestScore && lastScore === prevBest && lastScore !== 0) {
                        eduMsg = "Excellent!"
                        eduColor = "!text-green-600"
                      } else if (lastScore < sp.bestScore && lastScore !== 0) {
                        eduMsg = "Keep trying!"
                        eduColor = "!text-blue-600"
                      } else {
                        eduMsg = "Start practicing!"
                        eduColor = "!text-gray-600"
                      }

                      return (
                        <div
                          key={idx}
                          className="!bg-gray-50 !p-4 !rounded-xl !border !border-gray-200 !hover:shadow-md !transition-all !duration-300 !flex-shrink-0"
                        >
                          <div className="!flex !items-center !justify-between !mb-3">
                            <div className="!flex !items-center !flex-1 !min-w-0">
                              <div className="!w-10 !h-10 !rounded-full !bg-indigo-100 !flex !items-center !justify-center !mr-3 !flex-shrink-0">
                                <svg className="!w-5 !h-5 !text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                                  {sp.subject === "Math" ? (
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                                  ) : sp.subject === "Science" ? (
                                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zM5 9h14V7H5v2z" />
                                  ) : (
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                  )}
                                </svg>
                              </div>
                              <span className="!font-semibold !text-gray-800 !text-base !truncate">{sp.subject}</span>
                            </div>
                          </div>

                          <div className="!flex !justify-between !text-sm !mb-3 !bg-white !p-3 !rounded-lg !gap-2">
                            <span className="!text-gray-700 !flex-1 !min-w-0">
                              Best: <strong className="!text-gray-800">{sp.bestScore}</strong>
                            </span>
                            <span className="!text-gray-700 !flex-1 !min-w-0 !text-right">
                              Recent: <strong className="!text-gray-800">{lastScore}</strong>
                            </span>
                          </div>

                          <div className="!mb-3 !bg-white !p-2 !rounded-lg">
                            <p className={`!text-sm !font-semibold ${eduColor} !truncate`}>{eduMsg}</p>
                          </div>

                          <div className="!relative !h-2 !bg-gray-200 !rounded-full !overflow-hidden">
                            <div
                              className="!h-full !bg-gradient-to-r !from-blue-500 !to-purple-600 !rounded-full !transition-all !duration-1000"
                              style={{ width: `${Math.min(Math.round((lastScore / 100) * 100), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="!bg-gray-50 !p-6 !rounded-xl !text-center !border !border-gray-200">
                      <div className="!w-12 !h-12 !bg-gray-200 !rounded-full !flex !items-center !justify-center !mx-auto !mb-4">
                        <svg className="!w-6 !h-6 !text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                      </div>
                      <p className="!text-gray-700 !font-semibold !text-sm !mb-2">No subject data</p>
                      <p className="!text-gray-600 !text-xs">Start a session to see progress!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfileStudent; 