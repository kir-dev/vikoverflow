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
            value: "max-age=31536000, public",
          },
        ],
      },
    ];
  },
};
