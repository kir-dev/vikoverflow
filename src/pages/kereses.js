import Layout from "components/layout";
import SearchList from "components/search-list";
import { useSearch } from "lib/search-context";
import Input from "components/input";
import styles from "styles/pages/kereses.module.css";
import { Search } from "components/icons";

export default function SearchPage() {
  const { search, setSearch } = useSearch();
  return (
    <Layout footerDark>
      <div className={styles.root}>
        <div className={styles.inputContainer}>
          <Input
            prefix={<Search />}
            placeholder="Keresés"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <SearchList />
      </div>
    </Layout>
  );
}
