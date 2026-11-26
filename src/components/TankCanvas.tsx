import React, { useEffect, useRef } from 'react';
import { drawSemiRealisticFishCanvas, getStageVisualScale } from '../game/fishRenderer';
import { formatSpeciesName, STAGE_NAMES, UI_TEXT } from '../game/strings';
import { EggType, FeedType, Fish, Language, TankUpgradeId } from '../game/types';

export type PendingDrop =
  | { kind: 'egg'; eggType: EggType }
  | { kind: 'feed'; feedType: FeedType }
  | null;

interface SwimState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  phase: number;
  facingLeft: boolean;
}

interface Pellet {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  wobble: number;
}

interface TankCanvasProps {
  fishList: Fish[];
  selectedFishIds: string[];
  tankUpgrades: TankUpgradeId[];
  pendingDrop: PendingDrop;
  lang: Language;
  onSelectFish: (fishId: string) => void;
  onDropAtWater: (xNorm: number, yNorm: number) => void;
}

export const TankCanvas: React.FC<TankCanvasProps> = ({
  fishList,
  selectedFishIds,
  tankUpgrades,
  pendingDrop,
  lang,
  onSelectFish,
  onDropAtWater,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Latest props in refs so 60fps loop never restarts on React state updates
  const propsRef = useRef({
    fishList,
    selectedFishIds,
    tankUpgrades,
    pendingDrop,
    lang,
    onSelectFish,
    onDropAtWater,
  });
  propsRef.current = {
    fishList,
    selectedFishIds,
    tankUpgrades,
    pendingDrop,
    lang,
    onSelectFish,
    onDropAtWater,
  };

  const swimMapRef = useRef<Map<string, SwimState>>(new Map());
  const pelletsRef = useRef<Pellet[]>(
    Array.from({ length: 48 }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: 0,
      color: '#F59E0B',
      radius: 3,
      life: 0,
    }))
  );
  const bubblesRef = useRef<Bubble[]>(
    Array.from({ length: 34 }, (_, i) => ({
      x: (i * 0.031 + 0.05) % 1,
      y: (i * 0.073) % 1,
      r: 1.5 + (i % 4) * 1.1,
      vy: 0.02 + (i % 5) * 0.008,
      wobble: i * 0.9,
    }))
  );
  const sizeRef = useRef({ w: 960, h: 520 });

  // Sync swim state map whenever fishList changes
  useEffect(() => {
    const map = swimMapRef.current;
    const activeIds = new Set(fishList.map((f) => f.id));
    for (const key of map.keys()) {
      if (!activeIds.has(key)) map.delete(key);
    }
    const { w, h } = sizeRef.current;
    for (const f of fishList) {
      if (!map.has(f.id)) {
        const x = 90 + Math.random() * Math.max(200, w - 180);
        const y = 85 + Math.random() * Math.max(150, h - 185);
        const goLeft = Math.random() < 0.5;
        map.set(f.id, {
          x,
          y,
          vx: goLeft ? -22 : 22,
          vy: (Math.random() - 0.5) * 8,
          targetX: 90 + Math.random() * Math.max(200, w - 180),
          targetY: 85 + Math.random() * Math.max(150, h - 185),
          phase: Math.random() * Math.PI * 2,
          facingLeft: goLeft,
        });
      }
    }
  }, [fishList]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      sizeRef.current = { w, h };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();

    const renderFrame = (t: number) => {
      const dt = Math.min((t - lastTime) / 1000, 0.05);
      lastTime = t;
      const { w, h } = sizeRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      const { fishList: fishes, selectedFishIds: selIds, tankUpgrades: ups, lang: curLang } =
        propsRef.current;
      const nowEpoch = Date.now();

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Deep Tropical Lagoon Water Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0C4A6E');
      bgGrad.addColorStop(0.28, '#083352');
      bgGrad.addColorStop(0.75, '#052036');
      bgGrad.addColorStop(1, '#031524');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Volumetric Sun Rays (God Rays)
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const rayX = w * (0.16 + i * 0.22) + Math.sin(t * 0.0003 + i) * 18;
        const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 90, h * 0.85);
        rayGrad.addColorStop(0, 'rgba(186, 230, 253, 0.14)');
        rayGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.04)');
        rayGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rayX - 30, 0);
        ctx.lineTo(rayX + 45, 0);
        ctx.lineTo(rayX + 165, h * 0.88);
        ctx.lineTo(rayX + 20, h * 0.88);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 3. Water Surface Shimmer
      ctx.save();
      const surfGrad = ctx.createLinearGradient(0, 0, 0, 26);
      surfGrad.addColorStop(0, 'rgba(186, 230, 253, 0.26)');
      surfGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = surfGrad;
      ctx.fillRect(0, 0, w, 26);

      ctx.strokeStyle = 'rgba(224, 242, 254, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 24) {
        const wy = 8 + Math.sin(x * 0.02 + t * 0.002) * 2.2;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
      ctx.restore();

      // 4. Natural Sandy Floor & Smooth River Stones
      const floorY = h - 46;
      const sandGrad = ctx.createLinearGradient(0, floorY - 12, 0, h);
      sandGrad.addColorStop(0, '#927954');
      sandGrad.addColorStop(0.4, '#786140');
      sandGrad.addColorStop(1, '#4C3D28');
      ctx.fillStyle = sandGrad;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.quadraticCurveTo(w * 0.28, floorY - 10, w * 0.55, floorY + 4);
      ctx.quadraticCurveTo(w * 0.8, floorY + 12, w, floorY - 4);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // River stones
      const stones = [
        [w * 0.14, h - 28, 28, 13, '#475569'],
        [w * 0.19, h - 22, 18, 9, '#64748B'],
        [w * 0.52, h - 24, 34, 14, '#334155'],
        [w * 0.84, h - 26, 26, 12, '#475569'],
      ] as const;
      for (const [sx, sy, rx, ry, col] of stones) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.ellipse(sx - rx * 0.2, sy - ry * 0.3, rx * 0.5, ry * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Swaying Aquatic Plants + Purchased Laguna Plants
      const drawPlant = (baseX: number, blades: number, heightPx: number, colorA: string, colorB: string) => {
        for (let b = 0; b < blades; b++) {
          const offset = (b - (blades - 1) / 2) * 8;
          const sway = Math.sin(t * 0.0014 + baseX * 0.02 + b * 0.7) * 14;
          const bh = heightPx * (0.72 + (b % 3) * 0.14);
          ctx.strokeStyle = b % 2 === 0 ? colorA : colorB;
          ctx.lineWidth = 4.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(baseX + offset, floorY + 8);
          ctx.quadraticCurveTo(
            baseX + offset + sway * 0.45,
            floorY - bh * 0.5,
            baseX + offset + sway,
            floorY - bh
          );
          ctx.stroke();
        }
      };

      drawPlant(w * 0.08, 4, 115, '#15803D', '#22C55E');
      drawPlant(w * 0.88, 5, 130, '#166534', '#16A34A');
      drawPlant(w * 0.93, 3, 85, '#0F766E', '#14B8A6');

      if (ups.includes('PLANT_NUTRITION')) drawPlant(w * 0.27, 4, 95, '#65A30D', '#84CC16');
      if (ups.includes('PLANT_INCUBATION')) drawPlant(w * 0.42, 4, 100, '#0D9488', '#2DD4BF');
      if (ups.includes('PLANT_MEDICINE')) drawPlant(w * 0.65, 4, 98, '#BE185D', '#F472B6');
      if (ups.includes('PLANT_FERTILE')) drawPlant(w * 0.76, 5, 115, '#D97706', '#FBBF24');

      // Subtle Tank Upgrades visual props
      if (ups.includes('CLEANING_SNAIL')) {
        const snailX = ((t * 0.008) % (w * 0.7)) + w * 0.15;
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(snailX, floorY + 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDE68A';
        ctx.beginPath();
        ctx.arc(snailX + 5, floorY + 7, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ups.includes('GOLDEN_SEAHORSE')) {
        const shY = floorY - 70 + Math.sin(t * 0.002) * 8;
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.ellipse(w * 0.12, shY, 5, 11, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.12 + 2, shY - 12, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Rising Bubbles (extra stream if Aeration installed)
      const bubbles = bubblesRef.current;
      const bubbleCount = ups.includes('AERATION') ? bubbles.length : 18;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.fillStyle = 'rgba(224, 242, 254, 0.16)';
      ctx.lineWidth = 1;
      for (let i = 0; i < bubbleCount; i++) {
        const b = bubbles[i];
        b.y -= b.vy * dt;
        if (b.y < 0.02) {
          b.y = 0.92;
          b.x = i >= 18 ? 0.85 + Math.sin(i) * 0.03 : ((i * 0.055 + 0.05) % 0.9) + 0.05;
        }
        const bx = b.x * w + Math.sin(t * 0.003 + b.wobble) * 5;
        const by = b.y * h;
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // 7. Sinking Food Pellets / Roe Beads
      const pellets = pelletsRef.current;
      let activeFoodTarget: { x: number; y: number } | null = null;
      for (let i = 0; i < pellets.length; i++) {
        const p = pellets[i];
        if (!p.active) continue;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0 || p.y > floorY + 4) {
          p.active = false;
          continue;
        }
        if (!activeFoodTarget) activeFoodTarget = { x: p.x, y: p.y };
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // 8. Update & Draw Swimming Fish
      const swimMap = swimMapRef.current;
      for (const f of fishes) {
        const sw = swimMap.get(f.id);
        if (!sw) continue;

        // If food is sinking, hungry fish swim gently toward it
        if (activeFoodTarget && f.fed < 92 && Math.hypot(activeFoodTarget.x - sw.x, activeFoodTarget.y - sw.y) < 280) {
          sw.targetX = activeFoodTarget.x;
          sw.targetY = activeFoodTarget.y;
        } else if (Math.hypot(sw.targetX - sw.x, sw.targetY - sw.y) < 28) {
          sw.targetX = 75 + Math.random() * Math.max(180, w - 150);
          sw.targetY = 65 + Math.random() * Math.max(120, h - 150);
        }

        const dx = sw.targetX - sw.x;
        const dy = sw.targetY - sw.y;
        const dist = Math.hypot(dx, dy) || 1;
        const baseSpeed = f.sick ? 15 : activeFoodTarget ? 38 : 24;
        const desiredVx = (dx / dist) * baseSpeed;
        const desiredVy = (dy / dist) * (baseSpeed * 0.65);

        sw.vx += (desiredVx - sw.vx) * Math.min(1, dt * 1.8);
        sw.vy += (desiredVy - sw.vy) * Math.min(1, dt * 1.8);

        sw.x = Math.max(55, Math.min(w - 55, sw.x + sw.vx * dt));
        sw.y = Math.max(52, Math.min(floorY - 22, sw.y + sw.vy * dt));

        if (Math.abs(sw.vx) > 2.5) {
          sw.facingLeft = sw.vx < 0;
        }
        const speedMag = Math.hypot(sw.vx, sw.vy);
        sw.phase += dt * (2.8 + speedMag * 0.14);

        const isSelected = selIds.includes(f.id);
        const visualRadius = 32 * getStageVisualScale(f.stage);

        // Selection ring
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.ellipse(sw.x, sw.y, visualRadius + 10, visualRadius * 0.72 + 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.translate(sw.x, sw.y);
        drawSemiRealisticFishCanvas(ctx, {
          body: f.body,
          fin: f.fin,
          stage: f.stage,
          sick: f.sick,
          isMagic: f.isMagic,
          isPregnant: f.pregnantRemainingMs !== null,
          swimPhase: sw.phase,
          scale: 1,
          facingLeft: sw.facingLeft,
        });
        ctx.restore();

        // Brief status label (±3 seconds only per §4)
        if (nowEpoch < f.statusBannerUntil) {
          let label = UI_TEXT.healthy[curLang];
          let bg = 'rgba(16, 185, 129, 0.88)';
          if (f.sick === 'FUNGUS') {
            label = UI_TEXT.sickFungus[curLang];
            bg = 'rgba(220, 38, 38, 0.9)';
          } else if (f.sick === 'ICH') {
            label = UI_TEXT.sickIch[curLang];
            bg = 'rgba(220, 38, 38, 0.9)';
          } else if (f.pregnantRemainingMs !== null) {
            label = UI_TEXT.pregnant[curLang];
            bg = 'rgba(217, 119, 6, 0.92)';
          }

          ctx.save();
          ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
          const tw = ctx.measureText(label).width;
          const bw = tw + 14;
          const bx = sw.x - bw / 2;
          const by = sw.y - visualRadius - 24;
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, 17, 6);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, sw.x, by + 8.5);
          ctx.restore();
        }
      }

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const spawnPellets = (x: number, y: number, drop: PendingDrop) => {
    if (!drop) return;
    const pellets = pelletsRef.current;
    const count = drop.kind === 'egg' ? 12 : 9;
    const color =
      drop.kind === 'egg'
        ? drop.eggType === 'COMMON'
          ? '#F472B6'
          : drop.eggType === 'PREMIUM'
            ? '#FBBF24'
            : '#C084FC'
        : drop.feedType === 'PREMIUM'
          ? '#FBBF24'
          : '#A16207';

    let spawned = 0;
    for (let i = 0; i < pellets.length && spawned < count; i++) {
      if (!pellets[i].active) {
        pellets[i] = {
          active: true,
          x: x + (Math.random() - 0.5) * 34,
          y: Math.max(12, y + (Math.random() - 0.5) * 14),
          vy: drop.kind === 'egg' ? 52 + Math.random() * 18 : 34 + Math.random() * 16,
          color,
          radius: drop.kind === 'egg' ? 3.6 : 2.8,
          life: drop.kind === 'egg' ? 1.8 : 4.5,
        };
        spawned += 1;
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (pendingDrop) {
      spawnPellets(x, y, pendingDrop);
      onDropAtWater(x / rect.width, y / rect.height);
      return;
    }

    // Hit-test fish (prefer topmost / closest)
    let bestId: string | null = null;
    let bestDist = Infinity;
    for (let i = fishList.length - 1; i >= 0; i--) {
      const f = fishList[i];
      const sw = swimMapRef.current.get(f.id);
      if (!sw) continue;
      const r = Math.max(26, 36 * getStageVisualScale(f.stage));
      const d = Math.hypot(x - sw.x, y - sw.y);
      if (d <= r && d < bestDist) {
        bestDist = d;
        bestId = f.id;
      }
    }

    if (bestId) {
      onSelectFish(bestId);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl border border-sky-400/20 shadow-[inset_0_0_50px_rgba(2,17,29,0.8)]"
    >
      <canvas
        ref={canvasRef}
        data-testid="tank-canvas"
        onPointerDown={handlePointerDown}
        className={`w-full h-full block ${pendingDrop ? 'cursor-crosshair' : 'cursor-pointer'}`}
      />

      {/* Pending Drop Hint Banner */}
      {pendingDrop && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-slate-900/85 border border-sky-400/40 text-xs font-medium text-sky-100 shadow-lg">
          {pendingDrop.kind === 'egg'
            ? lang === 'id'
              ? 'Ketuk permukaan air untuk menetaskan telur!'
              : 'Click the water surface to hatch the roe!'
            : lang === 'id'
              ? 'Ketuk air untuk menebar pakan!'
              : 'Click the water to drop fish food!'}
        </div>
      )}

      {/* Accessible Fish Selection Strip (compact bottom-left quick selector for keyboard & screen readers) */}
      {fishList.length > 0 && (
        <div
          aria-label={lang === 'id' ? 'Daftar ikan di tank' : 'Fish in tank'}
          className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 max-w-[65%] pointer-events-auto"
        >
          {fishList.map((f, idx) => {
            const selected = selectedFishIds.includes(f.id);
            const label = `${formatSpeciesName(f.body, f.fin, lang)} (${STAGE_NAMES[f.stage][lang]})`;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFish(f.id)}
                aria-label={`${lang === 'id' ? 'Pilih ikan' : 'Select fish'} ${idx + 1}: ${label}`}
                aria-pressed={selected}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  selected
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow'
                    : 'bg-slate-950/55 text-slate-200/85 hover:bg-slate-900/85 border border-white/10'
                }`}
              >
                {f.isMagic ? '★ ' : ''}
                {formatSpeciesName(f.body, f.fin, lang)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
