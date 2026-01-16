import { Helmet } from "react-helmet-async"

type ThemeColor = "green" | "dark_cyan" | "java_blue" | "github_blue" | "red"

type AllanHelmetProps = {
    title?: string,
    theme?: ThemeColor,
    omitTitleSuffix?: boolean
}

function themeHex(color: ThemeColor): string {
    switch (color) {
        case "green": return "4caf50"
        case "dark_cyan": return "0097a7"
        case "java_blue": return "387fb5"
        case "github_blue": return "4078c0"
        case "red": return "f44336"
    }
}

function title(props: AllanHelmetProps): string {
    if (!props.title) return "Allan Wang"
    if (props.omitTitleSuffix) return props.title
    return `${props.title} | Allan Wang`
}

export function AllanHelmet(props: AllanHelmetProps) {
    const theme = props.theme ?? "dark_cyan"

    return (
        <Helmet title={title(props)} >
            {/* <link rel="shortcut icon" href={new URL(`./favicons/favicon-${themeHex(theme)}.ico`, import.meta.url).href} /> */}
        </Helmet>
    )
}