

import { useState } from "react";
import LogInPage from "./pages/LogInPage";
import CreatePage from "./pages/CreatePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

function App() {
  const [route, setRoute] = useState("login");

  const navigate = (to) => setRoute(to);

  return (
    <>
      {route === "login" && <LogInPage onNavigate={navigate} />}
      {route === "create" && <CreatePage onNavigate={navigate} />}
      {route === "forgot" && <ForgotPasswordPage onNavigate={navigate} />}
    </>
  );
}

export default App;
