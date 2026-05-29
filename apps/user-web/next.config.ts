import type { NextConfig } from "next";
import type { RuleSetRule } from "webpack";

const nextConfig: NextConfig = {
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
        hostname: "coin-images.coingecko.com",
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

export default nextConfig;
