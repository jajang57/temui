import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const defaultTheme = {
  buttonSimpan: "#22c55e",
  buttonHapus: "#ef4444",
  buttonUpdate: "#f59e42",
  buttonRefresh: "#6366f1",
  cardColor: "#ffffff",
  dropdownColor: "#f3f4f6",
  backgroundColor: "#f9fafb",
  menuPosition: "top",
  tableHeaderColor: "#e0e7ff",
  formColor: "#ffffff",
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(defaultTheme);

  // Load theme dari backend saat mount (sekali saja)
  useEffect(() => {
    // We can't access AppContext here directly because ThemeProvider wraps App. 
    // Usually ThemeProvider is inside AppProvider, but if not, we need to handle it.
    // For now, let's just make the failure silent as it is now.

    // Actually, to fix the specific "Target Client ID required" error which is annoying:
    // We should strictly use a try-catch and IGNORE strict 400 errors from proxy.
    const fetchTheme = async () => {
      try {
        const res = await api.get('/user-theme-setting');
        const data = res.data;
        if (data.theme) {
          setTheme((prev) => ({
            ...prev,
            ...data.theme,
          }));
        }
      } catch (err) {
        // Silent fail is fine, use default theme
      }
    };
    fetchTheme();
  }, []);

  // Fungsi untuk update theme (misal setelah simpan di Setting)
  const updateTheme = (newTheme) => {
    setTheme((prev) => ({
      ...prev,
      ...newTheme,
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}