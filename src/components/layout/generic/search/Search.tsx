import type { ISearchProps } from "../../../../core/types/props/search-props.type";

import { InputBase } from "@mui/material";
import styles from "./Search.module.scss";



/**
 * @description
 * Light component that handles searching
 *
 * @param props - The search component props
 * @returns The rendered search input
 */
function Search(props: ISearchProps): JSX.Element {
  const { placeholder, actions, onSearch } = props;

  return (
    <>
      <h3 className={styles.search}>
        <span className={styles["search__input-wrapper"]}>
          <InputBase
            size="small"
            type="search"
            onChange={onSearch}
            className={styles.search__input}
            placeholder={placeholder ?? "Search..."}
          />
        </span>

        <div className={styles.search__actions}>
          {actions}
        </div>
      </h3>
    </>
  );
}

export default Search;
