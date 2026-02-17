

import { useState } from "react";
import LogInPage from "./assets/LogInPage";
import CreatePage from "./assets/CreatePage";
import ForgotPasswordPage from "./assets/ForgotPasswordPage";

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
