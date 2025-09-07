/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'lazlle.studio', '*.lazlle.studio'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: '*.lazlle.studio',
            },
            {
                protocol: 'https',
                hostname: 'lazlle.studio',
            },
        ],
    },
    // Remove rewrites - let middleware handle subdomain routing
}

module.exports = nextConfig