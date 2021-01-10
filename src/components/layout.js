import Header from "components/header";
import Head from "next/head";
import SearchList from "components/search-list";
import { useSearch } from "lib/search-context";
import { useRouter } from "next/router";
import Footer from "components/footer";

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
      <meta
        name="viewport"
        content="width=device-width,height=device-height,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"
      />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Favicon */}
      <link rel="icon" href={favicon} />
    </Head>
  );
}

export default function Layout({
  children,
  footerDark,
  title = "vikoverflow",
  description = "description",
  image = "https://vikoverflow.vassbence.com/static/og-image-20201029.png",
  favicon = "/static/favicon-20201126.ico",
  url = "https://vikoverflow.sch.bme.hu",
}) {
  const { search } = useSearch();
  const { pathname } = useRouter();

  return (
    <>
      <SEO
        title={title}
        description={description}
        image={image}
        favicon={favicon}
        url={url}
      />
      <Header />
      {search && pathname !== "/kereses" ? <SearchList /> : children}
      <Footer dark={footerDark} />
    </>
  );
}
