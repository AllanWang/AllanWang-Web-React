import { Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import React, { useEffect, useState } from "react";
import ReactMarkdown, { uriTransformer } from "react-markdown";
import { useParams } from "react-router-dom";
import { Link } from 'react-router-dom';
import NotFound from "./NotFound";
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import './Notes.scss';

const rawBaseUrl = "https://raw.githubusercontent.com/AllanWang/McGill-Public/dev"
const absoluteUrlRegex = "(?:^[a-z][a-z0-9+.-]*:|//)"

type NoteEntry = string /* markdown file from github */

type NoteInfo = {
  url: string
  subpath: string
  main: NoteEntry
  extras?: NoteEntry[]
}

const supportedNotes = new Map<string, NoteInfo>([
  { url: 'comp251', subpath: "Comp-251", main: "notes" },
  { url: 'comp273', subpath: "Comp-273", main: "notes" },
  { url: 'comp302', subpath: "Comp-302", main: "notes" },
  { url: 'comp303', subpath: "Comp-303", main: "notes" },
  { url: 'comp310', subpath: "Comp-310", main: "notes" },
  { url: 'comp330', subpath: "Comp-330", main: "notes" },
  { url: 'comp360', subpath: "Comp-360", main: "notes" },
  { url: 'comp361', subpath: "Comp-361", main: "midterm" },
  { url: 'comp409', subpath: "Comp-409", main: "notes" },
  { url: 'comp520', subpath: "Comp-520", main: "notes" },
  { url: 'comp529', subpath: "Comp-529", main: "notes" },
  { url: 'comp550', subpath: "Comp-550", main: "notes" },
  { url: 'comp551', subpath: "Comp-551", main: "notes" },
  { url: 'comp558', subpath: "Comp-558", main: "notes" },
].map(info => [info.url, info]));

type NotesProps = {
  info: NoteInfo,
  segment: string,
}

function githubFullUrl(info: NoteInfo, segment: string): string {
  return `${rawBaseUrl}/${info.subpath}/${segment}.md`
}

/**
 * Markdown renderer for specific notes page.
 */
function Notes(props: NotesProps) {
  const [mdText, setMdText] = useState("");
  const fullUrl = githubFullUrl(props.info, props.segment);
  const baseUrl = fullUrl.substring(0, fullUrl.lastIndexOf('/'))

  // https://github.com/remarkjs/react-markdown/issues/76#issuecomment-599269231
  useEffect(() => {
    fetch(fullUrl)
      .then(response => {
        if (response.ok) return response.text();
        else return Promise.reject("Didn't fetch text correctly");
      })
      .then(text => {
        setMdText(text);
      })
      .catch(error => console.error(error));
  });

  const relativeUriTransformer = (uri: string) => {
    uri = uriTransformer(uri);
    if (!uri.match(absoluteUrlRegex))
      uri = `${baseUrl}/${uri}`
    // console.log(uri);
    return uri;
  };

  return (
    <Box sx={{ my: 4, mx: 4 }}>
      <ReactMarkdown children={mdText} linkTarget={baseUrl} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeMathjax]}
        transformImageUri={relativeUriTransformer} transformLinkUri={relativeUriTransformer} />
    </Box>
  );
}

/**
 * Index page containing links to all valid note paths.
 */
export function NotesIndex() {
  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <TableContainer >
        <Table >
          <TableBody>
            {Array.from(supportedNotes.entries()).map(([k, info]) => (
              <NoteInfoIndex key={k} info={info} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  )
}

/**
 * Row for {@link NotesIndex}
 */
function NoteInfoIndex(props: { info: NoteInfo }) {
  return (
    <TableRow hover={true}>
      <TableCell width="20%">{props.info.subpath}</TableCell>
      <TableCell>
        <Link to={`./${props.info.url}`}>{props.info.main}</Link>
        {props.info.extras?.map(e => (
          <React.Fragment>
            &ensp;&bull;&ensp;
            <Link to={`./${props.info.url}/${e}`}>{e}</Link>
          </React.Fragment>
        ))}
      </TableCell>
    </TableRow>
  )
}

/**
 * Route for specific course; points towards main note entry.
 */
export function NotesCourseMainRoute(props: any) {
  const { courseId } = useParams();

  const relativeInfo = courseId && supportedNotes.get(courseId);
  if (!relativeInfo) {
    return (<NotFound {...props} />)
  }

  return (
    <Notes info={relativeInfo} segment={relativeInfo.main} />
  );
}

/**
 * Route for specific course and note page; points to associated github page.
 */
export function NotesCourseSegmentRoute(props: any) {
  const { courseId, noteId } = useParams();

  if (!courseId || !noteId) return (<NotFound {...props} />)

  const relativeInfo = supportedNotes.get(courseId);
  if (!relativeInfo) {
    return (<NotFound {...props} />)
  }

  if (noteId === relativeInfo.main || relativeInfo.extras?.includes(noteId)) {
    return (<Notes info={relativeInfo} segment={noteId} />)
  }

  return (<NotFound {...props} />)
}