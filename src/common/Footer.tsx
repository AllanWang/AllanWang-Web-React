import { Box, Container, Link, Typography, Stack, IconButton } from "@mui/material";
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import './Footer.scss';

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary"  >
      {'Copyright © '}
      <Link color="inherit" href="https://github.com/AllanWang" target="_blank" rel="noopener">
        Allan Wang
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

function Icon(props: { name: string, icon: JSX.Element, href: string }) {
  return <IconButton className={props.name} aria-label={props.name} href={props.href} target="_blank"
    rel="noopener noreferrer">{props.icon}</IconButton>
}

// Sticky footer
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Stack direction="row" alignItems="center">
        <Container maxWidth="sm">
          <Stack direction="row" alignItems="center">
            <Copyright />
            <Box sx={{ flexGrow: 1 }} />
            <Icon name="GitHub" icon={<GitHubIcon />} href="https://github.com/AllanWang" />
            <Icon name="LinkedIn" icon={<LinkedInIcon />} href="https://www.linkedin.com/in/allanwang97" />
            <Icon name="Email" icon={<EmailOutlinedIcon />} href="mailto:me@allanwang.ca?Subject=Web%20Inquiry" />
          </Stack>
        </Container>
        <IconButton onClick={() => {
          document.querySelector('#scroll_to_top')
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            })
        }} role="presentation"><KeyboardArrowUpIcon /></IconButton>
      </Stack>
    </Box >
  )
}