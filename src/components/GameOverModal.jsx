// 게임 종료 화면 (PRD 4.5)
export default function GameOverModal({ score, onRestart }) {
  return (
    <div className="overlay" role="dialog" aria-label="게임 종료">
      <h2>게임 종료!</h2>
      <p>최종 점수: {score}점</p>
      <button type="button" onClick={onRestart}>다시 하기</button>
    </div>
  );
}
