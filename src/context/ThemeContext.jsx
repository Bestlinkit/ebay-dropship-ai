import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Helper to convert hex to HSL
const hexToHsl = (hex) => {
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
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

// Helper to convert HSL to Hex
const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export const ThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#0e8ce9'); // Default Crystal Blue
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Apply colors to CSS Variables
  const applyTheme = (color) => {
    const hsl = hexToHsl(color);
    const root = document.documentElement;
    
    // Generate shades (50 to 950)
    // 50: very light (l=95)
    // 100: light (l=90)
    // ...
    // 500: base (the picked color)
    // ...
    // 900: very dark (l=15)
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
  };

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      applyTheme('#0e8ce9');
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    
    // Listen for real-time changes across devices
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().brandColor) {
        const newColor = docSnap.data().brandColor;
        setPrimaryColor(newColor);
        applyTheme(newColor);
      } else {
        applyTheme('#0e8ce9');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateBrandColor = async (color) => {
    setPrimaryColor(color);
    applyTheme(color);
    if (user) {
      await setDoc(doc(db, 'users', user.uid), { brandColor: color }, { merge: true });
    }
  };

  const value = {
    primaryColor,
    updateBrandColor,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
