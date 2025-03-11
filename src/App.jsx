import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/Route";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
