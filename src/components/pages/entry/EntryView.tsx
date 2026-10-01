import type { IEntryViewProps } from "../../../core/types/props/entry-page-props.type";

import { IconHelper } from "../../../core/helpers/asset/icon.helper";
import { useCoverImage } from "../../../hooks/cover-image.hook";
import { useEntry } from "../../../hooks/entry.hook";
import EntryAka from "../../layout/entry/entry-aka/EntryAka";
import EntryHead from "../../layout/entry/entry-head/EntryHead";
import EntryLinks from "../../layout/entry/entry-links/EntryLinks";
import EntryReactions from "../../layout/entry/entry-reactions/EntryReactions";
import Error from "../../layout/generic/error/Error";
import Loader from "../../layout/generic/loader/Loader";

import styles from "./EntryPage.module.scss";



/**
 * @description
 * The entry detail, shown as a popup page and as a dialog on Patreon.
 * It does not depend on a router.
 *
 * @param props - The entry to show, and how it is shown
 * @returns The rendered entry detail
 */
function EntryView(props: IEntryViewProps): JSX.Element {
  const { entryId, isDialog = false, onBack } = props;
  const { loading, entry, description, photo, subscribers, altTitles, genres, reactions } = useEntry(entryId);
  const coverDataUrl = useCoverImage(photo);
  const displayPhoto = coverDataUrl ?? photo;

  const dialogClass = isDialog ? styles["root--dialog"] : "";
  const classes = `${styles.root} ${dialogClass}`;

  if (!entry) {
    return loading
      ? <Loader height="250px" flat={true} />
      : <Error error={true} message="Could not retrieve entry" />;
  }

  return (
    <div
      className={classes}
      style={{ backgroundImage: `url(${displayPhoto}), url(${IconHelper.getIcon("placeholder", "graphs")}` }}
    >
      <EntryHead
        entry={entry}
        genres={genres}
        onBack={onBack}
        loading={loading}
        subscribers={subscribers}
        description={description}
      />

      <EntryAka
        altTitles={altTitles}
      />

      <EntryLinks
        entry={entry}
        isDialog={isDialog}
      />

      <EntryReactions
        reactions={reactions}
        entry={entry}
      />
    </div>
  );
}

export default EntryView;
