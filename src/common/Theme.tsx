import { createTheme, ThemeOptions } from "@mui/material/styles"

// https://bareynol.github.io/mui-theme-creator/
export let theme = createTheme({
  // palette: {
  //   primary: {
  //     light: '#fafafa',
  //     main: '#000',
  //     dark: '#303030',
  //     contrastText: '#000'
  //   }
  // },
});

// theme = {
//   ...theme,
//   components: {
//     MuiAppBar: {
//       styleOverrides: {
//         colorPrimary: {
//           backgroundColor: "theme.palette.background.default"
//         }
//       }
//     }
//   }
// }

// export const theme = createTheme({
//   components: {
//     MuiAppBar: {
//       styleOverrides: {
//         colorPrimary: {
//           backgroundColor: theme.palette.background
//         }
//       }
//     }
//   }
// });
