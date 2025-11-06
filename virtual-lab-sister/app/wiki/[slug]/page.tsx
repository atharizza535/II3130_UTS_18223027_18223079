'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export default function WikiSlugPage() {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('slug', slug)
        .single()
      setPage(data)
    }
    load()
  }, [slug])

  if (!page) return <p className="p-6">Loading...</p>

  return (
    <div className="p-6 prose max-w-none">
      <h1>{page.title}</h1>
      <ReactMarkdown>{page.content}</ReactMarkdown>
    </div>
  )
}
