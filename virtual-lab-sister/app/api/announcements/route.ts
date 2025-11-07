'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ReactMarkdown from 'react-markdown'

export default function AnnouncementsPage() {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', content: '', tag: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setList(data || [])
    } catch (err: any) {
      console.error('Error loading announcements:', err)
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.title.trim() || !form.content.trim()) {
      alert('Title and content are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: form.title.trim(),
          content: form.content.trim(),
          tag: form.tag.trim() || null,
          created_by: user.id,
        })
        .select()

      if (error) throw error

      console.log('Announcement created:', data)
      setForm({ title: '', content: '', tag: '' })
      await load()
    } catch (err: any) {
      console.error('Error creating announcement:', err)
      setError(err.message)
      alert('Failed to create announcement: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Announcements</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-2 bg-white p-4 rounded shadow">
        <input
          className="border p-2 w-full rounded"
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          disabled={loading}
          required
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="Tag (optional)"
          value={form.tag}
          onChange={e => setForm({ ...form, tag: e.target.value })}
          disabled={loading}
        />
        <textarea
          className="border p-2 w-full rounded h-28"
          placeholder="Markdown content"
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          disabled={loading}
          required
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>

      {list.map(a => (
        <div key={a.id} className="bg-white shadow p-4 rounded">
          <h3 className="font-semibold text-lg">{a.title}</h3>
          {a.tag && (
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded inline-block mt-1">
              {a.tag}
            </span>
          )}
          <div className="prose mt-2 max-w-none">
            <ReactMarkdown>{a.content}</ReactMarkdown>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(a.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}