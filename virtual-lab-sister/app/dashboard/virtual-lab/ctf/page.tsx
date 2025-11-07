'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ErrorDisplay from '@/components/ErrorDisplay'
import SuccessDisplay from '@/components/SuccessDisplay'
import DebugPanel from '@/components/DebugPanel'

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  points: number
  category: string
  solved?: boolean
}

interface ErrorState {
  status?: number
  message: string
  details?: any
}

interface SubmissionResult {
  correct: boolean
  message: string
  status?: number
}

export default function CTFPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [flagInputs, setFlagInputs] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, SubmissionResult>>({})
  const [error, setError] = useState<ErrorState | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    checkAuth()
    loadChallenges()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      setDebugInfo((prev: any) => ({
        ...prev,
        auth: {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          sessionError: sessionError?.message
        }
      }))

      if (sessionError || !session) {
        setError({
          status: 401,
          message: 'Not authenticated. Please login again.',
          details: sessionError
        })
      }
    } catch (err: any) {
      console.error('Auth check error:', err)
      setError({
        status: 500,
        message: 'Failed to check authentication',
        details: err
      })
    }
  }

  async function loadChallenges() {
    try {
      setDebugInfo((prev: any) => ({ ...prev, loading: true }))
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError({
          status: 401,
          message: 'User not authenticated',
          details: userError
        })
        setLoading(false)
        return
      }

      // Get all challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('ctf_challenges')
        .select('*')
        .order('points', { ascending: true })

      setDebugInfo((prev: any) => ({
        ...prev,
        loading: false,
        challenges: {
          count: challengesData?.length || 0,
          error: challengesError?.message
        }
      }))

      if (challengesError) {
        console.error('Error loading challenges:', challengesError)
        setError({
          status: 500,
          message: 'Failed to load challenges',
          details: challengesError
        })
        setLoading(false)
        return
      }

      // Get user's solved challenges
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('ctf_submissions')
        .select('challenge_id')
        .eq('user_id', user.id)
        .eq('correct', true)

      if (submissionsError) {
        console.error('Error loading submissions:', submissionsError)
      }

      const solvedIds = new Set(submissionsData?.map(s => s.challenge_id) || [])

      const enrichedChallenges = challengesData?.map(c => ({
        ...c,
        solved: solvedIds.has(c.id)
      })) || []

      setChallenges(enrichedChallenges)
    } catch (err: any) {
      console.error('Error:', err)
      setError({
        status: 500,
        message: 'Unexpected error loading challenges',
        details: err
      })
    } finally {
      setLoading(false)
    }
  }

  async function submitFlag(challengeId: string) {
    const flag = flagInputs[challengeId]?.trim()
    
    if (!flag) {
      setResults({
        ...results,
        [challengeId]: { 
          correct: false, 
          message: '⚠️ Please enter a flag',
          status: 400
        }
      })
      return
    }

    setSubmitting(challengeId)
    setError(null)
    
    try {
      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      setDebugInfo((prev: any) => ({
        ...prev,
        submit: {
          step: 'auth_check',
          hasSession: !!session,
          sessionError: sessionError?.message,
          challengeId,
          flagLength: flag.length
        }
      }))

      if (sessionError || !session) {
        setError({
          status: 401,
          message: 'You must be logged in to submit flags',
          details: sessionError
        })
        setResults({
          ...results,
          [challengeId]: {
            correct: false,
            message: '🔒 Authentication required. Please login again.',
            status: 401
          }
        })
        setSubmitting(null)
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      setDebugInfo((prev: any) => ({
        ...prev,
        submit: {
          ...prev.submit,
          step: 'get_user',
          userId: user?.id,
          userError: userError?.message
        }
      }))

      if (userError || !user) {
        setError({
          status: 401,
          message: 'Could not verify user identity',
          details: userError
        })
        setResults({
          ...results,
          [challengeId]: {
            correct: false,
            message: '🔒 User verification failed',
            status: 401
          }
        })
        setSubmitting(null)
        return
      }

      // Make API request
      const response = await fetch('/api/ctf/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: challengeId, 
          flag: flag 
        })
      })

      const data = await response.json()

      setDebugInfo((prev: any) => ({
        ...prev,
        submit: {
          ...prev.submit,
          step: 'api_response',
          status: response.status,
          statusText: response.statusText,
          responseData: data,
          timestamp: new Date().toISOString()
        }
      }))

      if (!response.ok) {
        let errorMessage = 'Failed to submit flag'
        let status = response.status

        if (status === 401) {
          errorMessage = '🔒 Unauthorized - Please login again'
        } else if (status === 403) {
          errorMessage = '⛔ Forbidden - Check your permissions'
        } else if (status === 404) {
          errorMessage = '❓ Challenge not found'
        } else if (status === 500) {
          errorMessage = '💥 Server error - Try again later'
        } else if (data.error) {
          errorMessage = data.error
        }

        setError({
          status,
          message: errorMessage,
          details: data
        })

        setResults({
          ...results,
          [challengeId]: {
            correct: false,
            message: `${errorMessage}: ${data.error || 'Unknown error'}`,
            status
          }
        })
        setSubmitting(null)
        return
      }

      // Success response
      if (data.correct) {
        setResults({
          ...results,
          [challengeId]: {
            correct: true,
            message: '🎉 Correct! Challenge solved!',
            status: 200
          }
        })

        // Clear input and reload challenges
        setFlagInputs({ ...flagInputs, [challengeId]: '' })
        setTimeout(() => {
          loadChallenges()
          // Clear success message after showing solved status
          setTimeout(() => {
            setResults(prev => {
              const newResults = { ...prev }
              delete newResults[challengeId]
              return newResults
            })
          }, 3000)
        }, 1000)
      } else {
        setResults({
          ...results,
          [challengeId]: {
            correct: false,
            message: '❌ Incorrect flag. Try again!',
            status: 200
          }
        })
      }
    } catch (err: any) {
      console.error('Submission error:', err)
      
      setError({
        status: 0,
        message: 'Network error',
        details: err
      })

      setResults({
        ...results,
        [challengeId]: {
          correct: false,
          message: '🌐 Network error. Check your connection and try again.',
          status: 0
        }
      })
    } finally {
      setSubmitting(null)
    }
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    hard: 'bg-red-100 text-red-800 border-red-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 CTF Challenges</h1>
          <p className="text-gray-600 mt-1">Capture the flag and earn points!</p>
        </div>
        <button
          onClick={() => loadChallenges()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <ErrorDisplay 
          error={error} 
          onDismiss={() => setError(null)} 
        />
      )}

      <DebugPanel data={debugInfo} label="Debug Information" />

      {challenges.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-500 text-lg font-semibold">No challenges available yet</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new challenges</p>
          <button
            onClick={() => loadChallenges()}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {challenges.map((challenge) => {
            const result = results[challenge.id]
            const hasResult = !!result
            
            return (
              <div
                key={challenge.id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all ${
                  challenge.solved 
                    ? 'border-2 border-green-500 bg-green-50' 
                    : hasResult && result.correct
                    ? 'border-2 border-green-400'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {challenge.title}
                      </h3>
                      {challenge.solved && (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                          ✓ SOLVED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 whitespace-pre-line">
                      {challenge.description}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        difficultyColors[challenge.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {challenge.difficulty?.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        📂 {challenge.category}
                      </span>
                      <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                        🏆 {challenge.points} pts
                      </span>
                    </div>
                  </div>
                </div>

                {!challenge.solved && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={flagInputs[challenge.id] || ''}
                        onChange={(e) => setFlagInputs({
                          ...flagInputs,
                          [challenge.id]: e.target.value
                        })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !submitting) {
                            submitFlag(challenge.id)
                          }
                        }}
                        placeholder="Enter flag (e.g., FLAG{...})"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        disabled={submitting === challenge.id}
                      />
                      <button
                        onClick={() => submitFlag(challenge.id)}
                        disabled={submitting === challenge.id}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                      >
                        {submitting === challenge.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Checking...
                          </span>
                        ) : (
                          'Submit 🚀'
                        )}
                      </button>
                    </div>

                    {hasResult && (
                      <div className={`mt-3 p-4 rounded-lg border-2 font-medium ${
                        result.correct 
                          ? 'bg-green-50 text-green-800 border-green-300' 
                          : result.status === 401
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                          : result.status === 0
                          ? 'bg-purple-50 text-purple-800 border-purple-300'
                          : result.status && result.status >= 500
                          ? 'bg-orange-50 text-orange-800 border-orange-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className="text-xl">
                            {result.correct 
                              ? '🎉' 
                              : result.status === 401 
                              ? '🔒' 
                              : result.status === 0
                              ? '🌐'
                              : result.status && result.status >= 500
                              ? '💥'
                              : '❌'
                            }
                          </span>
                          <div className="flex-1">
                            <div>{result.message}</div>
                            {result.status && (
                              <div className="text-xs mt-1 opacity-75">
                                Status: {result.status}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {challenge.solved && (
                  <div className="mt-4 border-t border-green-200 pt-4">
                    <div className="bg-green-100 border-2 border-green-300 text-green-800 p-4 rounded-lg font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎊</span>
                        <div>
                          <div className="font-bold">Congratulations!</div>
                          <div className="text-sm">You've already solved this challenge and earned {challenge.points} points!</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {challenges.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-800">
          <div className="font-semibold mb-1">💡 Tips:</div>
          <ul className="list-disc list-inside space-y-1 text-indigo-700">
            <li>Flags always follow the format: <code className="bg-indigo-100 px-1 rounded">FLAG&#123;...&#125;</code></li>
            <li>Read the challenge description carefully for hints</li>
            <li>Use external tools if needed (CyberChef, Base64 decoders, etc.)</li>
            <li>Learn from each attempt, even failed ones!</li>
          </ul>
        </div>
      )}
    </div>
  )
}