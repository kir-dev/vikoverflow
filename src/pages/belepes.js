import Layout from "components/layout";
import styles from "styles/pages/login.module.css";
import Button from "components/button";
import { useUser } from "lib/authenticate";

const LoginPage = () => {
  const _ = useUser("/", true);

  return (
    <Layout footerDark>
      <div className={styles.root}>
        <Button
          onClick={() => {
            window.location = "/api/auth/login";
          }}
        >
          Belépés AuthSCH fiókkal
        </Button>
        <p>Magában foglalja az eduID és a címtáras belépés lehetőségét is.</p>
      </div>
    </Layout>
  );
};

export default LoginPage;
