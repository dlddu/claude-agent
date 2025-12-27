/**
 * Next.js Configuration
 * @spec FEAT-001
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@claude-agent/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
