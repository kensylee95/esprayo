import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import type { RuleSetRule } from "webpack";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});
const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "thread-stream/test": false,
    };

    const fileLoaderRule = config.module.rules.find(
      (rule: RuleSetRule) =>
        rule.test && rule.test instanceof RegExp && rule.test.test(".svg"),
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ["@svgr/webpack"],
      },
      {
        test: /\.(wav|mp3|ogg)$/,
        type: "asset/resource",
      },
    );

    return config;
  },
};

export default withSerwist(nextConfig);
