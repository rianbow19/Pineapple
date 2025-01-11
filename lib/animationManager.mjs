import { Text, Container, Graphics } from "./pixi.mjs";
import { gsap } from "../node_modules/gsap/index.js";
import { gdStyle, infoStyle, infoStyle2, titleStyle } from "./textStyle.mjs";

export class AnimationManager {
  constructor(game) {
    this.game = game;
  }

  async showReadyGoAnimation() {
    console.log("Ready-Go 動畫結束");

    const readyText = new Text({
      text: "READY",
      style: gdStyle,
    });

    const goText = new Text({
      text: "GO!",
      style: gdStyle,
    });

    // 置中文字
    readyText.anchor.set(0.5);
    goText.anchor.set(0.5);
    readyText.position.set(960, 540);
    goText.position.set(960, 540);

    // 初始設定
    readyText.alpha = 0;
    readyText.position.y = 800; // 設定初始位置在畫面下方
    goText.alpha = 0;
    goText.scale.set(2); // 初始較大的尺寸

    this.game.sceneContainer.addChild(readyText, goText);

    // 建立動畫時間軸
    const timeline = gsap.timeline({
      onComplete: () => {
        this.game.sceneContainer.removeChild(readyText, goText);
      },
    });

    // READY 動畫
    timeline
      // READY 從下方飛入
      .to(readyText, {
        alpha: 1,
        y: 540, // 移動到畫面中央
        duration: 0.3,
        ease: "power2.out",
      })
      // READY 震動效果
      .to(readyText.scale, {
        x: 1.1,
        y: 1.1,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power1.inOut",
      })
      // READY 停留
      .to(readyText, {
        alpha: 1,
        duration: 0.1,
      })
      // READY 淡出
      .to(readyText, {
        alpha: 0,
        duration: 0.1,
        ease: "power2.in",
      })
      // GO 由大變小進入
      .to(
        goText,
        {
          alpha: 1,
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)",
        },
        "-=0.1"
      )
      // GO 震動效果
      .to(goText.scale, {
        x: 1.1,
        y: 1.1,
        duration: 0.1,
        repeat: 2,
        yoyo: true,
        ease: "power1.inOut",
      })
      // GO 淡出
      .to(
        goText,
        {
          alpha: 0,
          scale: 0.5,
          duration: 0.1,
          ease: "power2.in",
        },
        "+=0.2"
      );
  }

  // Combo文字動畫
  animateCombo(comboCount) {
    if (comboCount <= 1) {
      this.game.comboText.text = "";
      return;
    }

    const comboColors = [0xffd700, 0x3cb371, 0x8a2be2, 0x1e90ff, 0xdc143c];
    const colorIndex = Math.min(comboCount - 2, comboColors.length - 1);

    this.game.comboText.text = `combo ${comboCount - 1}`;
    this.game.comboText.style.fill = comboColors[colorIndex];

    // 重設比例以確保動畫從頭開始
    this.game.comboText.scale.set(1);
    this.game.comboText.alpha = 1;

    // 創建彈跳動畫
    const timeline = gsap.timeline();

    // 基本彈跳效果
    timeline
      .to(this.game.comboText.scale, {
        x: 1.5,
        y: 1.5,
        duration: 0.15,
        ease: "power2.out",
      })
      .to(this.game.comboText.scale, {
        x: 1,
        y: 1,
        duration: 0.4,
        ease: "elastic.out(1.2, 0.5)",
      });

    // 高combo特效
    if (comboCount > 5) {
      // 添加發光效果
      this.game.comboText.style.dropShadow = true;
      this.game.comboText.style.dropShadowColor = comboColors[colorIndex];
      this.game.comboText.style.dropShadowBlur = 6;
      this.game.comboText.style.dropShadowDistance = 0;

      // 添加旋轉震動
      timeline.to(
        this.game.comboText,
        {
          rotation: 0.1,
          duration: 0.1,
          repeat: 3,
          yoyo: true,
          ease: "none",
          onComplete: () => {
            this.game.comboText.rotation = 0;
          },
        },
        "-=0.3"
      );
    } else {
      // 移除發光效果
      this.game.comboText.style.dropShadow = false;
    }
  }

  async showGameOverAnimation() {
    // 創建背景面板
    const panel = new Graphics();
    panel.roundRect(0, 0, 800, 600, 30);
    panel.fill({ color: 0xffffff, alpha: 0.95 });
    panel.stroke({ width: 8, color: 0x6a8783 });
    panel.x = 560;
    panel.y = 240;

    // 裝飾性的頂部條紋
    const topStripe = new Graphics();
    topStripe.roundRect(0, 0, 800, 80, { tl: 30, tr: 30, bl: 0, br: 0 });
    topStripe.fill(0x6a8783);
    topStripe.x = 560;
    topStripe.y = 240;

    // 遊戲結束文字
    const endText = new Text({
      text: "遊戲結束",
      style: {
        ...titleStyle,
        fill: 0xffffff,
      },
    });
    endText.anchor.set(0.5);
    endText.x = 960;
    endText.y = 280;

    // 分數展示背景
    const scoreBG = new Graphics();
    scoreBG.roundRect(0, 0, 400, 120, 20);
    scoreBG.fill(0xf0f0f0);
    scoreBG.stroke({ width: 4, color: 0x6a8783 });
    scoreBG.x = 760;
    scoreBG.y = 450;

    // 分數標題文字
    const scoreTitle = new Text({
      text: `最終分數`,
      style: {
        ...infoStyle,
        fontSize: 36,
        fill: 0x6a8783,
      },
    });
    scoreTitle.anchor.set(0.5);
    scoreTitle.x = 960;
    scoreTitle.y = 480;

    // 實際分數
    const scoreNumber = new Text({
      text: `${this.game.score}`,
      style: {
        ...infoStyle,
        fontSize: 48,
        fill: 0x6a8783,
        fontWeight: "bold",
      },
    });
    scoreNumber.anchor.set(0.5);
    scoreNumber.x = 960;
    scoreNumber.y = 530;

    // 確定按鈕容器
    const confirmCon = new Container();
    confirmCon.x = 960;
    confirmCon.y = 680;

    // 確定按鈕
    const confirmButton = new Graphics();
    confirmButton.roundRect(-170, -50, 340, 100, 50);
    confirmButton.fill(0x6a8783);
    confirmButton.stroke({ width: 6, color: 0x557571 });

    // 按鈕文字
    const confirmText = new Text({
      text: "查看排行榜",
      style: {
        ...infoStyle2,
        fill: 0xffffff,
      },
    });
    confirmText.anchor.set(0.5);
    // 組合元素
    confirmCon.addChild(glow, confirmButton, confirmText);

    // 設置互動事件
    confirmButton.eventMode = "static";
    confirmButton.cursor = "pointer";
    confirmButton.on("pointerdown", () => {
      playSound(gameSound.button);
      this.game.leaderboard();
    });

    // 互動動畫
    confirmButton.on("pointerover", () => {
      playSound(gameSound.select);
      gsap.to(confirmButton, {
        pixi: {
          tint: 0x7ab5b0,
          scaleX: 1.05,
          scaleY: 1.05,
        },
        duration: 0.2,
      });
      gsap.to(confirmText, {
        pixi: { scaleX: 1.05, scaleY: 1.05 },
        duration: 0.2,
      });
      gsap.to(glow, {
        alpha: 0.3,
        duration: 0.2,
      });
    });

    confirmButton.on("pointerout", () => {
      gsap.to(confirmButton, {
        pixi: {
          tint: 0xffffff,
          scaleX: 1,
          scaleY: 1,
        },
        duration: 0.2,
      });
      gsap.to(confirmText, {
        pixi: { scaleX: 1, scaleY: 1 },
        duration: 0.2,
      });
      gsap.to(glow, {
        alpha: 0,
        duration: 0.2,
      });
    });

    // 將所有元素添加到場景
    this.game.sceneContainer.addChild(panel, topStripe, endText, scoreBG, scoreTitle, scoreNumber, confirmCon);

    // 設置初始透明度為0
    const elements = [panel, topStripe, endText, scoreBG, scoreTitle, scoreNumber, confirmCon];
    elements.forEach((el) => (el.alpha = 0));

    // 創建依序淡入的動畫序列
    const timeline = gsap.timeline();

    // 背景面板淡入
    timeline.to([panel, topStripe], {
      alpha: 1,
      duration: 0.3,
      ease: "power2.out",
    });

    // 標題淡入
    timeline.to(
      endText,
      {
        alpha: 1,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.1"
    );

    // 分數背景和標題淡入
    timeline.to(
      [scoreBG, scoreTitle],
      {
        alpha: 1,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.1"
    );

    // 分數彈出動畫
    timeline.to(scoreNumber, {
      pixi: {
        scale: 1,
        alpha: 1,
      },
      duration: 0.5,
      ease: "back.out(1.7)",
    });

    // 按鈕彈入動畫
    timeline.from(confirmCon, {
      pixi: {
        y: "+=50",
        alpha: 0,
      },
      duration: 0.5,
      ease: "back.out(1.7)",
    });

    return timeline;
  }
}
