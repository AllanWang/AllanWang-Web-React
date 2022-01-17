import { useLocation } from "react-router-dom";

function NotFound() {
  const location = useLocation();
  return (
    <div>
      {`Not found ${location.pathname}`}
    </div>
  )
}

export default NotFound;