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
            value: "public, max-age=31536000, s-maxage=31536000",
          },
        ],
      },
    ];
  },
};
