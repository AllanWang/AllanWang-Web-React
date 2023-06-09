import { useLocation } from "react-router-dom";
import { AllanHelmet } from "../common/Helmet";

function NotFound() {
  const location = useLocation();
  return (
    <div>
      <AllanHelmet title="Not Found" theme="red" omitTitleSuffix={true} />
      {`Not found ${location.pathname}`}
    </div>
  )
}

export default NotFound;