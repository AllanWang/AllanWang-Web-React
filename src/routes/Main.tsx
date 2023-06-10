import { Container, Box, Divider, Typography } from "@mui/material";
import { AllanHelmet } from "../common/Helmet";
import PolygonAnimation from '../polygon/PolygonAnimationThree';

export default function Main() {
  return (
    <Box component="div">
      <AllanHelmet theme="dark_cyan"/>
      <PolygonAnimation />
      <Container maxWidth="md" sx={{ py: 10, minHeight: '100vh' }}>
        <Typography variant="h3">
          Hello World
        </Typography>
        <Divider variant="middle" sx={{ my: 2 }} />
        I'm currently migrating my website from PHP to React. <br />
        If you are looking for McGill notes, I've transcribed them all <a href="https://allanwang.github.io/McGill-Public/">here</a>.
      </Container>
    </Box>
  )
}