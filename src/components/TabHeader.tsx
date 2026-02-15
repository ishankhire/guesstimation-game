interface TabHeaderProps {
  activeTab: "game" | "leaderboard";
  onTabChange: (tab: "game" | "leaderboard") => void;
}

export default function TabHeader({ activeTab, onTabChange }: TabHeaderProps) {
  return (
    <div className="tab-bar">
      <button
        className={activeTab === "game" ? "active" : ""}
        onClick={() => onTabChange("game")}
      >
        Game
      </button>
      <button
        className={activeTab === "leaderboard" ? "active" : ""}
        onClick={() => onTabChange("leaderboard")}
      >
        Leaderboard
      </button>
    </div>
  );
}
