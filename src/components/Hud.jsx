// 점수판 (PRD F8)
function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export default function Hud({ score, moves, best }) {
  return (
    <div className="hud">
      <Stat label="점수" value={score} />
      <Stat label="남은 이동" value={moves} />
      <Stat label="최고 점수" value={best} />
    </div>
  );
}
