import { BODY_PALETTE } from './config';
import { BodyPart, Fin, SickType, Stage } from './types';

export interface FishRenderOptions {
  body: BodyPart;
  fin: Fin;
  stage: Stage;
  sick?: SickType | null;
  isMagic?: boolean;
  isPregnant?: boolean;
  swimPhase?: number; // radians for tail & body wave
  scale?: number;
  facingLeft?: boolean;
}

export function getStageVisualScale(stage: Stage): number {
  switch (stage) {
    case Stage.BABY:
      return 0.44;
    case Stage.CHILD:
      return 0.62;
    case Stage.TEEN:
      return 0.80;
    case Stage.ADULT:
      return 1.0;
    case Stage.OLD:
      return 1.14;
  }
}

/**
 * Draws a semi-realistic layered fish (Tail fin + Body + Markings + Fins + Eye + Status effects)
 * centered at (0, 0) facing RIGHT on a Canvas2D context.
 */
export function drawSemiRealisticFishCanvas(
  ctx: CanvasRenderingContext2D,
  opts: FishRenderOptions
) {
  const {
    body,
    fin,
    stage,
    sick = null,
    isMagic = false,
    isPregnant = false,
    swimPhase = 0,
    scale = 1,
    facingLeft = false,
  } = opts;

  const isBaby = stage === Stage.BABY;
  const stageScale = getStageVisualScale(stage) * scale;
  const palette = BODY_PALETTE[body];
  const tailWag = Math.sin(swimPhase) * 0.24;
  const bodyBob = Math.sin(swimPhase * 0.5) * 1.2;

  ctx.save();
  if (facingLeft) {
    ctx.scale(-stageScale, stageScale);
  } else {
    ctx.scale(stageScale, stageScale);
  }
  ctx.translate(0, bodyBob);

  // Magic aura
  if (isMagic) {
    const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, 42);
    grad.addColorStop(0, 'rgba(253, 224, 71, 0.36)');
    grad.addColorStop(0.55, 'rgba(250, 204, 21, 0.12)');
    grad.addColorStop(0.92, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  const tailAttachX = body === BodyPart.DISCUS || body === BodyPart.ANGELFISH ? -22 : -26;
  const finColor = isBaby ? 'rgba(241, 245, 249, 0.7)' : palette.motif;
  const finLight = isBaby ? 'rgba(255, 255, 255, 0.88)' : palette.motifLight;

  // 1. TAIL FIN LAYER (tinted with species motif color, semi-transparent with fin rays)
  ctx.save();
  ctx.translate(tailAttachX, 0);
  ctx.rotate(tailWag);
  ctx.globalAlpha = isBaby ? 0.68 : 0.88;

  const drawFinRays = (angles: number[], len: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 0.8;
    for (const a of angles) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-Math.cos(a) * len, Math.sin(a) * len);
      ctx.stroke();
    }
  };

  const tailGrad = ctx.createLinearGradient(0, -16, -34, 16);
  tailGrad.addColorStop(0, finColor);
  tailGrad.addColorStop(1, finLight);
  ctx.fillStyle = tailGrad;

  if (fin === Fin.ROUND) {
    ctx.beginPath();
    ctx.moveTo(2, -4);
    ctx.bezierCurveTo(-12, -16, -24, -14, -24, 0);
    ctx.bezierCurveTo(-24, 14, -12, 16, 2, 4);
    ctx.closePath();
    ctx.fill();
    drawFinRays([-0.42, -0.2, 0, 0.2, 0.42], 21);
  } else if (fin === Fin.FAN) {
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.quadraticCurveTo(-18, -22, -28, -16);
    ctx.quadraticCurveTo(-22, 0, -28, 16);
    ctx.quadraticCurveTo(-18, 22, 2, 3);
    ctx.closePath();
    ctx.fill();
    drawFinRays([-0.55, -0.28, 0, 0.28, 0.55], 25);
  } else if (fin === Fin.SPIKY) {
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.lineTo(-22, -18);
    ctx.lineTo(-14, -6);
    ctx.lineTo(-28, 0);
    ctx.lineTo(-14, 6);
    ctx.lineTo(-22, 18);
    ctx.lineTo(2, 3);
    ctx.closePath();
    ctx.fill();
    drawFinRays([-0.52, 0, 0.52], 22);
  } else if (fin === Fin.LONG) {
    ctx.beginPath();
    ctx.moveTo(2, -4);
    ctx.bezierCurveTo(-14, -18, -36, -20, -42, -8);
    ctx.bezierCurveTo(-30, -2, -30, 2, -42, 8);
    ctx.bezierCurveTo(-36, 20, -14, 18, 2, 4);
    ctx.closePath();
    ctx.fill();
    drawFinRays([-0.32, -0.14, 0, 0.14, 0.32], 36);
  } else {
    // TWIN
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.bezierCurveTo(-12, -18, -28, -22, -32, -10);
    ctx.bezierCurveTo(-22, -4, -14, -2, -10, 0);
    ctx.bezierCurveTo(-14, 2, -22, 4, -32, 10);
    ctx.bezierCurveTo(-28, 22, -12, 18, 2, 3);
    ctx.closePath();
    ctx.fill();
    drawFinRays([-0.52, -0.35, 0.35, 0.52], 26);
  }
  ctx.restore();

  // 2. DORSAL & VENTRAL ACCENT FINS (subtle anatomical realism)
  if (!isBaby) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = palette.motifLight;
    if (body === BodyPart.ANGELFISH) {
      // Tall triangular dorsal & ventral fins
      ctx.beginPath();
      ctx.moveTo(-6, -15);
      ctx.quadraticCurveTo(-12, -32, -18, -10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, 15);
      ctx.quadraticCurveTo(-10, 32, -16, 10);
      ctx.closePath();
      ctx.fill();
    } else if (body === BodyPart.BETTA) {
      ctx.beginPath();
      ctx.moveTo(2, -11);
      ctx.quadraticCurveTo(-14, -24, -22, -8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2, 10);
      ctx.quadraticCurveTo(-16, 24, -22, 8);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.quadraticCurveTo(-10, -20, -16, -9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. BODY LAYER (6 distinct realistic body silhouettes)
  ctx.save();
  const bodyGrad = ctx.createLinearGradient(0, -22, 0, 22);
  if (isBaby) {
    bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    bodyGrad.addColorStop(0.6, 'rgba(226, 232, 240, 0.78)');
    bodyGrad.addColorStop(1, 'rgba(203, 213, 225, 0.64)');
  } else {
    bodyGrad.addColorStop(0, palette.mainDark);
    bodyGrad.addColorStop(0.45, palette.main);
    bodyGrad.addColorStop(1, palette.mainLight);
  }
  ctx.fillStyle = bodyGrad;

  const traceBodyPath = () => {
    ctx.beginPath();
    if (body === BodyPart.DISCUS) {
      // Deep circular disc silhouette
      ctx.moveTo(25, 1);
      ctx.bezierCurveTo(22, -20, -12, -24, -23, -4);
      ctx.lineTo(-23, 4);
      ctx.bezierCurveTo(-12, 24, 22, 20, 25, 1);
    } else if (body === BodyPart.ANGELFISH) {
      // Tall diamond/triangular angelfish silhouette
      ctx.moveTo(24, 0);
      ctx.bezierCurveTo(14, -18, -4, -24, -22, -6);
      ctx.lineTo(-22, 6);
      ctx.bezierCurveTo(-4, 24, 14, 18, 24, 0);
    } else if (body === BodyPart.TETRA) {
      // Sleek torpedo tetra silhouette
      ctx.moveTo(27, 0);
      ctx.bezierCurveTo(18, -11, -10, -12, -26, -3);
      ctx.lineTo(-26, 3);
      ctx.bezierCurveTo(-10, 12, 18, 11, 27, 0);
    } else if (body === BodyPart.GUPPY) {
      // Slender guppy silhouette with tapered peduncle
      ctx.moveTo(23, -1);
      ctx.bezierCurveTo(14, -10, -6, -9, -26, -3);
      ctx.lineTo(-26, 3);
      ctx.bezierCurveTo(-6, 11, 14, 10, 23, -1);
    } else if (body === BodyPart.KOI) {
      // Elongated robust koi carp silhouette
      ctx.moveTo(29, 2);
      ctx.bezierCurveTo(24, -13, -6, -14, -27, -4);
      ctx.lineTo(-27, 4);
      ctx.bezierCurveTo(-6, 15, 22, 14, 29, 2);
    } else {
      // BETTA: strong-jawed fighting fish silhouette
      ctx.moveTo(26, -1);
      ctx.bezierCurveTo(17, -12, -8, -13, -26, -4);
      ctx.lineTo(-26, 4);
      ctx.bezierCurveTo(-8, 13, 17, 13, 26, -1);
    }
    ctx.closePath();
  };

  traceBodyPath();
  ctx.fill();

  // Clip inside body for realistic markings & scale sheen
  ctx.save();
  traceBodyPath();
  ctx.clip();

  if (!isBaby) {
    ctx.fillStyle = palette.motif;
    ctx.strokeStyle = palette.motif;
    if (body === BodyPart.DISCUS) {
      // Blue wavy stripes
      ctx.lineWidth = 2.4;
      ctx.globalAlpha = 0.72;
      for (let x = -14; x <= 14; x += 7) {
        ctx.beginPath();
        ctx.moveTo(x, -22);
        ctx.bezierCurveTo(x + 4, -8, x - 4, 8, x, 22);
        ctx.stroke();
      }
    } else if (body === BodyPart.TETRA) {
      // Red neon flank stripe
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(14, 1);
      ctx.quadraticCurveTo(-5, 3, -25, 1);
      ctx.lineTo(-25, 5);
      ctx.quadraticCurveTo(-5, 7, 14, 4);
      ctx.closePath();
      ctx.fill();
    } else if (body === BodyPart.ANGELFISH) {
      // Dark purple vertical bands
      ctx.globalAlpha = 0.78;
      for (const bx of [-12, -2, 8]) {
        ctx.fillRect(bx, -24, 4.5, 48);
      }
    } else if (body === BodyPart.GUPPY) {
      // Yellow speckles
      ctx.globalAlpha = 0.85;
      const dots = [
        [-16, -2, 2.2],
        [-10, 3, 2.5],
        [-4, -4, 2],
        [2, 2, 2.1],
        [-19, 2, 1.8],
      ];
      for (const [dx, dy, r] of dots) {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (body === BodyPart.KOI) {
      // Crimson koi patches
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.ellipse(-6, -4, 9, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, -2, 6, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-18, 3, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (body === BodyPart.BETTA) {
      // Dark purple rear shading
      const bGrad = ctx.createLinearGradient(8, 0, -26, 0);
      bGrad.addColorStop(0, 'rgba(88, 28, 135, 0)');
      bGrad.addColorStop(1, 'rgba(88, 28, 135, 0.85)');
      ctx.fillStyle = bGrad;
      ctx.fillRect(-28, -16, 40, 32);
    }
  }

  // Glossy top rim highlight (semi-realistic depth)
  const sheen = ctx.createLinearGradient(0, -20, 0, 2);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(-30, -24, 62, 20);

  // Subtle scale shimmer arcs (not on baby)
  if (!isBaby) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 0.8;
    for (let sx = -14; sx <= 6; sx += 5) {
      for (let sy = -5; sy <= 5; sy += 5) {
        ctx.beginPath();
        ctx.arc(sx, sy, 2.4, -0.8, 0.8);
        ctx.stroke();
      }
    }
  }

  // Sick: Fungus (fuzzy green patches)
  if (sick === 'FUNGUS') {
    ctx.fillStyle = 'rgba(132, 204, 22, 0.82)';
    ctx.beginPath();
    ctx.arc(-5, -4, 4.5, 0, Math.PI * 2);
    ctx.arc(4, 3, 3.8, 0, Math.PI * 2);
    ctx.arc(-14, 2, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Body subtle outline for contrast against deep water
  ctx.strokeStyle = isBaby ? 'rgba(255, 255, 255, 0.55)' : 'rgba(15, 23, 42, 0.38)';
  ctx.lineWidth = 1;
  traceBodyPath();
  ctx.stroke();
  ctx.restore();

  // Gill plate curve
  const headX = body === BodyPart.KOI ? 14 : 11;
  ctx.strokeStyle = isBaby ? 'rgba(148, 163, 184, 0.45)' : 'rgba(15, 23, 42, 0.32)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(headX - 3, 1, 7, -0.9, 0.9);
  ctx.stroke();

  // Pectoral fin (fluttering gently)
  ctx.save();
  ctx.translate(headX - 6, 4);
  ctx.rotate(Math.sin(swimPhase * 1.4) * 0.25);
  ctx.fillStyle = isBaby ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.34)';
  ctx.beginPath();
  ctx.ellipse(-4, 2, 6, 3.2, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Realistic eye with iris + pupil + specular highlight
  const eyeX = body === BodyPart.KOI ? 19 : 16;
  const eyeY = -2;
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = isBaby ? '#334155' : '#0F172A';
  ctx.beginPath();
  ctx.arc(eyeX + 0.4, eyeY, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX + 1.1, eyeY - 0.9, 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Sick: Ich (white spots on tail/fins)
  if (sick === 'ICH') {
    ctx.fillStyle = '#FFFFFF';
    const ichSpots = [
      [tailAttachX - 10, -5],
      [tailAttachX - 16, 4],
      [tailAttachX - 12, 0],
      [-4, -12],
      [2, 9],
    ];
    for (const [ix, iy] of ichSpots) {
      ctx.beginPath();
      ctx.arc(ix, iy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pregnant belly roe indicator
  if (isPregnant) {
    ctx.fillStyle = 'rgba(253, 224, 71, 0.9)';
    ctx.beginPath();
    ctx.arc(-2, 7, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(-3, 6.5, 1.1, 0, Math.PI * 2);
    ctx.arc(-1, 7.8, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
