import { ListItemText as ListItemTextMui, styled } from "@mui/material";



/**
 * @description
 * Overrides basi Mui UI list item text component's styles.
 */
export const ListItemText = styled(ListItemTextMui)<{ component?: React.ElementType }>({
  '.MuiListItemText-primary': {
    fontSize: 14,
    fontWeight: 500,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: 'var(--color-text)',
  }
});