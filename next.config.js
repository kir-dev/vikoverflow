module.exports = {
  devIndicators: {
    autoPrerender: false,
  },
  async headers() {
    return [
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, no-transform, immutable, max-age=31536000",
          },
        ],
      },
    ];
  },
};
