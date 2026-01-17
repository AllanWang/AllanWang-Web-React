import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import { styled, alpha, useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import SearchIcon from '@mui/icons-material/Search';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Logo from "./Logo";
import Slide from "@mui/material/Slide";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

function HideOnScroll(props: { children: React.ReactElement<any, any> }) {
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {props.children}
    </Slide>
  );
}

const pages: AppBarItemProp[] = [
  {
    text: "Projects",
    link: "dev"
  },
  {
    text: "Notes",
    link: "notes"
  }
]

type AppBarItemProp = {
  text: string,
  link: string
}

function AppBarItem(prop: AppBarItemProp) {
  const navigate = useNavigate();

  return (
    <Button key={prop.link} sx={{ my: 2, color: 'text.primary', display: 'block' }} onClick={() => {
      navigate(prop.link);
    }}>{prop.text}</Button>
  );
}

function NavAppBar() {
  const theme = useTheme();

  return (
    <Box component="div" sx={{ flexGrow: 1 }}>
      <HideOnScroll>
        <AppBar elevation={2} position="fixed" sx={{
          color: "text.primary",
          // bgcolor: "background.paper"
          // https://github.com/mui-org/material-ui/blob/dcbfc54f581dbf1c0008a8e9e578f896f06228ab/packages/mui-material/src/AppBar/AppBar.js#L35
          bgcolor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900]
        }}>
          <Toolbar>
            <Box component="div" sx={{ px: 2 }}>
              <Logo animated={true} logoColor={theme.palette.primary.main} secondaryColor={theme.palette.text.secondary} />
            </Box>

            {/* <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
            >
              MUI
            </Typography> */}

            <Box component="div" sx={{ flexGrow: 1, display: 'flex' }}>
              {
                pages.map((page) => (
                  <AppBarItem {...page} key={page.link} />
                ))
              }
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
    </Box>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SearchBar() {
  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder="Search…"
        inputProps={{ 'aria-label': 'search' }}
      />
    </Search>
  )
}

export default function Header() {
  return (
    <Box component="header" >
      <NavAppBar />
    </Box>
  );
}