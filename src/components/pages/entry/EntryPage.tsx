import { useNavigate, useParams } from "react-router";
import { EPage } from "../../../core/enums/page.enum";
import EntryView from "./EntryView";



/**
 * @description
 * The entry detail page of the popup.
 *
 * @returns The rendered entry detail page
 */
function EntryPage(): JSX.Element {
  const { entryId } = useParams();
  const navigate = useNavigate();

  return (
    <EntryView
      entryId={entryId ?? ""}
      onBack={() => navigate(`${EPage.INDEX}${EPage.ENTRIES}`)}
    />
  );
}

export default EntryPage;
