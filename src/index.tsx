import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NotesRoute from './routes/Notes';
import Footer from './common/Footer';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './common/Header';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './common/Theme';
import NotFound from './routes/NotFound';
import { Toolbar } from '@mui/material';
import Projects from './routes/Projects';
import Temp from './Temp';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <CssBaseline />
          <Header />
          <Toolbar /> {/* For spacing */}
          <main>
            <Routes>
              <Route path="/" element={<Temp />} />
              <Route path="dev" element={<Projects />} />
              <Route path="notes">
                <Route path=":id" element={<NotesRoute />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
