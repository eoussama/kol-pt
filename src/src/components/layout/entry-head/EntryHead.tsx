import styles from './EntryHead.module.scss';

import millify from 'millify';
import { Chip } from '@mui/material';
import Loader from '../loader/Loader';
import { useNavigate } from 'react-router-dom';
import TextExpand from '../text-expand/TextExpand';
import { Page } from '../../../core/enums/page.enum';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { EntryType } from '../../../core/enums/entry-type.enum';
import { IEntryPageHeadSectionProps } from '../../../core/types/props/entry-head.props.type';



/**
 * @description
 * The entry head component.
 */
function EntryHead(props: IEntryPageHeadSectionProps): JSX.Element {
  const { entry, loading, photo, viewCount, description, genres } = props;
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
        {loading
          ? <Loader height='250px' flat={true} overlay={true} />
          : <>
            <div
              className={styles['head__photo']}
              style={{ backgroundImage: `url(${photo}), url(./images/graphs/placeholder.jpg)` }}
            >
            </div>
          </>
        }
      </div>

      <div className={styles['head__content']}>
        <h5 className={styles['head__type']}>
          {entry.getTypeName()}
          {entry.type === EntryType.YouTube &&
            <> - {millify(viewCount)} views</>
          }
        </h5>

        <h3 className={styles['head__title']}>{entry.title}</h3>
      </div>

      <div className={styles['head__description-wrapper']}>
        <div className={styles['head__description']}>
          {loading
            ? <Loader height='100px' />
            : <TextExpand content={description} />
          }
        </div>
      </div>

      {genres.length > 0 &&
        <div className={styles['head__genres']}>
          {genres.map((e, i) => <Chip
            key={i}
            label={e}
            size='small'
            className={styles['head__genre']}
          />)}
        </div>
      }
    </div>
  );
}

export default EntryHead;