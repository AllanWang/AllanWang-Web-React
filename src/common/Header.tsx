import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { styled, alpha, useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import Typography from "@mui/material/Typography";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Logo from "./Logo";
import Slide from "@mui/material/Slide";
import { ReactNode } from "react";

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


function NavAppBar() {
  const theme = useTheme();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <HideOnScroll>
        <AppBar elevation={2} position="fixed" sx={{
          color: "text.primary",
          // bgcolor: "background.paper"
          // https://github.com/mui-org/material-ui/blob/dcbfc54f581dbf1c0008a8e9e578f896f06228ab/packages/mui-material/src/AppBar/AppBar.js#L35
          bgcolor: theme.palette.mode == 'light' ? theme.palette.grey[100] : theme.palette.grey[900]
        }}>
          <Toolbar>
            <Logo animated={true} logoColor="#ff00ff" />
            {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
            >
              MUI
            </Typography>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ 'aria-label': 'search' }}
              />
            </Search>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
    </Box>
  );
}

export default function Header() {
  return (
    <Box component="header" >
      <NavAppBar />
    </Box>
  );
}