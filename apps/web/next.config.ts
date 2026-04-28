import type { NextConfig } from "next";

const allowedDevOrigins = [
  "127.0.0.1",
  ...(process.env.OPENSHOCK_ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  distDir: process.env.OPENSHOCK_NEXT_DIST_DIR?.trim() || ".next",
  typescript: {
    tsconfigPath: process.env.OPENSHOCK_NEXT_TSCONFIG_PATH?.trim() || "tsconfig.json",
  },
};

export default nextConfig;
