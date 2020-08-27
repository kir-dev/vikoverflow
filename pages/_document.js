import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="hu">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
        {/* fix chrome fireing css transitions on initial load  */}
        <script dangerouslySetInnerHTML={{ __html: ` ` }} />
      </Html>
    );
  }
}

export default MyDocument;
