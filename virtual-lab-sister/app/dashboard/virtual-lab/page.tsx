'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function VirtualLabPage() {
  const [stats, setStats] = useState({
    totalChallenges: 0,
    solvedChallenges: 0,
    userRank: 0,
    totalPoints: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get total challenges
      const { count: totalChallenges } = await supabase
        .from('ctf_challenges')
        .select('*', { count: 'exact', head: true })

      // Get user's solved challenges
      const { count: solvedChallenges } = await supabase
        .from('ctf_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('correct', true)

      // Get user's rank and points
      const { data: leaderboardData } = await supabase
        .from('leaderboard')
        .select('score, user_id')
        .order('score', { ascending: false })

      const userIndex = leaderboardData?.findIndex(entry => entry.user_id === user.id)
      const userRank = userIndex !== undefined && userIndex >= 0 ? userIndex + 1 : 0
      const totalPoints = leaderboardData?.find(entry => entry.user_id === user.id)?.score || 0

      setStats({
        totalChallenges: totalChallenges || 0,
        solvedChallenges: solvedChallenges || 0,
        userRank,
        totalPoints
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    {
      title: 'CTF Challenges',
      href: '/dashboard/virtual-lab/ctf',
      icon: '🎯',
      description: 'Capture The Flag challenges',
      color: 'bg-blue-500'
    },
    {
      title: 'Leaderboard',
      href: '/dashboard/leaderboard',
      icon: '🏆',
      description: 'See who\'s on top',
      color: 'bg-yellow-500'
    },
    {
      title: 'Terminal',
      href: '/dashboard/virtual-lab/terminal',
      icon: '💻',
      description: 'Linux shell simulator',
      color: 'bg-green-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧪 Virtual Lab</h1>
          <p className="text-gray-600 mt-1">Practice your cybersecurity skills</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{stats.totalChallenges}</div>
          <div className="text-sm text-gray-600 mt-1">Total Challenges</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">{stats.solvedChallenges}</div>
          <div className="text-sm text-gray-600 mt-1">Solved</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-yellow-600">#{stats.userRank || '-'}</div>
          <div className="text-sm text-gray-600 mt-1">Your Rank</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-purple-600">{stats.totalPoints}</div>
          <div className="text-sm text-gray-600 mt-1">Total Points</div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6">
              <div className={`${module.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                {module.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {module.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {module.description}
              </p>
              <div className="mt-4 text-indigo-600 font-medium flex items-center">
                Launch <span className="ml-2">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to start?</h2>
        <p className="mb-4 text-indigo-100">Choose a module above to begin your learning journey</p>
        <div className="flex gap-3">
          <Link
            href="/dashboard/virtual-lab/ctf"
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Start CTF Challenge
          </Link>
          <Link
            href="/dashboard/virtual-lab/terminal"
            className="px-4 py-2 bg-indigo-400 text-white rounded-lg font-semibold hover:bg-indigo-300 transition-colors"
          >
            Open Terminal
          </Link>
        </div>
      </div>
    </div>
  )
}
