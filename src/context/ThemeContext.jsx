import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const DEFAULT_COLOR = '#0e8ce9';

// Improved Hex Validation
const isValidHex = (hex) => {
  return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex);
};

// Robust Hex to HSL
const hexToHsl = (hex) => {
  try {
    if (!isValidHex(hex)) throw new Error("Invalid Hex");
    
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  } catch (e) {
    console.error("Theme Error: hexToHsl failed", e);
    return { h: 205, s: 89, l: 48 }; // Safe fallback HSL
  }
};

// Robust HSL to Hex
const hslToHex = (h, s, l) => {
  try {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch (e) {
    return DEFAULT_COLOR;
  }
};

export const ThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLOR);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Optimized Theme Applier
  const applyTheme = useCallback((color) => {
    try {
      const safeColor = isValidHex(color) ? color : DEFAULT_COLOR;
      const hsl = hexToHsl(safeColor);
      const root = document.documentElement;
      
      const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
      const lightnessMap = {
        50: 97, 100: 93, 200: 85, 300: 75, 400: 60,
        500: hsl.l, 600: Math.max(10, hsl.l - 10), 
        700: Math.max(10, hsl.l - 20), 800: Math.max(10, hsl.l - 30), 
        900: Math.max(10, hsl.l - 40), 950: Math.max(5, hsl.l - 45)
      };

      shades.forEach(shade => {
        const shadeHex = hslToHex(hsl.h, hsl.s, lightnessMap[shade]);
        root.style.setProperty(`--primary-${shade}`, shadeHex);
      });
    } catch (error) {
      console.error("Theme Application Failure:", error);
    }
  }, []);

  // Sync with Firestore with error handling
  useEffect(() => {
    if (!user) {
      setPrimaryColor(DEFAULT_COLOR);
      applyTheme(DEFAULT_COLOR);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    
    // Listen for real-time changes
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      try {
        if (docSnap.exists() && docSnap.data().brandColor) {
          const newColor = docSnap.data().brandColor;
          if (isValidHex(newColor)) {
            setPrimaryColor(newColor);
            applyTheme(newColor);
          } else {
            applyTheme(DEFAULT_COLOR);
          }
        } else {
          applyTheme(DEFAULT_COLOR);
        }
      } catch (err) {
        console.error("Snapshot Sync Error:", err);
        applyTheme(DEFAULT_COLOR);
      } finally {
        setLoading(false);
      }
    }, (error) => {
        console.error("Firestore Theme Connection Error:", error);
        applyTheme(DEFAULT_COLOR);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, applyTheme]);

  const updateBrandColor = async (color) => {
    if (!isValidHex(color)) {
        console.error("Attempted to set invalid color:", color);
        return;
    }
    
    setPrimaryColor(color);
    applyTheme(color);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { brandColor: color }, { merge: true });
      } catch (err) {
        console.error("Failed to save theme to cloud:", err);
      }
    }
  };

  const value = {
    primaryColor,
    updateBrandColor,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {!loading && children}
    </ThemeContext.Provider>
  );
};
