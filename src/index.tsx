import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { NotesIndex, NotesCourseMainRoute, NotesCourseSegmentRoute } from './routes/Notes';
import Footer from './common/Footer';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './common/Header';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './common/Theme';
import NotFound from './routes/NotFound';
import { Toolbar } from '@mui/material';
import Main from './routes/Main';
import Projects from './routes/Projects';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AllanHelmet } from './common/Helmet';

ReactDOM.render(
  <React.StrictMode>
    <HelmetProvider>
      <Helmet defaultTitle="Allan Wang"/>
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
            <Toolbar id="scroll_to_top" /> {/* For spacing and scroll to top */}
            <main>
              <Routes>
                <Route path="/" element={<Main />} />
                <Route path="dev" element={<Projects />} />
                <Route path="notes" element={<NotesIndex />} />
                <Route path="notes/:courseId" element={<NotesCourseMainRoute />} />
                <Route path="notes/:courseId/:noteId" element={<NotesCourseSegmentRoute />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </Box>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
