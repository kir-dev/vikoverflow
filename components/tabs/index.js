import cn from "classnames";
import styles from "./tabs.module.css";

export default function Tabs({ tabs, selected, setSelected }) {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <div
          key={tab.value}
          className={styles.tabContainer}
          onClick={() => {
            setSelected?.(tab.value);
          }}
        >
          <div
            className={cn(styles.tab, {
              [styles.activeTab]: selected === tab.value,
            })}
          >
            <div>{tab.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
