// 排行榜資料
let leaderboardData = [
  { name: "Player 1", score: 100 },
  { name: "Player 2", score: 90 },
  { name: "Player 3", score: 80 },
  { name: "Player 4", score: 70 },
  { name: "Player 5", score: 60 },
  { name: "Player 6", score: 50 },
  { name: "Player 7", score: 40 },
  { name: "Player 8", score: 30 },
  { name: "Player 9", score: 20 },
  { name: "Player 10", score: 10 },
];

class Leaderboard {
  constructor(data) {
    this.data = data;
  }

  addPlayer(name, score) {
    this.data.push({ name, score });
    this.sortPlayers();
    this.data = this.data.slice(0, 100); // 只保留前 100 名
  }

  sortPlayers() {
    this.data.sort((a, b) => b.score - a.score);
  }

  getPlayers() {
    return this.data;
  }
}

const leaderboard = new Leaderboard(leaderboardData);
export { leaderboard };
