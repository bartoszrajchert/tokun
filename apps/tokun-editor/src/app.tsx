import { ThemeProvider } from "@/components/theme-provider";
import { Outlet } from "react-router";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tokun-editor-theme">
      <Outlet />
    </ThemeProvider>
  );
}
