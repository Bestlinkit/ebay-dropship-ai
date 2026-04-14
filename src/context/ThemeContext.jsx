import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('brandColor') || DEFAULT_COLOR);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');
  const [uiScale, setUiScale] = useState(() => parseInt(localStorage.getItem('uiScale')) || 100);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const initRef = useRef(false);

  // Optimized Theme Applier (v12.1 Rescue hardening)
  const applyTheme = useCallback((color, mode, scale) => {
    try {
      const root = document.documentElement;
      
      // 1. Primary Color Shades
      const safeColor = isValidHex(color) ? color : DEFAULT_COLOR;
      const hsl = hexToHsl(safeColor);
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

      // 2. Global Attributes (Data Theme)
      root.setAttribute('data-theme', mode);
      localStorage.setItem('themeMode', mode);
      localStorage.setItem('brandColor', safeColor);

      // 3. UI Scale (Base Font Size)
      const baseSize = (scale / 100) * 16;
      root.style.setProperty('--base-font-size', `${baseSize}px`);
      localStorage.setItem('uiScale', scale.toString());

    } catch (error) {
      console.error("Theme Rescue: Application Failure:", error);
    }
  }, []);

  // Sync with Firestore & Local (Harden v12.1)
  useEffect(() => {
    // Immediate recovery: Apply local settings first
    applyTheme(primaryColor, themeMode, uiScale);

    // Safety Timeout: Force loading to false after 2.5s regardless of Firestore
    const safetyTimeout = setTimeout(() => {
        setLoading(false);
    }, 2500);

    if (!user) {
      setLoading(false);
      clearTimeout(safetyTimeout);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newColor = data.brandColor || primaryColor;
          const newMode = data.themeMode || themeMode;
          const newScale = data.uiScale || uiScale;

          setPrimaryColor(newColor);
          setThemeMode(newMode);
          setUiScale(newScale);
          applyTheme(newColor, newMode, newScale);
        }
      } catch (err) {
        console.error("Theme Rescue: Snapshot Error:", err);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    }, (err) => {
        console.error("Theme Rescue: Firestore Connection Failure:", err);
        setLoading(false);
        clearTimeout(safetyTimeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [user, applyTheme]);

  const updateTheme = async (updates) => {
    const newColor = updates.primaryColor || primaryColor;
    const newMode = updates.themeMode || themeMode;
    const newScale = updates.uiScale !== undefined ? updates.uiScale : uiScale;

    setPrimaryColor(newColor);
    setThemeMode(newMode);
    setUiScale(newScale);
    applyTheme(newColor, newMode, newScale);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { 
          brandColor: newColor,
          themeMode: newMode,
          uiScale: newScale
        }, { merge: true });
      } catch (err) {
        console.error("Theme Rescue: Cloud Sync Failed:", err);
      }
    }
  };

  const value = {
    primaryColor,
    themeMode,
    uiScale,
    updateTheme,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {/* 🛡️ v12.1 Stability Guard: Never block rendering indefinitely */}
      {children}
    </ThemeContext.Provider>
  );
};
