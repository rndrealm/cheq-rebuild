import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["cheq.localhost"],
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    // Pin the root so a stray lockfile higher up doesn't become the workspace root.
    root: projectRoot,
    rules: {
      "*.glsl": { loaders: ["raw-loader"], as: "*.js" },
      "*.vert": { loaders: ["raw-loader"], as: "*.js" },
      "*.frag": { loaders: ["raw-loader"], as: "*.js" },
      "*.vs": { loaders: ["raw-loader"], as: "*.js" },
      "*.fs": { loaders: ["raw-loader"], as: "*.js" },
    },
  },
  // Fallback for builds that run with --webpack.
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });
    return config;
  },
  // Sign-in and sign-up are one flow at /auth now; old links still land there
  async redirects() {
    return [
      { source: "/sign-in", destination: "/auth", permanent: false },
      { source: "/sign-up", destination: "/auth", permanent: false },
    ];
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default nextConfig;
