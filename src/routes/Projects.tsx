import { Container, Divider, Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import materialGlassBanner from "../dev/images/material_glass_banner.jpg";
import frostBanner from "../dev/images/frost_banner.jpg";
import kauBanner from "../dev/images/kau.jpg";
import { AllanHelmet } from "../common/Helmet";

type ProjectCardProps = {
  image?: string
  title: string
  description: string
  actions: { text: string, url: string }[]
}

type ProjectList = (ProjectCardProps | null)[];

function ProjectCard(props: ProjectCardProps) {
  return (
    <Card variant="outlined">
      {(props.image ? <CardMedia
        component="img"
        alt={props.title}
        height="140"
        image={props.image}
      /> : null)}

      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {props.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {props.description}
        </Typography>
      </CardContent>
      <CardActions>
        {props.actions.map((action) => (
          <Button size="small" href={action.url} target="_blank">{action.text}</Button>
        ))}
      </CardActions>
    </Card>
  );
}

function ProjectGroup(props: { projects: ProjectList }) {
  return (<Grid container rowSpacing={4} columnSpacing={{ xs: 2, md: 4 }} columns={{ xs: 4, sm: 8, md: 12 }}>
    {props.projects.map((project, index) => (
      <Grid item xs={4} sm={4} md={6} key-={project?.title ?? index}>
        {(project ? <ProjectCard {...project} /> : null)}
      </Grid>
    ))}
  </Grid>);
}

const mainProjects: ProjectList = [
  {
    title: "Material Glass",
    description: "The first Android framework theme ever created for Android 5.0",
    image: materialGlassBanner,
    actions: [
      {
        text: "Github-CM",
        url: "https://github.com/PitchedApps/Material-Glass"
      },
      {
        text: "Github-OMS",
        url: "https://github.com/PitchedApps/Material-Glass-Substratum",
      }
    ]
  },
  {
    title: "Frost for Facebook",
    description: "A comprehensive third party Facebook app, made with design and functionality in mind",
    image: frostBanner,
    actions: [
      {
        text: "Github",
        url: "https://github.com/AllanWang/Frost-for-Facebook"
      },
      {
        text: "F-Droid",
        url: "https://f-droid.org/en/packages/com.pitchedapps.frost"
      }
    ]
  },
  {
    title: "KAU",
    description: "An extensive collection of Kotlin Android Utils",
    image: kauBanner,
    actions: [
      {
        text: "Github",
        url: "https://github.com/AllanWang/KAU"
      },
      {
        text: "Page",
        url: "https://allanwang.github.io/KAU"
      }
    ]
  },
];

const sideProjects: ProjectList = [
  {
    title: "McGill Public",
    description: "Collection of notes from my McGill undergraduate studies",
    actions: [
      {
        text: "Github",
        url: "https://github.com/AllanWang/McGill-Public"
      },
      {
        text: "Page",
        url: "https://allanwang.github.io/McGill-Public/"
      }
    ]
  },
  {
    title: "Gompilers",
    description: "Comp 520; GoLite compiler written in Haskell, targetting JVM Bytecode",
    actions: [
      {
        text: "Github",
        url: "https://github.com/gompiler/glc"
      }
    ]
  },

]

export default function Projects() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <AllanHelmet title="Projects" theme="green"/>
      <ProjectGroup projects={mainProjects} />
      <Divider sx={{ my: 4 }} />
      <ProjectGroup projects={sideProjects} />
    </Container>
  );
}