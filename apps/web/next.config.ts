import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.OPENSHOCK_NEXT_DIST_DIR?.trim() || ".next",
  typescript: {
    tsconfigPath: process.env.OPENSHOCK_NEXT_TSCONFIG_PATH?.trim() || "tsconfig.json",
  },
};

export default nextConfig;
