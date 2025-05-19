/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // 実験的な機能を無効化
    serverActions: true,
  },
  // 出力ディレクトリを明示的に指定
  distDir: '.next',
}

export default nextConfig
