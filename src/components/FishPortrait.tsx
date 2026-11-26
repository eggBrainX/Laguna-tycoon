import React, { useEffect, useRef } from 'react';
import { drawSemiRealisticFishCanvas } from '../game/fishRenderer';
import { BodyPart, Fin, SickType, Stage } from '../game/types';

interface FishPortraitProps {
  body: BodyPart;
  fin: Fin;
  stage?: Stage;
  sick?: SickType | null;
  isMagic?: boolean;
  isPregnant?: boolean;
  silhouette?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const FishPortrait: React.FC<FishPortraitProps> = ({
  body,
  fin,
  stage = Stage.ADULT,
  sick = null,
  isMagic = false,
  isPregnant = false,
  silhouette = false,
  width = 110,
  height = 68,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(width * 0.56, height * 0.5);

    const baseScale = Math.min(width / 106, height / 74);
    drawSemiRealisticFishCanvas(ctx, {
      body,
      fin,
      stage,
      sick: silhouette ? null : sick,
      isMagic: silhouette ? false : isMagic,
      isPregnant: silhouette ? false : isPregnant,
      swimPhase: 0.4,
      scale: baseScale,
      facingLeft: false,
    });

    if (silhouette) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(-width, -height, width * 2, height * 2);
    }

    ctx.restore();
  }, [body, fin, stage, sick, isMagic, isPregnant, silhouette, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
};
