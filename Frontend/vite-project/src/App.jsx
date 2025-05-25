import { Route, Switch } from "wouter";
import { Microscope, FileText, Users, Activity } from "lucide-react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import Login from "./components/Login.jsx";
import DoctorDashboard from "./components/DoctorDashboard.jsx";
import PathologistDashboard from "./components/PathologistDashboard.jsx";
import PatientDashboard from "./components/PatientDashboard.jsx";

const App = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Switch>
          <Route path="/" component={Login} />
          <Route path="/doctor/dashboard" component={DoctorDashboard} />
          <Route path="/pathologist/dashboard" component={PathologistDashboard} />
          <Route path="/patient/dashboard" component={PatientDashboard} />
        </Switch>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;