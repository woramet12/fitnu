/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // ถ้าต้องการให้ build ผ่านแม้มี ESLint error อื่น (ไม่แนะนำถ้าแก้ได้)
  // eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
