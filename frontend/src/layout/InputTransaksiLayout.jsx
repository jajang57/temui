import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function InputTransaksiLayout({ children }) {
  const { theme } = useTheme();

  return (
    <div
      className="p-0 min-h-screen"
      style={{
        background: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        color: theme.fontColor,
      }}
    >

      <div
        className="rounded shadow p-4"
        style={{
          background: theme.cardColor,
          color: theme.fontColor,
          fontFamily: theme.fontFamily,
        }}
      >
        {children ? children : <p>Silakan input transaksi di sini.</p>}
      </div>
    </div>
  );
}
