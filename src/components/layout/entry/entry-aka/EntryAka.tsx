import type { IEntryPageAkaSectionProps } from "../../../../core/types/props/entry-aka.props.type";

import { Badge } from "../../../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";



/**
 * @description
 * Renders the aka section of the entry detail.
 *
 * @param props - The component's properties
 * @returns The rendered alias list section
 */
function EntryAka(props: IEntryPageAkaSectionProps): JSX.Element {
  const { altTitles } = props;

  return (
    <>
      {altTitles.length > 0
        && (
          <section className="flex flex-col gap-2 px-4">
            <h3 className="text-sm font-semibold">Aliases</h3>

            <ul className="flex flex-wrap gap-1.5">
              {altTitles.map((alt, i) => (
                <li key={i} className="max-w-full">
                  <Tooltip>
                    <TooltipTrigger
                      render={<Badge variant="outline" tabIndex={0} className="h-auto max-w-full items-center gap-1.5 py-1.5 font-normal" />}
                    >
                      {/*
                        * Both texts trimmed to their capital height, so the tag
                        * sits in the exact middle of the title, whatever the font.
                        * The title clips sideways only, keeping its descenders.
                        */}
                      <span className="min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap [text-box:trim-both_cap_alphabetic]">{alt.title}</span>
                      <span className="shrink-0 text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase [text-box:trim-both_cap_alphabetic]">
                        {alt.official ? "official" : "kol"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{alt.official ? "Official title that the Anime is referred to by." : "Unofficial title, used by KOL."}</TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </section>
        )}
    </>
  );
}

export default EntryAka;
