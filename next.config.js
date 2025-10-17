// /** @type {import('next').NextConfig} */

const pJson = require('./package.json');

const nextConfig = {
    reactStrictMode: false,
    trailingSlash: false,
    basePath: '',
    images: {
        domains: ['192.168.31.161'], // 👈 this is the key line
    },
    basePath: process.env.NODE_ENV === 'production' ? '' : '',
    publicRuntimeConfig: {
        contextPath: process.env.NODE_ENV === 'production' ? '' : '',
        uploadPath: process.env.NODE_ENV === 'production' ? '/upload.php' : '/api/upload',
        version: pJson.version
    },
    rewrites: async () => {
        return [{ source: '/api/send', destination: 'http://localhost:8000' }];
    }
};

module.exports = nextConfig;
