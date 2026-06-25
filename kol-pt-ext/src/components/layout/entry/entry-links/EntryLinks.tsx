import type { IEntryPageLinksSectionProps } from "../../../../core/types/props/entry-links.props.type";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useMemo } from "react";
import styles from "./EntryLinks.module.scss";



/**
 * @description
 * Renders links associated with an entry
 *
 * @param props - The component's properties
 * @returns The rendered entry links section
 */
function EntryLinks(props: IEntryPageLinksSectionProps): JSX.Element {
  const { entry, isDialog } = props;
  const links = useMemo(() => entry.getOptions().filter(option => option.canShow()), [entry.id]);

  const dialogClass = isDialog ? styles["entry-links--dialog"] : "";
  const classes = `${styles["entry-links"]} ${dialogClass}`;

  return (
    <div className={classes}>
      <div className={styles.links}>
        {links.map((link, i) => (
          <div
            key={i}
            className={styles.link}
            onClick={() => link.action()}
          >
            <span className={styles.link__icon}>
              <img src={link.icon} alt="Link icon" />
            </span>

            <span className={styles.link__label}>{link.label}</span>

            <OpenInNewIcon className={styles.link__nav} />
          </div>
        ),
        )}
      </div>
    </div>
  );
}

export default EntryLinks;
