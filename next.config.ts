import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploaded flyers are streamed from outside /public, so they are never bundled.
  images: {
    // Flyers are served by our own route handler; allow any local size.
    unoptimized: true,
  },
  experimental: {
    // Keep large multipart flyer uploads out of the default 1MB server action limit.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
