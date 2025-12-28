
import React, { useEffect, useRef, useState } from 'react';
import { Player, Collectible } from '../types';
import { 
  SHIP_RADIUS, SHIP_ACCELERATION, SHIP_FRICTION, ROTATION_SPEED,
  MAX_COLLECTIBLES, COLLECTIBLE_SPAWN_RATE
} from '../constants';

interface GameCanvasProps {
  players: Player[];
  onGameOver: (finalPlayers: Player[]) => void;
  onScoreUpdate: (players: Player[]) => void;
  duration: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ players, onGameOver, onScoreUpdate, duration }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<Player[]>(players);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const joystick = useRef({ active: false, startX: 0, startY: 0, currX: 0, currY: 0 });
  const thrustActive = useRef(false);
  // Fixed: Added initial value 0 to useRef<number> to satisfy TypeScript requirement of 1 argument.
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onGameOver(gameState);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    const spawner = setInterval(() => {
      setCollectibles(prev => {
        if (prev.length >= MAX_COLLECTIBLES + (timeLeft < 30 ? 5 : 0)) return prev;
        const rand = Math.random();
        let type: Collectible['type'] = 'STAR';
        let points = 10;
        let radius = 5;
        if (rand > 0.9) { type = 'SUPERNOVA'; points = 150; radius = 12; }
        else if (rand > 0.7) { type = 'NEBULA'; points = 40; radius = 8; }
        else if (rand < 0.1) { type = 'VOID'; points = -50; radius = 10; }

        return [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * (dimensions.width - 40) + 20,
          y: Math.random() * (dimensions.height - 40) + 20,
          type, points, radius, createdAt: Date.now()
        }];
      });
    }, timeLeft < 30 ? 600 : 1200);
    return () => clearInterval(spawner);
  }, [timeLeft, dimensions]);

  const update = () => {
    setGameState(prev => prev.map(p => {
      let { x, y, angle, velocity, score } = p;
      if (p.id === 'p0') {
        if (joystick.current.active) {
          const dx = joystick.current.currX - joystick.current.startX;
          const dy = joystick.current.currY - joystick.current.startY;
          if (Math.hypot(dx, dy) > 5) angle = Math.atan2(dy, dx);
        }
        if (thrustActive.current) {
          velocity.x += Math.cos(angle) * SHIP_ACCELERATION;
          velocity.y += Math.sin(angle) * SHIP_ACCELERATION;
        }
      } else {
        const target = collectibles.reduce((best, curr) => {
          if (curr.type === 'VOID') return best;
          if (!best) return curr;
          return curr.points > best.points ? curr : (Math.hypot(curr.x-x, curr.y-y) < Math.hypot(best.x-x, best.y-y) ? curr : best);
        }, null as Collectible | null);
        if (target) {
          const targetAngle = Math.atan2(target.y - y, target.x - x);
          angle += Math.sign(Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle))) * (ROTATION_SPEED * 0.8);
          velocity.x += Math.cos(angle) * (SHIP_ACCELERATION * 0.8);
          velocity.y += Math.sin(angle) * (SHIP_ACCELERATION * 0.8);
        }
      }

      velocity.x *= SHIP_FRICTION; velocity.y *= SHIP_FRICTION;
      x += velocity.x; y += velocity.y;
      if (x < 0) x = dimensions.width; if (x > dimensions.width) x = 0;
      if (y < 0) y = dimensions.height; if (y > dimensions.height) y = 0;

      setCollectibles(prevC => prevC.filter(c => {
        if (Math.hypot(c.x - x, c.y - y) < SHIP_RADIUS + c.radius) {
          score += c.points; return false;
        }
        return true;
      }));

      return { ...p, x, y, angle, velocity, score };
    }));
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [dimensions, collectibles]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // BG
    ctx.fillStyle = '#111';
    for(let i=0; i<40; i++) {
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc((Math.sin(i)*dimensions.width)%dimensions.width, (Math.cos(i)*dimensions.height)%dimensions.height, Math.random()*2, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    collectibles.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = c.type === 'SUPERNOVA' ? '#fbbf24' : c.type === 'VOID' ? '#ef4444' : '#fff';
      ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle as string;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    gameState.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.beginPath();
      ctx.moveTo(SHIP_RADIUS, 0); ctx.lineTo(-SHIP_RADIUS, -10); ctx.lineTo(-SHIP_RADIUS, 10); ctx.closePath();
      ctx.strokeStyle = p.color; ctx.lineWidth = 2;
      ctx.shadowBlur = 15; ctx.shadowColor = p.color;
      ctx.stroke();
      ctx.restore();
    });
  }, [gameState, collectibles, dimensions]);

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-zinc-950 overflow-hidden"
      onTouchStart={(e) => {
        for (let t of Array.from(e.changedTouches)) {
          if (t.clientX < dimensions.width/2) joystick.current = { active: true, startX: t.clientX, startY: t.clientY, currX: t.clientX, currY: t.clientY };
          else thrustActive.current = true;
        }
      }}
      onTouchMove={(e) => {
        for (let t of Array.from(e.changedTouches)) {
          if (joystick.current.active && t.clientX < dimensions.width/2) {
            joystick.current.currX = t.clientX; joystick.current.currY = t.clientY;
          }
        }
      }}
      onTouchEnd={(e) => {
        for (let t of Array.from(e.changedTouches)) {
          if (t.clientX < dimensions.width/2) joystick.current.active = false;
          else thrustActive.current = false;
        }
      }}
    >
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} />
      
      <div className="absolute top-4 inset-x-6 flex justify-between pointer-events-none">
        <div className="space-y-1">
          {gameState.sort((a,b)=>b.score-a.score).slice(0,3).map((p,i)=>(
            <div key={p.id} className="text-[10px] font-orbitron flex items-center gap-2 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                <span className="text-zinc-500">{i+1}</span>
                <span style={{color: p.color}}>{p.name}</span>
                <span className="text-white ml-auto">{p.score}</span>
            </div>
          ))}
        </div>
        <div className="text-center bg-white/5 px-4 py-1 rounded-xl border border-white/10 backdrop-blur-md">
            <div className={`text-xl font-orbitron font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
        </div>
      </div>

      {joystick.current.active && (
        <div className="absolute w-20 h-20 rounded-full border border-white/20 bg-white/5 pointer-events-none flex items-center justify-center" 
             style={{ left: joystick.current.startX - 40, top: joystick.current.startY - 40 }}>
          <div className="w-8 h-8 rounded-full bg-violet-500/50" 
               style={{ transform: `translate(${(joystick.current.currX-joystick.current.startX)/2}px, ${(joystick.current.currY-joystick.current.startY)/2}px)` }} />
        </div>
      )}

      <div className={`absolute bottom-8 right-8 w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all ${thrustActive.current ? 'bg-violet-600 scale-90 border-violet-400' : 'bg-white/5 border-white/10 opacity-50'}`}>
        <span className="text-[10px] font-orbitron font-bold">BOOST</span>
      </div>
    </div>
  );
};

export default GameCanvas;
