import styles from './EntryLinks.module.scss';

import { useMemo } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { IEntryPageLinksSectionProps } from '../../../../core/types/props/entry-links.props.type';



/**
 * @description
 * Renders links associated with an entry
 *
 * @param props The component's properties
 */
function EntryLinks(props: IEntryPageLinksSectionProps): JSX.Element {
  const { entry } = props;
  const links = useMemo(() => entry.getOptions().filter(option => option.canShow()), [entry.id]);

  return (
    <div className={styles['entry-links']}>
      <div className={styles['links']}>
        {links.map((link, i) =>
          <div
            key={i}
            className={styles['link']}
            onClick={() => link.action()}
          >
            <span className={styles['link__icon']}>
              <img src={link.icon} alt='Link icon' />
            </span>

            <span className={styles['link__label']}>{link.label}</span>

            <OpenInNewIcon className={styles['link__nav']}/>
          </div>
        )}
      </div>
    </div>
  );
}

export default EntryLinks;