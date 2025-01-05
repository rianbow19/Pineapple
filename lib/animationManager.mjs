export class ScoreCounter {
  constructor(game) {
    this.game = game;
    this.currentDisplayScore = 0;
    this.targetScore = 0;
    this.isAnimating = false;
    this.spinSound = gameSound.select; // 使用選擇音效作為滾動音效
  }

  // 更新目標分數
  updateScore(newScore) {
    this.targetScore = newScore;
    if (!this.isAnimating) {
      this.animateToTarget();
    }
  }

  // 動畫到目標分數
  async animateToTarget() {
    if (this.currentDisplayScore === this.targetScore) return;

    this.isAnimating = true;
    const diff = this.targetScore - this.currentDisplayScore;
    const duration = 1; // 動畫持續時間（秒）
    const fps = 30; // 每秒更新次數
    const steps = duration * fps;
    const increment = diff / steps;

    // 計算每一步要增加的數值
    const stepSize = Math.ceil(Math.abs(diff) / steps);
    let currentStep = 0;

    const animate = () => {
      if (currentStep >= steps) {
        // 最後一步，確保顯示精確的目標分數
        this.currentDisplayScore = this.targetScore;
        this.updateDisplay();
        this.isAnimating = false;
        return;
      }

      currentStep++;

      // 根據差值的正負來決定是增加還是減少
      if (diff > 0) {
        this.currentDisplayScore = Math.min(this.currentDisplayScore + stepSize, this.targetScore);
      } else {
        this.currentDisplayScore = Math.max(this.currentDisplayScore - stepSize, this.targetScore);
      }

      // 播放滾動音效（每隔幾幀播放一次）
      if (currentStep % 5 === 0) {
        playSound(this.spinSound);
      }

      // 更新顯示
      this.updateDisplay();

      // 繼續下一幀動畫
      requestAnimationFrame(animate);
    };

    animate();
  }

  // 更新分數顯示
  updateDisplay() {
    if (this.game.scoreText) {
      // 在數字滾動時添加顏色效果
      if (this.isAnimating) {
        const colors = ["#FFD700", "#FFA500", "#FF4500"]; // 金色、橙色、紅橙色
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.game.scoreText.style.fill = randomColor;
      } else {
        // 動畫結束後恢復原來的顏色
        this.game.scoreText.style.fill = "#000000";
      }

      this.game.scoreText.text = `分數: ${Math.floor(this.currentDisplayScore)}`;

      // 添加縮放效果
      if (this.isAnimating) {
        const scale = 1 + Math.random() * 0.1; // 1.0 到 1.1 之間的隨機值
        this.game.scoreText.scale.set(scale);
      } else {
        this.game.scoreText.scale.set(1);
      }
    }
  }
}
