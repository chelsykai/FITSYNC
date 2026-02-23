

import { useState } from "react";
import LogInPage from "./pages/auth/LogInPage";
import CreatePage from "./pages/auth/CreatePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

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
