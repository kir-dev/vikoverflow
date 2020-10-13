import Header from "components/header";
import Footer from "components/footer";
import Head from "next/head";

const SEO = ({ title, description, image }) => (
  <Head>
    {/* Preload */}
    <link
      rel="preload"
      href="/static/inter-20200829.woff2"
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
    <meta property="og:url" content="https://vikoverflow.now.sh" />

    {/* General */}
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="twitter:card" content="summary_large_image" />

    {/* Favicon */}
    <link rel="icon" href="/static/favicon-20200519.ico" />
  </Head>
);

const Layout = ({
  children,
  header = true,
  title = "vikoverflow",
  description = "description",
  image = "",
}) => (
  <>
    <SEO title={title} description={description} image={image} />
    {header && <Header />}
    {children}
  </>
);

export default Layout;
