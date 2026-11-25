import { useEffect, useRef, useState } from 'react';
import type { AppCopy } from '../i18n/translations';
import type { GamepadInputState } from '../types';

interface GalacticShiftGameProps {
  copy: AppCopy;
  gamepadState: GamepadInputState;
  compact?: boolean;
  allowLocalKeyboard?: boolean;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  vrot: number;
  kind: 'rock' | 'core';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export function GalacticShiftGame({
  copy,
  gamepadState,
  compact = false,
  allowLocalKeyboard = false,
}: GalacticShiftGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<GamepadInputState>(gamepadState);
  const keysRef = useRef<Record<string, boolean>>({});

  const [hud, setHud] = useState({
    score: 0,
    level: 1,
    lives: 3,
    shieldPct: 100,
    paused: false,
    gameOver: false,
  });

  useEffect(() => {
    inputRef.current = gamepadState;
  }, [gamepadState]);

  useEffect(() => {
    if (!allowLocalKeyboard) return;
    const onDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [allowLocalKeyboard]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 800;
    const H = 450;
    canvas.width = W;
    canvas.height = H;

    let animId = 0;
    let lastTime = performance.now();

    const stars: Star[] = Array.from({ length: 65 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 25 + Math.random() * 90,
      size: 1 + Math.random() * 1.8,
      alpha: 0.25 + Math.random() * 0.65,
    }));

    const ship = {
      x: 130,
      y: H / 2,
      vx: 0,
      vy: 0,
      fireCd: 0,
      dashCd: 0,
      pulseCd: 0,
      shieldEnergy: 100,
      shieldActive: false,
      invuln: 0,
      pulseRadius: 0,
    };

    let bullets: Bullet[] = [];
    let asteroids: Asteroid[] = [];
    let particles: Particle[] = [];
    let score = 0;
    let level = 1;
    let lives = 3;
    let spawnTimer = 0;
    let paused = false;
    let gameOver = false;
    let prevStart = false;
    let prevSelect = false;
    let prevDash = false;
    let prevPulse = false;
    let hudSyncAccum = 0;

    const spawnBurst = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 60 + Math.random() * 170;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          color,
        });
      }
    };

    const resetGame = () => {
      ship.x = 130;
      ship.y = H / 2;
      ship.vx = 0;
      ship.vy = 0;
      ship.shieldEnergy = 100;
      ship.invuln = 1.2;
      ship.pulseRadius = 0;
      bullets = [];
      asteroids = [];
      particles = [];
      score = 0;
      level = 1;
      lives = 3;
      paused = false;
      gameOver = false;
      setHud({ score: 0, level: 1, lives: 3, shieldPct: 100, paused: false, gameOver: false });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const gp = inputRef.current;
      const k = keysRef.current;

      // Combine gamepad & optional local keyboard inputs
      let ax = gp.ax;
      let ay = gp.ay;
      if (gp.buttons.LEFT || k['ArrowLeft'] || k['KeyA']) ax = -1;
      if (gp.buttons.RIGHT || k['ArrowRight'] || k['KeyD']) ax = 1;
      if (gp.buttons.UP || k['ArrowUp'] || k['KeyW']) ay = -1;
      if (gp.buttons.DOWN || k['ArrowDown'] || k['KeyS']) ay = 1;

      const btnA = gp.buttons.A || gp.buttons.R2 || Boolean(k['KeyJ']) || Boolean(k['Space']);
      const btnB = gp.buttons.B || gp.buttons.L2 || Boolean(k['KeyK']);
      const btnX = gp.buttons.X || gp.buttons.R1 || Boolean(k['KeyU']);
      const btnY = gp.buttons.Y || gp.buttons.L1 || Boolean(k['KeyI']);
      const btnStart = gp.buttons.START || Boolean(k['Enter']);
      const btnSelect = gp.buttons.SELECT || Boolean(k['ShiftLeft']) || Boolean(k['KeyR']);

      // Edge-triggered Start (pause/resume) & Select (restart)
      if (btnStart && !prevStart) {
        if (gameOver) {
          resetGame();
        } else {
          paused = !paused;
          setHud((h) => ({ ...h, paused }));
        }
      }
      if ((btnSelect && !prevSelect) || (gameOver && btnA)) {
        resetGame();
      }
      prevStart = btnStart;
      prevSelect = btnSelect;

      // Update starfield always for alive ambiance
      for (const s of stars) {
        s.x -= s.speed * dt * (paused ? 0.2 : 1 + level * 0.12);
        if (s.x < 0) {
          s.x = W + 4;
          s.y = Math.random() * H;
        }
      }

      if (!paused && !gameOver) {
        // Ship steering with smooth acceleration
        const accel = 1350;
        const drag = 0.88;
        ship.vx = (ship.vx + ax * accel * dt) * drag;
        ship.vy = (ship.vy + ay * accel * dt) * drag;

        // X Button: Hyper-Dash impulse
        if (btnX && !prevDash && ship.dashCd <= 0) {
          const dirX = Math.abs(ax) > 0.15 || Math.abs(ay) > 0.15 ? ax : 1;
          const dirY = Math.abs(ax) > 0.15 || Math.abs(ay) > 0.15 ? ay : 0;
          ship.vx += dirX * 560;
          ship.vy += dirY * 560;
          ship.dashCd = 0.7;
          ship.invuln = Math.max(ship.invuln, 0.25);
          spawnBurst(ship.x - 16, ship.y, '#38BDF8', 10);
        }
        prevDash = btnX;

        // Y Button: Nova Pulse shockwave
        if (btnY && !prevPulse && ship.pulseCd <= 0) {
          ship.pulseRadius = 18;
          ship.pulseCd = 3.2;
          spawnBurst(ship.x, ship.y, '#FBBF24', 18);
        }
        prevPulse = btnY;

        ship.x = Math.max(36, Math.min(W - 40, ship.x + ship.vx * dt));
        ship.y = Math.max(32, Math.min(H - 32, ship.y + ship.vy * dt));

        ship.fireCd = Math.max(0, ship.fireCd - dt);
        ship.dashCd = Math.max(0, ship.dashCd - dt);
        ship.pulseCd = Math.max(0, ship.pulseCd - dt);
        ship.invuln = Math.max(0, ship.invuln - dt);

        // B Button: Energy Shield
        if (btnB && ship.shieldEnergy > 8) {
          ship.shieldActive = true;
          ship.shieldEnergy = Math.max(0, ship.shieldEnergy - 45 * dt);
        } else {
          ship.shieldActive = false;
          ship.shieldEnergy = Math.min(100, ship.shieldEnergy + 18 * dt);
        }

        // A Button: Dual Plasma Fire
        if (btnA && ship.fireCd <= 0) {
          bullets.push({ x: ship.x + 22, y: ship.y - 8, vx: 640, vy: 0 });
          bullets.push({ x: ship.x + 22, y: ship.y + 8, vx: 640, vy: 0 });
          ship.fireCd = 0.14;
        }

        // Expand Nova Pulse
        if (ship.pulseRadius > 0) {
          ship.pulseRadius += 580 * dt;
          for (let i = asteroids.length - 1; i >= 0; i -= 1) {
            const a = asteroids[i];
            if (a.kind === 'rock') {
              const dist = Math.hypot(a.x - ship.x, a.y - ship.y);
              if (dist < ship.pulseRadius + a.r) {
                score += 60;
                spawnBurst(a.x, a.y, '#FBBF24', 10);
                asteroids.splice(i, 1);
              }
            }
          }
          if (ship.pulseRadius > 340) ship.pulseRadius = 0;
        }

        // Spawn asteroids & energy cores
        level = 1 + Math.floor(score / 600);
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const isCore = Math.random() < 0.24;
          asteroids.push({
            x: W + 30,
            y: 42 + Math.random() * (H - 84),
            vx: -(140 + Math.random() * 110 + level * 22),
            vy: (Math.random() - 0.5) * 45,
            r: isCore ? 12 : 16 + Math.random() * 16,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 2.5,
            kind: isCore ? 'core' : 'rock',
          });
          spawnTimer = Math.max(0.32, 0.92 - level * 0.06);
        }

        // Move bullets
        for (let i = bullets.length - 1; i >= 0; i -= 1) {
          const b = bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x > W + 20) bullets.splice(i, 1);
        }

        // Move asteroids & check collisions
        for (let i = asteroids.length - 1; i >= 0; i -= 1) {
          const a = asteroids[i];
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          a.rot += a.vrot * dt;

          if (a.y < a.r || a.y > H - a.r) a.vy *= -1;
          if (a.x < -50) {
            asteroids.splice(i, 1);
            continue;
          }

          // Bullet hits rock
          let destroyed = false;
          if (a.kind === 'rock') {
            for (let j = bullets.length - 1; j >= 0; j -= 1) {
              const b = bullets[j];
              if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + 6) {
                bullets.splice(j, 1);
                asteroids.splice(i, 1);
                score += 50;
                spawnBurst(a.x, a.y, '#FB923C', 10);
                destroyed = true;
                break;
              }
            }
          }
          if (destroyed) continue;

          // Ship collision
          const shipDist = Math.hypot(a.x - ship.x, a.y - ship.y);
          if (shipDist < a.r + (ship.shieldActive ? 28 : 17)) {
            if (a.kind === 'core') {
              score += 120;
              ship.shieldEnergy = Math.min(100, ship.shieldEnergy + 22);
              spawnBurst(a.x, a.y, '#10B981', 12);
              asteroids.splice(i, 1);
            } else if (ship.shieldActive) {
              score += 35;
              spawnBurst(a.x, a.y, '#38BDF8', 12);
              asteroids.splice(i, 1);
            } else if (ship.invuln <= 0) {
              lives -= 1;
              ship.invuln = 1.4;
              spawnBurst(ship.x, ship.y, '#F43F5E', 18);
              asteroids.splice(i, 1);
              if (lives <= 0) {
                gameOver = true;
              }
            }
          }
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i -= 1) {
          const p = particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) particles.splice(i, 1);
        }

        hudSyncAccum += dt;
        if (hudSyncAccum >= 0.12 || gameOver) {
          hudSyncAccum = 0;
          setHud({
            score,
            level,
            lives,
            shieldPct: Math.round(ship.shieldEnergy),
            paused,
            gameOver,
          });
        }
      }

      // --- Render Frame ---
      ctx.fillStyle = '#07090E';
      ctx.fillRect(0, 0, W, H);

      // Subtle horizon grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 80) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 75) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      // Stars
      for (const s of stars) {
        ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      // Nova pulse ring
      if (ship.pulseRadius > 0) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Bullets
      ctx.fillStyle = '#34D399';
      for (const b of bullets) {
        ctx.fillRect(b.x - 7, b.y - 2, 14, 4);
      }

      // Asteroids & Energy Cores
      for (const a of asteroids) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        if (a.kind === 'core') {
          ctx.fillStyle = '#10B981';
          ctx.strokeStyle = '#A7F3D0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -a.r);
          ctx.lineTo(a.r, 0);
          ctx.lineTo(0, a.r);
          ctx.lineTo(-a.r, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = '#262F40';
          ctx.strokeStyle = '#FB923C';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const sides = 7;
          for (let s = 0; s < sides; s += 1) {
            const ang = (s / sides) * Math.PI * 2;
            const rad = a.r * (s % 2 === 0 ? 1 : 0.8);
            const px = Math.cos(ang) * rad;
            const py = Math.sin(ang) * rad;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Particles
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;

      // Player Starfighter
      const blinkSkip = ship.invuln > 0 && Math.floor(ship.invuln * 14) % 2 === 0;
      if (!blinkSkip && !gameOver) {
        ctx.save();
        ctx.translate(ship.x, ship.y);

        // Thruster flame
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.moveTo(-18, -5);
        ctx.lineTo(-28 - Math.random() * 10, 0);
        ctx.lineTo(-18, 5);
        ctx.closePath();
        ctx.fill();

        // Hull
        ctx.fillStyle = '#E2E8F0';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-16, -14);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-16, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.ellipse(2, 0, 6, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Energy Shield
        if (ship.shieldActive) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
          ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 29, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#07090E]">
      {/* Clean Top HUD Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0F131C]/90 px-4 py-2 text-xs sm:text-sm">
        <div className="flex items-center gap-3 font-medium text-slate-200">
          <span className="font-semibold text-white">{copy.tv.gameTitle}</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-emerald-400">
            {copy.tv.score} {hud.score.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 font-mono-tabular">
          <span>
            {copy.tv.level} {hud.level}
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>
            {copy.tv.lives} {hud.lives}
          </span>
          {!compact && (
            <>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
              <span className="hidden sm:inline text-sky-400">
                {copy.tv.shieldReady} {hud.shieldPct}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Live 16:9 Game Canvas */}
      <div className={`relative w-full ${compact ? 'aspect-[16/7]' : 'aspect-video'}`}>
        <canvas ref={canvasRef} className="h-full w-full block object-cover" />

        {(hud.paused || hud.gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] px-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-white">
              {hud.gameOver ? copy.tv.gameOver : copy.tv.paused}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
              {hud.gameOver ? copy.tv.pressSelectRestart : copy.tv.pressStart}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
