import type { IEntryPageHeadSectionProps } from "../../../../core/types/props/entry-head.props.type";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Chip } from "@mui/material";
import millify from "millify";
import { useNavigate } from "react-router-dom";
import { EEntryType } from "../../../../core/enums/entry-type.enum";
import { EPage } from "../../../../core/enums/page.enum";
import Loader from "../../generic/loader/Loader";
import TextExpand from "../../generic/text-expand/TextExpand";
import styles from "./EntryHead.module.scss";



/**
 * @description
 * The entry head component.
 *
 * @param props - Component props
 * @returns The rendered entry head section
 */
function EntryHead(props: IEntryPageHeadSectionProps): JSX.Element {
  const { entry, loading, viewCount, description, genres, isDialog } = props;

  const navigate = isDialog ? () => { } : useNavigate();

  /**
   * @description
   * Navigates back to the entries list.
   */
  const onBack = () => {
    if (!isDialog) {
      navigate(`${EPage.INDEX}${EPage.ENTRIES}`);
    }
  };

  return (
    <div className={styles["entry-head"]}>
      {!isDialog
        && (
          <div className={styles.head__back} onClick={onBack}>
            <ArrowBackIcon />
          </div>
        )}

      <div className={styles.head__hero}>
        {loading ? <Loader height="250px" flat={true} overlay={true} /> : ""}
      </div>

      <div className={styles.head__content}>
        <h5 className={styles.head__type}>
          {entry.getTypeName()}
          {entry.type === EEntryType.YOUTUBE
            && (
              <>
                {" - "}
                {millify(viewCount)}
                {" "}
                subscribers
              </>
            )}
        </h5>

        <h3 className={styles.head__title}>{entry.title}</h3>
      </div>

      <div className={styles["head__description-wrapper"]}>
        <div className={styles.head__description}>
          {loading
            ? <Loader height="100px" />
            : <TextExpand content={description} />}
        </div>
      </div>

      {genres.length > 0
        && (
          <div className={styles.head__genres}>
            {genres.map((e, i) => (
              <Chip
                key={i}
                label={e}
                size="small"
                className={styles.head__genre}
              />
            ))}
          </div>
        )}
    </div>
  );
}

export default EntryHead;
