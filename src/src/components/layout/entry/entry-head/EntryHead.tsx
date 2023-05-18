import styles from './EntryHead.module.scss';

import millify from 'millify';
import { Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Loader from '../../generic/loader/Loader';
import { Page } from '../../../../core/enums/page.enum';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TextExpand from '../../generic/text-expand/TextExpand';
import { EntryType } from '../../../../core/enums/entry-type.enum';
import { IEntryPageHeadSectionProps } from '../../../../core/types/props/entry-head.props.type';



/**
 * @description
 * The entry head component.
 */
function EntryHead(props: IEntryPageHeadSectionProps): JSX.Element {
  const { entry, loading, viewCount, description, genres, isDialog } = props;

  /* eslint-disable react-hooks/rules-of-hooks */
  const navigate = isDialog ? () => { } : useNavigate();

  /**
   * @description
   * Navigates back to the entries list.
   */
  const onBack = () => {
    if (!isDialog) {
      navigate(`${Page.Index}${Page.Entries}`);
    }
  }

  return (
    <div className={styles['entry-head']}>
      {!isDialog &&
        <div className={styles['head__back']} onClick={onBack}>
          <ArrowBackIcon />
        </div>
      }

      <div className={styles['head__hero']}>
        {loading ? <Loader height='250px' flat={true} overlay={true} /> : ''}
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