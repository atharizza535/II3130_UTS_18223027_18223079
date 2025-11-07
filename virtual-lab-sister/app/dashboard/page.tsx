'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import useAuth from '@/lib/useAuth' 

interface DashboardStats {
  activeTasks: number
  deadlinesThisWeek: number
  newAnnouncements: number
  tasksCompletedPercent: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    activeTasks: 0,
    deadlinesThisWeek: 0,
    newAnnouncements: 0,
    tasksCompletedPercent: 0,
  })
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([])
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [ctfData, setCtfData] = useState<any[]>([])

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
      return
    }
    
    if (user) {
      loadDashboardData()
    }
  }, [user, router])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const now = new Date()
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

      const { data: tasksData, count: tasksCount, error: tasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        
      if (tasksError) throw tasksError

      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        
      if (announcementsError) throw announcementsError
      
      const { count: deadlinesCount, error: deadlinesError } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', now.toISOString())
        .lte('start_time', oneWeekFromNow.toISOString())

      if (deadlinesError) throw deadlinesError

      const { data: leaderboard, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('score, users(full_name)') 
        .order('score', { ascending: false })
        .limit(3)
        
      if (leaderboardError) throw leaderboardError
      setLeaderboardData(leaderboard || [])


      const { data: ctf, error: ctfError } = await supabase
        .from('ctf_challenges')
        .select('*')
        .order('points', { ascending: true }) 
        .limit(3)
        
      if (ctfError) throw ctfError
      setCtfData(ctf || [])

      const totalTasks = tasksCount || 0
      const doneTasks = tasksData?.filter(t => t.status === 'done').length || 0
      const activeTasks = totalTasks - doneTasks
      const tasksCompletedPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
      const newAnnouncements = announcementsData?.filter(a => new Date(a.created_at) > threeDaysAgo).length || 0

      setStats({
        activeTasks: activeTasks,
        deadlinesThisWeek: deadlinesCount || 0,
        newAnnouncements: newAnnouncements,
        tasksCompletedPercent: tasksCompletedPercent,
      })

      setUpcomingTasks(tasksData?.filter(t => t.status === 'todo').slice(0, 3) || [])
      setRecentAnnouncements(announcementsData?.slice(0, 3) || [])

    } catch (error: any) {
      console.error('Gagal memuat data dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Selamat datang di Virtual Lab Sistem Terdistribusi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tugas Aktif"
          value={stats.activeTasks.toString()}
          icon="M" 
          color="blue"
        />
        <StatCard
          title="Event Mendatang"
          value={stats.deadlinesThisWeek.toString()}
          icon="O" 
          color="yellow"
        />
        <StatCard
          title="Pengumuman Baru"
          value={stats.newAnnouncements.toString()}
          icon="🔔" 
          color="purple"
        />
        <StatCard
          title="Tugas Selesai"
          value={`${stats.tasksCompletedPercent}%`}
          icon="✓" 
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Tugas Mendatang</h2>
            <Link href="/dashboard/tasks" className="text-sm font-medium text-indigo-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => <TaskItem key={task.id} task={task} />)
            ) : (
              <p className="text-sm text-gray-500">Tidak ada tugas mendatang.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Pengumuman Terbaru</h2>
            <Link href="/dashboard/announcements" className="text-sm font-medium text-indigo-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-4">
            {recentAnnouncements.length > 0 ? (
              recentAnnouncements.map(post => <AnnouncementItem key={post.id} post={post} />)
            ) : (
              <p className="text-sm text-gray-500">Tidak ada pengumuman baru.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Virtual Lab</h2>
            <Link href="/dashboard/virtual-lab" className="text-sm font-medium text-indigo-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-4">
            {ctfData.length > 0 ? (
              ctfData.map(ctf => <VirtualLabItem key={ctf.id} ctf={ctf} />)
            ) : (
              <p className="text-sm text-gray-500">Tidak ada tantangan CTF.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Leaderboard</h2>
            <Link href="/dashboard/leaderboard" className="text-sm font-medium text-indigo-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-4">
            {leaderboardData.length > 0 ? (
              leaderboardData.map((entry, index) => <LeaderboardItem key={entry.users?.full_name || index} entry={entry} rank={index + 1} />)
            ) : (
              <p className="text-sm text-gray-500">Leaderboard masih kosong.</p>
            )}
          </div>
        </div>
      </div>  
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) {
  const colors: { [key: string]: string } = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
  }
  return (
    <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-600">{title}</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors[color] || colors.blue}`}>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

function TaskItem({ task }: { task: any }) {
  const statusColors: { [key: string]: string } = {
    todo: 'bg-gray-200 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
  }
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-yellow-100 flex-shrink-0 flex items-center justify-center">
        <span className="text-yellow-600">!</span>
      </div>
      <div>
        <h4 className="font-medium text-sm">{task.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-indigo-700">{task.course || 'Task'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status] || statusColors.todo}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
        {new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
      </span>
    </div>
  )
}

function AnnouncementItem({ post }: { post: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center">
        <span className="text-purple-600">🔔</span>
      </div>
      <div>
        <h4 className="font-medium text-sm">{post.title}</h4>
        <span className="text-xs text-indigo-700">{post.tag || 'General'}</span>
      </div>
      <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
        {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
      </span>
    </div>
  )
}

function VirtualLabItem({ ctf }: { ctf: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
        <span className="text-green-600">🎯</span>
      </div>
      <div>
        <h4 className="font-medium text-sm">{ctf.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-600">{ctf.category}</span>
          <span className="text-xs text-green-700 font-medium">{ctf.points} Pts</span>
        </div>
      </div>
    </div>
  )
}

function LeaderboardItem({ entry, rank }: { entry: any, rank: number }) {
  const rankColors: { [key: number]: string } = {
    1: 'text-yellow-500',
    2: 'text-gray-400',
    3: 'text-yellow-700',
  }
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold ${rankColors[rank] || 'text-gray-600'}`}>
        #{rank}
      </div>
      <div>
        <h4 className="font-medium text-sm">{entry.users?.full_name || 'Unknown User'}</h4>
        <span className="text-xs text-gray-500">{entry.score} Poin</span>
      </div>
    </div>
  )
}