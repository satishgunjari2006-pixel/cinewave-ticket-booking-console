import React, { useState, useEffect } from 'react';

export function TheatreCurtain({ isAnimating }) {
  // Opening curtain reveal on initial page load / refresh
  const [initialOpening, setInitialOpening] = useState(true);

  useEffect(() => {
    // Smooth, cinematic opening reveal on initial load
    const timer = setTimeout(() => {
      setInitialOpening(false);
    }, 1250);
    return () => clearTimeout(timer);
  }, []);

  if (!isAnimating && !initialOpening) return null;

  const modeClass = initialOpening ? 'curtain-opening-mode' : 'curtain-cycle-mode';

  return (
    <div className="theatre-curtain-overlay" aria-hidden="true">
      {/* Left Velvet Curtain Panel */}
      <div className={`curtain-panel curtain-left ${modeClass}`}>
        <div className="curtain-folds" />
        <div className="curtain-valance-fringe" />
      </div>

      {/* Right Velvet Curtain Panel */}
      <div className={`curtain-panel curtain-right ${modeClass}`}>
        <div className="curtain-folds" />
        <div className="curtain-valance-fringe" />
      </div>
    </div>
  );
}
