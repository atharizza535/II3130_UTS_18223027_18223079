/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // needed for Netlify static hosting
  experimental: {
    serverActions: undefined, // remove or comment out
  },
}

export default nextConfig
