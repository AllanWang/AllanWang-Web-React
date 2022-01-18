import { Link } from 'react-router-dom';
import './Logo.scss'

type LogoProps = {
  animated: boolean
  logoColor: string,
  secondaryColor: string,
}

export default function Logo(props: LogoProps) {
  return (
    <Link to="/" className="logo-container" >
      <svg viewBox="0 0 133 100" height="30" className={props.animated ? "logo-animated-home" : ""}>
        {/* Draw order matters as we want middle two on top; Paths declared in scss */}
        {/* \... */}
        <path id="line1" stroke={props.secondaryColor} />
        {/* .../ */}
        <path id="line4" stroke={props.secondaryColor} />
        {/* ./.. */}
        <path id="line2" stroke={props.logoColor} />
        {/* ..\. */}
        <path id="line3" stroke={props.logoColor} />
        {/* <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.2)" /> */}
      </svg>
    </Link>
  );
}