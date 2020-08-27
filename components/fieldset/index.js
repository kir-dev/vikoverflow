import styles from "./fieldset.module.css";

function Fieldset({ children }) {
  return <div className={styles.root}>{children}</div>;
}

function Content({ children }) {
  return <div className={styles.content}>{children}</div>;
}

function Title({ children }) {
  return <h4 className={styles.title}>{children}</h4>;
}

function Footer({ children }) {
  return <div className={styles.footer}>{children}</div>;
}

function FooterText({ children }) {
  return <div className={styles.footerText}>{children}</div>;
}

function Actions({ children }) {
  return <div className={styles.actions}>{children}</div>;
}

Fieldset.Content = Content;
Fieldset.Title = Title;
Fieldset.Footer = Footer;
Fieldset.FooterText = FooterText;
Fieldset.Actions = Actions;

export default Fieldset;
