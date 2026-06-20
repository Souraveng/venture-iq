// components/PremiumGate.tsx
// UI component that blurs its children and displays a lock overlay for premium‑only pages.
// Usage: <PremiumGate>{/* page content */}</PremiumGate>

import React, { useRef, useState, useEffect } from "react";
import { usePremiumTier } from "../hooks/usePremiumTier";

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const { isPremium, loading } = usePremiumTier();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // While loading we show the content blurred to avoid flash‑of‑unlocked content.
  const shouldBlur = !isPremium;

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;

  const isSuperTiny = (height > 0 && height < 75) || (width > 0 && width < 100);
  const isTiny = (height > 0 && height < 130) || (width > 0 && width < 150);
  const isSmall = (height > 0 && height < 220) || (width > 0 && width < 220);

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(10, 10, 10, 0.8)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    backdropFilter: "blur(6px)",
    zIndex: 10,
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    padding: isSuperTiny ? "2px" : isTiny ? "4px" : isSmall ? "8px" : "16px",
    boxSizing: "border-box",
    overflow: "hidden",
  };

  const containerStyle: React.CSSProperties = {
    filter: shouldBlur ? "blur(8px)" : "none",
    pointerEvents: shouldBlur ? "none" : "auto",
    transition: "filter 0.3s ease",
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: "inherit" }}>
      <div style={containerStyle}>
        {children}
      </div>
      {shouldBlur && (
        <div style={overlayStyle}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "4px" }}>
            <span role="img" aria-label="lock" style={{ 
              fontSize: isSuperTiny ? "0.9rem" : isTiny ? "1.1rem" : isSmall ? "1.4rem" : "2.2rem", 
              marginBottom: isSuperTiny ? "0px" : isTiny ? "2px" : isSmall ? "4px" : "8px", 
              filter: "drop-shadow(0 0 10px rgba(218,242,100,0.3))",
              lineHeight: 1
            }}>🔒</span>
            
            {!isSuperTiny && (
              <h3 style={{ 
                fontSize: isTiny ? "0.7rem" : isSmall ? "0.8rem" : "1.1rem", 
                fontWeight: "700", 
                margin: 0, 
                color: "var(--accent, #daf264)",
                whiteSpace: "nowrap",
                lineHeight: 1.2
              }}>{isTiny ? "Premium" : "Premium Feature"}</h3>
            )}
            
            {!isSmall && (
              <p style={{ 
                fontSize: "0.8rem", 
                color: "var(--muted-fg, #888)", 
                maxWidth: "85%", 
                margin: "6px 0 0 0", 
                lineHeight: "1.3" 
              }}>
                Tier 2 Premium Feature
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PremiumGate;


