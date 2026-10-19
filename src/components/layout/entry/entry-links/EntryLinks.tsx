import type { IEntryPageLinksSectionProps } from "../../../../core/types/props/entry-links.props.type";

import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { cn } from "../../../../core/utils/cn";
import { Button } from "../../../ui/button";



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

  return (
    <>
      {links.length > 0 && (
        <section className={cn("grid gap-1.5 px-4", isDialog && "grid-cols-2")}>
          {links.map((link, i) => (
            <Button
              key={i}
              variant="outline"
              onClick={() => link.action()}
              className="group/link h-9 min-w-0 justify-start gap-2.5 px-2.5"
            >
              <img src={link.icon} alt="" className="size-5 shrink-0 rounded-sm object-contain" />
              <span className="truncate">{link.label}</span>
              <ExternalLink className="ml-auto text-muted-foreground opacity-60 transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100" />
            </Button>
          ))}
        </section>
      )}
    </>
  );
}

export default EntryLinks;
