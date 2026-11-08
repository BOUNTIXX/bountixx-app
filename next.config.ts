import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  // Community Rush shares manifest contracts with sibling workspace packages.
  // Transpiling the local package keeps Turbopack resolution reliable on
  // Windows junctions as well as package-manager workspaces.
  transpilePackages: ["@bountixx/rush-sdk"],
  // The SDK is a linked sibling package. Turbopack requires the common parent
  // as its filesystem root before it can resolve linked dependencies outside
  // this application directory.
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },
};

export default nextConfig;
