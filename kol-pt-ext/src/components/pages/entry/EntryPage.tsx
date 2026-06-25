import type { Entry } from "../../../core/models/entry.model";

import type { IEntryPageProps } from "../../../core/types/props/entry-page-props.type";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { IconHelper } from "../../../core/helpers/asset/icon.helper";
import { useEntry } from "../../../hooks/entry.hook";
import EntryAka from "../../layout/entry/entry-aka/EntryAka";
import EntryHead from "../../layout/entry/entry-head/EntryHead";
import EntryLinks from "../../layout/entry/entry-links/EntryLinks";
import EntryReactions from "../../layout/entry/entry-reactions/EntryReactions";
import Error from "../../layout/generic/error/Error";
import styles from "./EntryPage.module.scss";



/**
 * @description
 * The entry detail page
 *
 * @param props - Optional entry page props
 * @returns The rendered entry detail page
 */
function EntryPage(props?: IEntryPageProps): JSX.Element {
  const params = useParams();
  const entryId = useMemo(() => params.entryId ?? props?.entryId, [params, props?.entryId]);
  const { loading, entry, description, photo, subscribers, altTitles, genres, reactions } = useEntry(entryId ?? "");

  const dialogClass = props?.entryId ? styles["root--dialog"] : "";
  const classes = `${styles.root} ${dialogClass}`;

  return (
    <Error error={!entry} message="Could not retrieve entry">
      <div
        className={classes}
        style={{ backgroundImage: `url(${photo}), url(${IconHelper.getIcon("placeholder", "graphs")}` }}
      >
        <EntryHead
          photo={photo}
          genres={genres}
          loading={loading}
          entry={entry as Entry}
          viewCount={subscribers}
          description={description}
          isDialog={Boolean(props?.entryId)}
        />

        <EntryAka
          altTitles={altTitles}
        />

        <EntryLinks
          entry={entry as Entry}
          isDialog={Boolean(props?.entryId)}
        />

        <EntryReactions
          reactions={reactions}
          entry={entry as Entry}
        />
      </div>
    </Error>
  );
}

export default EntryPage;
