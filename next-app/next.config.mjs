/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Allows builds to succeed even with TypeScript errors.
        ignoreBuildErrors: true,
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Tell webpack to treat all .node files as external.
            config.externals = config.externals || [];
            config.externals.push(/\.node$/);
        }
        return config;
    },

};

export default nextConfig;

