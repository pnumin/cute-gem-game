import Hud from './components/Hud';
import GameBoard from './components/GameBoard';
import Banner from './components/Banner';
import GameOverModal from './components/GameOverModal';
import { useGemGame } from './hooks/useGemGame';

export default function App() {
  const {
    engine, score, moves, best, gameOver, banner,
    trySwap, clickCell, showHint, newGame,
  } = useGemGame();

  return (
    <main className="app">
      <h1>🐥 귀여운 보석 맞추기</h1>
      <Hud score={score} moves={moves} best={best} />
      <GameBoard engine={engine} onSwap={trySwap} onCellClick={clickCell}>
        <Banner banner={banner} />
        {gameOver && <GameOverModal score={score} onRestart={newGame} />}
      </GameBoard>
      <div className="buttons">
        <button type="button" onClick={showHint}>💡 힌트</button>
        <button type="button" onClick={newGame}>🔄 새 게임</button>
      </div>
      <p className="help">
        같은 보석 3개 이상을 가로/세로로 맞추거나, 2×2 사각형으로 모으면(보너스 +50) 사라집니다.
        클릭 또는 드래그로 이웃한 보석과 자리를 바꿉니다.
      </p>
    </main>
  );
}
