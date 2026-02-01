/**
 * Style Helpers - Utility functions for elegant UI styling
 * 
 * These helpers READ theme values and return enhanced styling
 * WITHOUT modifying the theme system itself.
 */

/**
 * Adjusts color saturation and lightness for more elegant appearance
 * @param {string} hexColor - Hex color value (e.g., "#22c55e")
 * @param {number} saturationFactor - 0.0 to 1.0 (lower = less saturated)
 * @param {number} lightnessFactor - adjustment to lightness
 * @returns {string} Adjusted hex color
 */
export function adjustColor(hexColor, saturationFactor = 0.7, lightnessAdjust = 0) {
    if (!hexColor || !hexColor.startsWith('#')) return hexColor;

    // Convert hex to HSL
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    // Adjust saturation and lightness
    s = Math.min(1, Math.max(0, s * saturationFactor));
    l = Math.min(0.95, Math.max(0.05, l + lightnessAdjust));

    // Convert HSL back to hex
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const rOut = hue2rgb(p, q, h + 1 / 3);
    const gOut = hue2rgb(p, q, h);
    const bOut = hue2rgb(p, q, h - 1 / 3);

    const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`;
}

/**
 * Get elegant button styles based on theme color
 * Returns softer, more professional button styling
 */
export function getElegantButtonStyle(themeColor, variant = 'primary') {
    const softerColor = adjustColor(themeColor, 0.75, 0.05);
    const hoverColor = adjustColor(themeColor, 0.8, -0.05);

    return {
        backgroundColor: softerColor,
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '500',
        letterSpacing: '0.01em',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        ':hover': {
            backgroundColor: hoverColor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }
    };
}

/**
 * Get elegant table styles
 * Professional, compact table styling for accounting data
 */
export function getElegantTableStyles(theme = {}) {
    const headerBg = adjustColor(theme.tableHeaderColor || '#e0e7ff', 0.5, 0.05);

    return {
        container: {
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
        },
        header: {
            backgroundColor: headerBg,
            borderBottom: '1px solid #d1d5db',
        },
        headerCell: {
            padding: '10px 12px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#374151',
        },
        row: {
            borderBottom: '1px solid #f3f4f6',
            transition: 'background-color 0.1s ease',
        },
        rowHover: {
            backgroundColor: '#f9fafb',
        },
        cell: {
            padding: '10px 12px',
            fontSize: '13px',
            color: '#1f2937',
        },
        cellNumber: {
            fontFamily: '"SF Mono", "Consolas", "Liberation Mono", monospace',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
        },
    };
}

/**
 * Get elegant card styles
 */
export function getElegantCardStyles(theme = {}) {
    return {
        card: {
            backgroundColor: theme.cardColor || '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
        },
        header: {
            padding: '16px 20px',
            borderBottom: '1px solid #f3f4f6',
        },
        title: {
            fontSize: '15px',
            fontWeight: '600',
            color: '#111827',
            letterSpacing: '-0.01em',
        },
        content: {
            padding: '16px 20px',
        },
    };
}

/**
 * Get elegant input styles
 */
export function getElegantInputStyles(theme = {}) {
    return {
        input: {
            backgroundColor: theme.fieldColor || '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            color: '#1f2937',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            outline: 'none',
        },
        inputFocus: {
            borderColor: '#6366f1',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
        },
    };
}

/**
 * Format currency with proper alignment styling
 */
export function formatCurrencyStyle(value, isNegative = false) {
    return {
        fontFamily: '"SF Mono", "Consolas", monospace',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        color: isNegative ? '#dc2626' : '#1f2937',
        fontWeight: isNegative ? '500' : '400',
    };
}

// CSS class name generator for consistent styling
export const elegantClasses = {
    button: {
        base: 'elegant-btn',
        primary: 'elegant-btn-primary',
        secondary: 'elegant-btn-secondary',
        danger: 'elegant-btn-danger',
        ghost: 'elegant-btn-ghost',
    },
    table: {
        base: 'elegant-table',
        header: 'elegant-table-header',
        row: 'elegant-table-row',
        cell: 'elegant-table-cell',
        cellNumber: 'elegant-table-cell-number',
    },
    card: {
        base: 'elegant-card',
        header: 'elegant-card-header',
        content: 'elegant-card-content',
    },
    input: {
        base: 'elegant-input',
        focused: 'elegant-input-focused',
    },
};
