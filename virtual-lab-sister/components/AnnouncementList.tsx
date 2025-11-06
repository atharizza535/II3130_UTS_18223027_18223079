'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
      setAnnouncements(data || [])
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      {announcements.map((a) => (
        <div key={a.id} className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">{a.title}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-line">{a.content}</p>
          <p className="text-xs text-gray-500">
            {new Date(a.created_at).toLocaleString()}
          </p>
        </div>
      ))}
      {announcements.length === 0 && <p>No announcements yet.</p>}
    </div>
  )
}
