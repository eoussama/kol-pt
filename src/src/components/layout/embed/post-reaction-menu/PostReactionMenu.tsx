import styles from './PostReactionMenu.module.scss';

import { useContext } from 'react';
import { Divider, Menu, MenuItem } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { IOption } from '../../../../core/types/option.type';
import { ReactionOverlayContext } from '../../../../context/ReactionOverlayContext';



/**
 * @description
 * Renders a popover menu for a post reaction.
 * 
 * @param props The component props.
 */
function PostReactionMenu(): JSX.Element {
  const { tag, anchorEl, anchorOpened, setAnchorOpened } = useContext(ReactionOverlayContext);

  /**
   * @description
   * Closes the menu element
   */
  const onClose = () => {
    setAnchorOpened(false);
  };

  /**
   * @description
   * Invokes option action and closes the menu element
   */
  const onOptionClick = (option: IOption): void => {
    onClose();
    option.action();
  };

  return <>
    <Menu
      onClose={onClose}
      anchorEl={anchorEl}
      open={anchorOpened}
      PaperProps={{
        elevation: 0,
        sx: {
          mt: 1.5,
          overflow: 'visible',
          filter: 'drop-shadow(0px 0px 8px rgba(0,0,0,0.2))',
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
          '& .MuiMenuItem-root': {
            fontSize: 14,
            display: 'flex',
            alignItems: 'center'
          },
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {tag?.entry.getOptions(tag.context).filter(option => option.canShow()).map((option, i) => <>
        <MenuItem
          key={i}
          className={styles['popover-item']}
          onClick={() => onOptionClick(option)}
        >
          <img
            className={styles['popover-icon']}
            src={option.icon}
            alt={option.iconAlt}
          />
          <span>{option.label}</span>
          <OpenInNewIcon />
        </MenuItem>

        {option.divider && <Divider />}
      </>
      )}
    </Menu >
  </>
}

export default PostReactionMenu;