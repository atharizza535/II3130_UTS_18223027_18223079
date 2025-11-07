'use client'
import ReactMarkdown from 'react-markdown'


const courseStyles: { [key: string]: string } = {
  "Jaringan Komputer": 'bg-blue-100 text-blue-700',
  "Sistem Operasi": 'bg-green-100 text-green-700',
  "Sistem Paralel dan Terdistribusi": 'bg-purple-100 text-purple-700',
  "Teknologi Platform": 'bg-yellow-100 text-yellow-700',
}


function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " tahun yang lalu"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " bulan yang lalu"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " hari yang lalu"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " jam yang lalu"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " menit yang lalu"
  return Math.floor(seconds) + " detik yang lalu"
}

export default function AnnouncementCard({ post }: { post: any }) {
  
  const courseTag = post.tag || null 
  const author = post.users?.full_name || 'Admin'
  const timestamp = timeAgo(post.created_at)

  return (
    <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
      
      {courseTag && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            courseStyles[courseTag] || 'bg-gray-100 text-gray-700'
          }`}>
            {courseTag}
          </span>
        </div>
      )}
      
      <div className="text-sm text-gray-700 prose max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t">
        <span>Oleh: {author}</span>
        <span>{timestamp}</span>
      </div>
    </div>
  )
}