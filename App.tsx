
import React, { useState } from 'react';
import { GameState, Player, PlayerType } from './types';
import { PLAYER_COLORS, PLAYER_NAMES } from './constants';
import GameCanvas from './components/GameCanvas';
import { getMatchCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [players, setPlayers] = useState<Player[]>([]);
  const [commentary, setCommentary] = useState<string>('');
  const [loadingCommentary, setLoadingCommentary] = useState(false);

  const startMatch = () => {
    // Attempt fullscreen for better experience
    try { document.documentElement.requestFullscreen(); } catch (e) {}

    const initialPlayers: Player[] = Array.from({ length: 4 }).map((_, i) => ({
      id: `p${i}`,
      name: i === 0 ? 'YOU' : PLAYER_NAMES[i],
      type: i === 0 ? PlayerType.HUMAN : PlayerType.AI,
      color: PLAYER_COLORS[i],
      score: 0,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      angle: Math.random() * Math.PI * 2,
      velocity: { x: 0, y: 0 }
    }));
    setPlayers(initialPlayers);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = async (finalPlayers: Player[]) => {
    setGameState(GameState.RESULT);
    setPlayers(finalPlayers);
    setLoadingCommentary(true);
    const aiCommentary = await getMatchCommentary(finalPlayers.map(p => ({ name: p.name, score: p.score })));
    setCommentary(aiCommentary);
    setLoadingCommentary(false);
  };

  const shareScore = () => {
    const winner = [...players].sort((a,b)=>b.score-a.score)[0];
    const text = `🚀 Cosmic Drift 경기 결과!\n🥇 1위: ${winner.name} (${winner.score}점)\n나도 지금 도전해봐!`;
    if (navigator.share) {
      navigator.share({ title: 'Cosmic Drift 결과', text, url: window.location.href });
    } else {
      alert('결과가 복사되었습니다!');
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050507] text-white overflow-hidden flex flex-col items-center justify-center">
      {gameState === GameState.LOBBY && (
        <div className="max-w-md w-full px-10 text-center space-y-10 animate-in fade-in zoom-in duration-500">
          <div className="space-y-3">
            <h1 className="text-5xl font-orbitron font-bold tracking-tighter text-white">COSMIC DRIFT</h1>
            <p className="text-violet-500 font-orbitron text-[10px] tracking-[0.4em] uppercase">Mobile Edition</p>
          </div>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl space-y-8">
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-500">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">LEFT: STEER</div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">RIGHT: BOOST</div>
            </div>
            <button onClick={startMatch} className="w-full py-5 rounded-2xl bg-white text-black font-orbitron font-bold text-lg active:scale-95 transition-all">START MISSION</button>
          </div>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <GameCanvas players={players} onGameOver={handleGameOver} onScoreUpdate={setPlayers} duration={60} />
      )}

      {gameState === GameState.RESULT && (
        <div className="max-w-md w-full px-6 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-zinc-900/90 border border-white/10 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-3xl">
            <h2 className="text-center font-orbitron font-bold text-xl tracking-widest text-zinc-400">MISSION RESULTS</h2>
            <div className="space-y-2">
              {players.sort((a,b)=>b.score-a.score).map((p, i) => (
                <div key={p.id} className={`flex items-center p-4 rounded-2xl border ${p.id==='p0' ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5'}`}>
                  <span className="font-orbitron mr-4 text-zinc-600">{i+1}</span>
                  <div className="w-2 h-2 rounded-full mr-3" style={{backgroundColor:p.color}} />
                  <span className="flex-1 font-semibold text-sm">{p.name} {p.id==='p0' && '(YOU)'}</span>
                  <span className="font-orbitron font-bold">{p.score}</span>
                </div>
              ))}
            </div>
            <div className="bg-black/60 p-5 rounded-2xl text-center">
              {loadingCommentary ? <div className="text-xs animate-pulse">AI 분석 중...</div> : <p className="text-sm italic text-zinc-400 italic">"{commentary}"</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={shareScore} className="py-4 rounded-xl bg-zinc-800 text-white font-bold text-xs">공유하기</button>
                <button onClick={()=>setGameState(GameState.LOBBY)} className="py-4 rounded-xl bg-violet-600 text-white font-bold text-xs">다시하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
