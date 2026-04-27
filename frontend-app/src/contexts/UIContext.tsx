import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "auto";
type Density = "comfortable" | "compact";
type RadiusMode = "soft" | "rounded";
type MotionMode = "normal" | "reduced";
type CardStyle = "elevated" | "flat";

interface UIContextValue {
  themeMode: ThemeMode;
  density: Density;
  radiusMode: RadiusMode;
  motionMode: MotionMode;
  cardStyle: CardStyle;
  setThemeMode: (mode: ThemeMode) => void;
  setDensity: (density: Density) => void;
  setRadiusMode: (radiusMode: RadiusMode) => void;
  setMotionMode: (motionMode: MotionMode) => void;
  setCardStyle: (cardStyle: CardStyle) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [density, setDensity] = useState<Density>("comfortable");
  const [radiusMode, setRadiusMode] = useState<RadiusMode>("soft");
  const [motionMode, setMotionMode] = useState<MotionMode>("normal");
  const [cardStyle, setCardStyle] = useState<CardStyle>("elevated");

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", themeMode);
    root.setAttribute("data-density", density);
    root.setAttribute("data-radius", radiusMode);
    root.setAttribute("data-motion", motionMode);
    root.setAttribute("data-card", cardStyle);

    document.body.classList.toggle("auto-theme", themeMode === "auto");
  }, [themeMode, density, radiusMode, motionMode, cardStyle]);

  const value = useMemo(
    () => ({
      themeMode,
      density,
      radiusMode,
      motionMode,
      cardStyle,
      setThemeMode,
      setDensity,
      setRadiusMode,
      setMotionMode,
      setCardStyle,
    }),
    [themeMode, density, radiusMode, motionMode, cardStyle],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextValue => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};
