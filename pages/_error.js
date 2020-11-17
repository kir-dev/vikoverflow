import ErrorPage from "components/error-page";

function Error({ statusCode }) {
  return <ErrorPage statusCode={statusCode + 1} />;
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
