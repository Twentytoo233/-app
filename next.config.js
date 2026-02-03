/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 确保 API 路由可以处理较大的请求体
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  // 如果需要使用外部图片，可以在这里配置
  images: {
    domains: [],
  },
}

module.exports = nextConfig
