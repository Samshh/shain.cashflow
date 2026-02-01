import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";

interface ThemeToggleProps {
  collapsed: boolean;
}

export function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      variant="outline"
      className={`w-full ${collapsed ? "justify-center p-2" : "justify-start"}`}
      onClick={toggleTheme}
      title={label}
      aria-label={label}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {!collapsed && <span className="ml-2">{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </Button>
  );
}
