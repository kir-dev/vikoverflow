import ErrorPage from "components/error-page";

function Custom404Page() {
  return <ErrorPage statusCode="404" text="A kért oldal nem található" />;
}

export default Custom404Page;
