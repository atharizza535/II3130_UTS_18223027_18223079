import Link from 'next/link'
import Image from 'next/image' // 1. Impor komponen Image

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
      {/* 2. Tambahkan komponen Image di sini */}
      <Image
        src="/applogo.png" // Pastikan applogo.png ada di folder /public
        alt="App Logo"
        width={300} // Sesuaikan lebar (width) logo Anda
        height={80}  // Sesuaikan tinggi (height) logo Anda
        priority     // Membantu memuat logo lebih cepat
      />

      <h1 className="text-4xl font-bold">Virtual Lab Sistem Terdistribusi</h1>
      <p className="text-gray-600">A unified assistant platform for tasks and challenges.</p>
      <div className="space-x-4">
        <Link href="/auth/login" className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Login</Link>
      </div>
    </main>
  )
}