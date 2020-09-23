import Link from "next/link";
import styles from "./footer.module.css";
import cn from "clsx";

const Footer = ({ dark }) => (
  <>
    <footer className={cn(styles.root, { [styles.dark]: dark })}>
      <div className={styles.inner}>
        <span>
          <b>vikoverflow</b>
          {` © ${new Date().getFullYear()}`}
        </span>
        <Link href="/">
          <a>Főoldal</a>
        </Link>
      </div>
    </footer>
  </>
);

export default Footer;
