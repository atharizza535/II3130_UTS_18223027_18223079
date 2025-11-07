'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ErrorDisplay from '@/components/ErrorDisplay'
import DebugPanel from '@/components/DebugPanel'
import NewEventModal from '@/components/NewEventModel'
import EventSidebar from '@/components/EventSidebar'
import CalendarView from '@/components/CalenderView'

interface ErrorState {
  status?: number
  message: string
  details?: any
}

const courses = [
  "Jaringan Komputer",
  "Sistem Operasi",
  "Sistem dan Arsitektur Komputer",
  "Organisasi dan Arsitektur komputer",
  "Teknologi Platform",
  "Sistem Paralel dan Terdistribusi",
  "Lainnya"
]

export default function SchedulePage() {
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [selectedCourse, setSelectedCourse] = useState('Semua Mata Kuliah')
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)) 

  async function fetchEvents() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) throw error
      setAllEvents(data || [])
    } catch (err: any) {
      console.error('Error fetching events:', err)
      setError({ message: err.message, details: err })
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchEvents()
  }, [])

  const handleCreateEvent = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw { status: 401, message: 'Unauthorized' }

      const newEvent = {
        title: formData.get('title') as string,
        category: formData.get('category') as string,
        course: formData.get('course') as string,
        start_time: new Date(formData.get('start_time') as string).toISOString(),
        assignee: (formData.get('assignee') as string) || null,
        created_by: user.id,
      }

      const { error: insertError } = await supabase
        .from('calendar_events')
        .insert(newEvent)

      if (insertError) throw insertError
      setIsModalOpen(false)
      await fetchEvents() 
    } catch (err: any) {
      console.error(' Error creating event:', err)
      setError({
        status: err.status || 500,
        message: err.message || 'Event gagal dibuat',
        details: err.details || err
      })
    } finally {
      setLoading(false)
    }
  }
  
  const filteredEvents = useMemo(() => {
    if (selectedCourse === 'Semua Mata Kuliah') {
      return allEvents
    }
    return allEvents.filter(event => event.course === selectedCourse)
  }, [allEvents, selectedCourse])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return filteredEvents
      .filter(event => new Date(event.start_time) >= now)
      .slice(0, 5) 
  }, [filteredEvents])
  
  const calendarEvents = useMemo(() => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear()
    })
  }, [filteredEvents, currentDate])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penjadwalan</h1>
          <p className="text-gray-600">Kalender timeline untuk setiap mata kuliah</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          + Tambah Event
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCourse('Semua Mata Kuliah')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedCourse === 'Semua Mata Kuliah'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Semua Mata Kuliah
        </button>
        {courses.map(course => (
          <button
            key={course}
            onClick={() => setSelectedCourse(course)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCourse === course
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {course}
          </button>
        ))}
      </div>

      {isModalOpen && (
        <NewEventModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateEvent}
        />
      )}

      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
      <DebugPanel data={debugInfo} label="Debug Information" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarView
            month={currentDate.getMonth()}
            year={currentDate.getFullYear()}
            events={calendarEvents}
          />
        </div>
        
        <div className="lg:col-span-1">
          <EventSidebar events={upcomingEvents} />
        </div>
      </div>
    </div>
  )
}