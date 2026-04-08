import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./app/router.jsx";
import { AuthProvider } from "./store/authStore.jsx";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "20px",
            background: "#0f172a",
            color: "#e2e8f0",
            border: "1px solid rgba(148, 163, 184, 0.18)"
          }
        }}
      />
    </AuthProvider>
  );
}

export default App;
