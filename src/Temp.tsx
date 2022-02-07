import { Container, Divider, Typography } from "@mui/material";

export default function Temp() {
  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Typography variant="h3">
        Hello World
      </Typography>
      <Divider variant="middle" sx={{ my: 2 }} />
      I'm currently migrating my website from PHP to React. <br />
      If you are looking for McGill notes, I've transcribed them all <a href="https://allanwang.github.io/McGill-Public/">here</a>.
    </Container>
  )
}