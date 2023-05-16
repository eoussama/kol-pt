import styles from './EntryHead.module.scss';

import { useNavigate } from 'react-router-dom';
import { Page } from '../../../core/enums/page.enum';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IEntryPageSectionProps } from '../../../core/types/props/entry-section.props';



/**
 * @description
 * The entry head component.
 */
function EntryHead(props: IEntryPageSectionProps): JSX.Element {
  const { entry } = props;
  const navigate = useNavigate();

  /**
   * @description
   * Navigates back to the entries list.
   */
  const onBack = () => {
    navigate(`${Page.Index}${Page.Entries}`);
  }

  return (
    <div className={styles['entry-head']}>
      <div className={styles['head__back']} onClick={onBack}>
        <ArrowBackIcon />
      </div>

      <div className={styles['head__hero']}>
        <div
          className={styles['head__photo']}
          style={{ backgroundImage: 'url(https://cdn.myanimelist.net/images/anime/6/73245.jpg)' }}
        >
        </div>
      </div>

      <div className={styles['head__content']}>
        <h5 className={styles['head__type']}>{entry.getTypeName()}</h5>
        <h3 className={styles['head__title']}>{entry.title}</h3>
        <p className={styles['head__description']}>lorem</p>
        <div className={styles['head__genres']}></div>
      </div>
    </div>
  );
}

export default EntryHead;