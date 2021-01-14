module.exports = {
  headers() {
    return [
      {
        source: "/static/:file",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    domains: ["staging-vikoverflow-user-uploads.s3-eu-central-1.amazonaws.com"],
  },
};
