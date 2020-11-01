import Header from "components/header";
import Head from "next/head";

function SEO({ title, description, image, favicon, url }) {
  return (
    <Head>
      {/* Preload */}
      <link
        rel="preload"
        href="/static/inter-20201030.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      {/* Title */}
      <title>{title}</title>
      <meta name="og:title" content={title} />

      {/* Description */}
      <meta name="description" content={description} />
      <meta property="og:description" content={description} />

      {/* Image */}
      <meta name="twitter:image" content={image} />
      <meta property="og:image" content={image} />

      {/* URL */}
      <meta property="og:url" content={url} />

      {/* General */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Favicon */}
      <link rel="icon" href={favicon} />
    </Head>
  );
}

const Layout = ({
  children,
  header = true,
  title = "vikoverflow",
  description = "description",
  image = "https://vikoverflow.vassbence.com/static/og-image-20201029.png",
  favicon = "/static/favicon-20200519.ico",
  url = "https://vikoverflow.sch.bme.hu",
}) => (
  <>
    <SEO
      title={title}
      description={description}
      image={image}
      favicon={favicon}
      url={url}
    />
    {header && <Header />}
    {children}
  </>
);

export default Layout;
