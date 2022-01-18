import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import ReactMarkdown, { uriTransformer } from "react-markdown";
import { useParams } from "react-router-dom";
import NotFound from "./NotFound";

const rawBaseUrl = "https://raw.githubusercontent.com/AllanWang/McGill-Public/dev"
const absoluteUrlRegex = "(?:^[a-z][a-z0-9+\.-]*:|\/\/)"

const supportedNotes = new Map<string, string>([
  ['comp251', "Comp-251/notes.md"],
  ['comp273', "Comp-273/notes.md"],
  ['comp302', "Comp-302/notes.md"],
  ['comp303', "Comp-303/notes.md"],
  ['comp310', "Comp-310/notes.md"],
  ['comp330', "Comp-330/notes.md"],
  ['comp360', "Comp-360/notes.md"],
  ['comp361', "Comp-361/midterm.md"],
  ['comp409', "Comp-409/notes.md"],
  ['comp520', "Comp-520/notes.md"],
  ['comp529', "Comp-529/notes.md"],
  ['comp550', "Comp-550/notes.md"],
  ['comp551', "Comp-551/notes.md"],
  ['comp558', "Comp-558/notes.md"],
]);

type NotesProps = {
  relativeUrl: string
}

function Notes(props: NotesProps) {
  const [mdText, setMdText] = useState("");
  const fullUrl = `${rawBaseUrl}/${props.relativeUrl}`
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
      <ReactMarkdown children={mdText} linkTarget={baseUrl}
        transformImageUri={relativeUriTransformer} transformLinkUri={relativeUriTransformer} />
    </Box>
  );
}

/**
 * Find associated path for route id before loading true note component
 */
export default function NotesRoute(props: any) {
  const { id } = useParams();

  const relativeUrl = id && supportedNotes.get(id);
  if (!relativeUrl) {
    return (<NotFound {...props} />)
  }

  return (
    <Notes relativeUrl={relativeUrl} />
  );
}
