import { supabase } from '@/lib/supabaseClient'

export async function generateStaticParams() {
  // Fetch all slugs from your Supabase table
  const { data } = await supabase.from('wiki_pages').select('slug')
  return (data || []).map((page) => ({ slug: page.slug }))
}

export default async function WikiSlugPage({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from('wiki_pages')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">404 - Page Not Found</h1>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <div className="mt-4 whitespace-pre-wrap">{data.content}</div>
    </div>
  )
}
