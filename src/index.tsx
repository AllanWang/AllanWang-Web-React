import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NotesRoute from './routes/Notes';
import Footer from './common/Footer';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './common/Header';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './common/Theme';

ReactDOM.render(
  <React.StrictMode>
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
        <main>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="notes">
                <Route path=":id" element={<NotesRoute />} />
              </Route>
              <Route path="*" element={<App />} />
            </Routes>
          </BrowserRouter>
        </main>
        <Footer />
      </Box>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
