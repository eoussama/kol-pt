import { styled } from "@mui/material";
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';



/**
 * @description
 * Accordion component that wraps post reactions
 *
 * @param props: props for Accordion
 */
export const PostAccordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));