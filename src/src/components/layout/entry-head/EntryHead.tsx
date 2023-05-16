import styles from './EntryHead.module.scss';

import { useNavigate } from 'react-router-dom';
import { Page } from '../../../core/enums/page.enum';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IEntryPageSectionProps } from '../../../core/types/props/entry-section.props';
import { useEffect, useState } from 'react';
import { EntryType } from '../../../core/enums/entry-type.enum';
import { Anime } from '../../../core/models/anime.model';
import { JikanHelper } from '../../../core/helpers/api/jikan.helper';



/**
 * @description
 * The entry head component.
 */
function EntryHead(props: IEntryPageSectionProps): JSX.Element {
  const { entry } = props;
  const navigate = useNavigate();
  const [more, setMore] = useState(false);
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [photo, setPhoto] = useState('./images/graphs/placeholder.jpg');

  /**
   * @description
   * Navigates back to the entries list.
   */
  const onBack = () => {
    navigate(`${Page.Index}${Page.Entries}`);
  }

  /**
   * @description
   * Toggles more/less description content
   */
  const onMoreToggle = () => {
    setMore(!more)
  }

  useEffect(() => {
    if (entry.id) {
      if (entry.type === EntryType.Anime) {
        JikanHelper
          .getAnimeInfo((entry as Anime).malId)
          .then(e => {
            setPhoto(e.photo);
            setFullDescription(e.description);
          });
      } else if (entry.type === EntryType.YouTube) {

      }
    }
  }, [entry.id]);

  useEffect(() => {
    const newDescription = (more && fullDescription.length > 200)
      ? fullDescription
      : `${fullDescription.slice(0, 200)}...`;

    setDescription(newDescription);
  }, [more, fullDescription]);

  return (
    <div className={styles['entry-head']}>
      <div className={styles['head__back']} onClick={onBack}>
        <ArrowBackIcon />
      </div>

      <div className={styles['head__hero']}>
        <div
          className={styles['head__photo']}
          style={{ backgroundImage: `url(${photo})` }}
        >
        </div>
      </div>

      <div className={styles['head__content']}>
        <h5 className={styles['head__type']}>{entry.getTypeName()}</h5>
        <h3 className={styles['head__title']}>{entry.title}</h3>
      </div>

      <div className={styles['head__description-wrapper']}>
        <p className={styles['head__description']}>
          {description}
          {fullDescription.length > 200 &&
            <span
              onClick={onMoreToggle}
              className={styles['head__more']}
            >read {more ? 'less' : 'more'}</span>
          }
        </p>
      </div>
      <div className={styles['head__genres']}></div>
    </div>
  );
}

export default EntryHead;