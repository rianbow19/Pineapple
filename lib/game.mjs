import {
  Container,
  Sprite,
  Texture,
  TextStyle,
  Text,
  Graphics,
} from "./pixi.mjs";
import { TextInput } from "./input.mjs";
import { leaderboard } from "./leaderboardData.mjs";
import { gsap } from "../node_modules/gsap/index.js";

export { Game };

const gameTime = 20;
const y0 = 1080;
const gravity = 0.6;

const QUESTION_TYPE = {
  SEXUAL: "有性生殖",
  ASEXUAL: "無性生殖",
};

// 每種題目的正確素材名稱
const correctTextures = {
  [QUESTION_TYPE.SEXUAL]: ["基因轉殖鳳梨.png", "種子鳳梨.png"],
  [QUESTION_TYPE.ASEXUAL]: [
    "冠芽鳳梨.png",
    "組織培養的鳳梨.png",
    "吸芽鳳梨.png",
    "裔芽鳳梨.png",
  ],
};
// 所有錯誤素材
const wrongTextures = ["香蕉.png", "草莓.png"];

class Game {
  constructor() {
    this.container = new Container();
    this.sceneContainer = new Container();

    //初始化變數
    this.score = 0;
    this.time = gameTime;
    this.userName = "";

    this.isGameRunning = false;
    this.inputListener = null;

    this.currentScrollAnimation = null;
    this.scrollThrottleTimeout = null;

    this.waveTimelines = [];

    // 取得所有可能的值並隨機選擇一個
    this.currentQuestion =
      Object.values(QUESTION_TYPE)[
        Math.floor(Math.random() * Object.values(QUESTION_TYPE).length)
      ];
    this.comboCount = 0; // combo 數
    this.currentScoreValue = 10; // 每次答對的加分（初始 10）

    // 用來記錄滑鼠左鍵是否按住 & 目前/前一個滑鼠位置
    this.mouseDown = false;
    this.lastPointerPos = { x: 0, y: 0 };
    this.currentPointerPos = { x: 0, y: 0 };

    //文字樣式
    this.defaultStyle = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 45,
      fontWeight: "bold",
      fill: "#000000",
    });

    this.titleStyle = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 80,
      fontWeight: "bold",
      fill: "#779938",
      stroke: { color: "#ffffff", width: 15, join: "round" },
    });

    this.scoreStyle = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 60,
      fontWeight: "bold",
      fill: "#ffffff",
      stroke: { color: "#000000", width: 15, join: "round" },
    });

    this.comboStyle = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 80,
      fontWeight: "bold",
      fill: "#ffd700",
      stroke: { color: "#ffffff", width: 15, join: "round" },
    });

    this.infoStyle = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 45,
      fontWeight: "bold",
      fill: "#3C3C3C",
      stroke: { color: "#F0FFF0", width: 5, join: "round" },
      wordWrap: true,
      wordWrapWidth: 1200,
      breakWords: true,
      align: "left",
    });

    this.infoStyle2 = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 45,
      fontWeight: "bold",
      fill: "#F0FFF0",
      stroke: { color: "#3C3C3C", width: 15, join: "round" },
    });

    //圖片
    this.bg = new Sprite(Texture.from("BG.png"));
    this.pineMom = new Sprite(Texture.from("鳳梨媽媽.png"));
    this.objects = [];

    //鳳梨媽媽容器
    this.pineMom.scale.set(0.15);
    this.pineMom.anchor.set(0.5);

    this.questionText = new Text({
      text: this.currentQuestion,
      style: this.infoStyle2,
    });
    this.questionText.anchor.set(0.5);
    this.questionText.y = 230;

    this.questBG = new Graphics();
    this.questBG.roundRect(-150, -50, 300, 100, 20);
    this.questBG.fill(0xffffff);
    this.questBG.stroke({ width: 10, color: 0x6a8783 });
    this.questBG.y = 230;

    this.pineMomCon = new Container();
    this.pineMomCon.addChild(this.pineMom, this.questBG, this.questionText);

    //初始化
    this.container.addChild(this.bg);
    this.container.addChild(this.sceneContainer);

    this.startTitle();
  }

  async fadeOutScene() {
    return new Promise((resolve) => {
      gsap.to(this.sceneContainer, {
        alpha: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  async fadeInScene() {
    return new Promise((resolve) => {
      gsap.to(this.sceneContainer, {
        alpha: 1,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  setupMouseEvents() {
    //碰撞偵測
    const hitArea = new Graphics();
    hitArea.rect(0, 0, 1920, 1080);
    hitArea.fill(0xff0000);
    hitArea.alpha = 0;
    this.sceneContainer.addChild(hitArea);

    // 設置互動
    hitArea.eventMode = "static";
    hitArea.on("pointerdown", (e) => {
      this.mouseDown = true;
      this.lastPointerPos.x = e.global.x;
      this.lastPointerPos.y = e.global.y;
      this.currentPointerPos.x = e.global.x;
      this.currentPointerPos.y = e.global.y;
    });

    hitArea.on("pointerup", (e) => {
      this.mouseDown = false;
    });

    hitArea.on("pointermove", (e) => {
      const localPos = this.sceneContainer.toLocal(e.global);

      this.currentPointerPos.x = localPos.x;
      this.currentPointerPos.y = localPos.y;
    });
  }

  async startTitle() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();

    this.score = 0;
    this.comboCount = 0;
    this.currentScoreValue = 10;
    this.time = gameTime;
    this.userName = "";
    this.timeText = false;
    this.isGameRunning = false;

    // 移除舊的input
    if (this.inputBox) {
      if (this.inputListener) {
        this.inputBox.domInput.removeEventListener("input", this.inputListener);
        this.inputListener = null;
      }
      if (this.inputBox.domInput && this.inputBox.domInput.parentNode) {
        this.inputBox.domInput.parentNode.removeChild(this.inputBox.domInput);
      }
      this.inputBox.destroy();
    }

    const title = new Sprite(Texture.from("標題.png"));
    const truck = new Sprite(Texture.from("鳳梨卡車.png"));
    const book = new Sprite(Texture.from("鳳梨生態秘笈.png"));
    this.sceneContainer.addChild(truck, title, book);

    //書
    book.scale.set(0.35);
    book.anchor.set(0.5);
    book.x = 180;
    book.y = 120;

    //書的左右擺動動畫
    const bookAnimation = gsap.timeline({ repeat: -1, yoyo: true });
    bookAnimation.to(book, {
      duration: 1,
      rotation: -0.15,
      ease: "power2.in",
    });
    bookAnimation.to(book, {
      duration: 1,
      rotation: 0.15,
      ease: "power2.out",
    });

    const bookText = new Text({
      text: "鳳梨生態秘笈",
      style: this.infoStyle2,
    });
    bookText.x = 50;
    bookText.y = 200;
    this.sceneContainer.addChild(bookText);

    book.eventMode = "static";
    book.cursor = "pointer";
    book.removeAllListeners();
    book.on("pointerdown", () => {
      this.bookPage();
    });

    book.on("pointerover", () => {
      book.scale.set(0.36);
      bookText.tint = 0xffda2a;
    });
    book.on("pointerout", () => {
      book.scale.set(0.35);
      bookText.tint = 0xffffff;
    });

    //開始文字
    const startText = new Text({ text: "START", style: this.titleStyle });
    startText.anchor.set(0.5);

    //開始按鈕
    const startButton = new Graphics();
    startButton.rect(-170, -50, 340, 100);
    startButton.fill(0xffda2a);
    startButton.alpha = 0;

    //輸入文字框
    this.inputBox = new TextInput({
      width: 500,
      height: 100,
      fontSize: 50,
      stroke: 0x6a8783,
      stroke_width: 10,
      textColor: 0x000000,
      focus_color: 0x000000,
      focus_width: 0,
      placeholder: "輸入你的名字",
      placeholderColor: 0xacacac,
    });

    this.inputBox.x = 960;
    this.inputBox.y = 580;

    this.sceneContainer.addChild(this.inputBox);

    //開始按鈕容器
    this.startButCon = new Container();
    this.startButCon.addChild(startButton, startText);
    this.startButCon.x = 960;
    this.startButCon.y = 470;
    this.sceneContainer.addChild(this.startButCon);

    //初始化按钮
    startText.tint = 0x6a8783;

    //輸入框事件監聽
    this.inputListener = (event) => {
      const value = event.target.value;

      this.inputBox.showtext.text = value;
      this.inputBox.enterLine.x = this.inputBox.showtext.width / 2 + 5;
      this.inputBox.placeholder.visible = value.length === 0;

      const isValidInput = value.trim().length > 0;

      if (isValidInput) {
        startButton.removeAllListeners();
        startButton.eventMode = "static";
        startButton.cursor = "pointer";

        startButton.on("pointerdown", () => {
          if (this.time === gameTime) {
            this.userName = value.trim();
            this.inputBox.showtext.text = "";
            startButton.removeAllListeners();
            this.GameStart();
          }
        });

        startButton.on("pointerover", () => {
          startText.tint = 0xffda2a;
          startText.scale.set(1.05);
        });

        startButton.on("pointerout", () => {
          startText.tint = 0xffffff;
          startText.scale.set(1);
        });
      } else {
        startButton.eventMode = "none";
        startButton.cursor = "default";
        startText.tint = 0x6a8783;
        startButton.removeAllListeners();
      }
    };
    this.inputBox.domInput.addEventListener("input", this.inputListener);

    await this.fadeInScene();
  }

  async bookPage() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();

    const BG1 = new Graphics();
    BG1.roundRect(110, 40, 1700, 1000, 50);
    BG1.fill(0x01b468);
    BG1.stroke({ width: 5, color: 0x01814a });
    BG1.alpha = 0.7;

    const BG2 = new Graphics();
    BG2.roundRect(135, 120, 1650, 900, 50);
    BG2.fill(0xffffff);
    BG2.stroke({ width: 5, color: 0x01814a });
    BG2.alpha = 0.7;

    const BG3 = new Graphics();
    BG3.roundRect(180, 65, 40, 40, 40);
    BG3.fill(0xffffff);
    BG3.alpha = 0.7;

    const BG4 = new Graphics();
    BG4.roundRect(240, 65, 40, 40, 40);
    BG4.fill(0xffffff);
    BG4.alpha = 0.7;

    const BGCon = new Container();
    BGCon.addChild(BG1, BG2, BG3, BG4);
    this.sceneContainer.addChild(BGCon);

    //創建有性生殖分類背景
    const sexualBG = new Graphics();
    sexualBG.roundRect(1200, 630, 400, 300, 300);
    sexualBG.fill(0x01b468);
    sexualBG.alpha = 0;

    //創建無性生殖分類背景
    const asexualBG = new Graphics();
    asexualBG.roundRect(300, 630, 630, 300, 300);
    asexualBG.fill(0x01b468);
    asexualBG.alpha = 0;

    this.sceneContainer.addChild(sexualBG, asexualBG);

    //說明文字
    const explainText = new Text({
      text: `遊戲畫面會隨機出現六種鳳梨梨寶寶及其他水果。
      鳳梨媽媽在畫面右上每隔10秒變換題目，玩家需依據題目切割相應的鳳梨。
      切割正確的鳳梨得分，若切到錯誤的鳳梨則扣分，連續答對可獲得更高分數。`,
      style: this.infoStyle,
    });
    explainText.x = 200;
    explainText.y = 150;
    this.sceneContainer.addChild(explainText);

    const pineappleTextures = [
      "基因轉殖鳳梨.png",
      "種子鳳梨.png",

      "冠芽鳳梨.png",
      "組織培養的鳳梨.png",
      "裔芽鳳梨.png",
      "吸芽鳳梨.png",
    ];

    const topPineapples = pineappleTextures
      .slice(0, 2) //基因鳳梨和種子鳳梨
      .map((textureName, index) => {
        const pineapple = new Sprite(Texture.from(textureName));
        pineapple.textureName = textureName.replace(/\.png$/, ""); //去掉 .png
        pineapple.scale.set(0.22);
        pineapple.anchor.set(0.5);
        pineapple.x = 1300 + index * 250;
        pineapple.y = 780;
        return pineapple;
      });

    const bottomPineapples = pineappleTextures
      .slice(2) //其他四個鳳梨
      .map((textureName, index) => {
        const pineapple = new Sprite(Texture.from(textureName));
        pineapple.textureName = textureName.replace(/\.png$/, "");
        pineapple.scale.set(0.22);
        pineapple.anchor.set(0.5);
        pineapple.x = 300 + index * 220;
        pineapple.y = 750;
        return pineapple;
      });

    const pineapples = [...topPineapples, ...bottomPineapples];

    pineapples.forEach((pineapple) => {
      pineapple.eventMode = "static";
      pineapple.on("pointerover", () => {
        pineapple.scale.set(0.23);
        const nameText = new Text({
          text: pineapple.textureName,
          style: this.infoStyle2,
        });
        nameText.anchor.set(0.5);
        nameText.x = pineapple.x;
        nameText.y = pineapple.y + pineapple.height / 2 + 20;
        this.sceneContainer.addChild(nameText);
        pineapple._nameText = nameText;
      });

      pineapple.on("pointerout", () => {
        pineapple.scale.set(0.22);
        if (pineapple._nameText) {
          this.sceneContainer.removeChild(pineapple._nameText);
          pineapple._nameText = null;
        }
      });
    });

    this.sceneContainer.addChild(...pineapples);

    //鳳梨媽媽容器
    this.sceneContainer.addChild(this.pineMomCon);
    this.pineMomCon.x = 1600;
    this.pineMomCon.y = 280;
    this.questionText.text = "點擊查看";

    this.pineMomCon.eventMode = "static";
    this.pineMomCon.cursor = "pointer";
    this.pineMomCon.off("pointerdown");
    this.pineMomCon.on("pointerdown", () => {
      if (this.currentQuestion === QUESTION_TYPE.SEXUAL) {
        this.currentQuestion = QUESTION_TYPE.ASEXUAL;
        sexualBG.alpha = 0;
        asexualBG.alpha = 0.5;

        this.stopWaveAnimation();
        this.animateInWave(bottomPineapples);
      } else {
        this.currentQuestion = QUESTION_TYPE.SEXUAL;
        sexualBG.alpha = 0.5;
        asexualBG.alpha = 0;
        this.stopWaveAnimation();
        this.animateInWave(topPineapples);
      }
      this.questionText.text = this.currentQuestion;
    });
    this.pineMomCon.on("pointerover", () => {
      this.pineMomCon.scale.set(1.01);
      this.questBG.tint = 0x01b468;
    });
    this.pineMomCon.on("pointerout", () => {
      this.pineMomCon.scale.set(1);
      this.questBG.tint = 0xffffff;
    });

    //關閉按鈕
    const closeBtn = new Sprite(Texture.from("close.png"));
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.scale.set(0.2);
    closeBtn.anchor.set(0.5);
    closeBtn.x = 1700;
    closeBtn.y = 80;
    closeBtn.tint = 0xb8b8b8;
    closeBtn.on("pointerdown", () => {
      this.startTitle();
    });
    closeBtn.on("pointerover", () => {
      closeBtn.scale.set(0.22);
      closeBtn.tint = 0xffffff;
    });
    closeBtn.on("pointerout", () => {
      closeBtn.scale.set(0.2);
      closeBtn.tint = 0xb8b8b8;
    });

    this.sceneContainer.addChild(closeBtn);

    await this.fadeInScene();
  }

  spawnRandomObject() {
    //從素材清單中「隨機」挑一張貼圖
    const textures = [
      "基因轉殖鳳梨.png",
      "組織培養的鳳梨.png",
      "裔芽鳳梨.png",
      "冠芽鳳梨.png",
      "吸芽鳳梨.png",
      "種子鳳梨.png",
      "香蕉.png",
      "草莓.png",
    ];
    const randomIndex = Math.floor(Math.random() * textures.length);
    const textureName = textures[randomIndex];

    //取得一個隨機的拋出角度 & 拋出力道
    const angle = Math.random() * Math.PI - Math.PI / 6;

    const vx = Math.cos(angle) * 4; // 水平速度
    const vy = -(25 + Math.random() * 15); //  -20 ~ -35

    //計算最高點
    const highestY = y0 - (vy * vy) / (2 * gravity);

    //判斷是否超過最低允許高度
    if (highestY > 350) {
      return;
    }

    const sprite = new Sprite(Texture.from(textureName));
    sprite.scale.set(0.3);
    sprite.anchor.set(0.5);
    sprite._textureName = textureName;

    //設定初始位置，檢查是否和其他物件 x 位置太近
    let newX;
    let tooClose;
    do {
      newX = Math.random() * 1400 + 100;
      tooClose = false;
      for (let obj of this.objects) {
        //設定間距100
        if (Math.abs(obj.sprite.x - newX) < 100) {
          tooClose = true;
          break;
        }
      }
    } while (tooClose);

    sprite.x = newX;
    sprite.y = y0;

    //把記錄存入this.objects
    this.objects.push({
      sprite,
      vx,
      vy,
      gravity,
      canBeCut: true,
    });

    this.sceneContainer.addChild(sprite);
  }

  handleCut(sprite) {
    const name = sprite._textureName;
    console.log("被切到的是:", name);
    if (!sprite._textureName) {
      console.error("切割的 sprite 缺少 textureName");
      return;
    }

    //判斷對錯
    const isCorrect = correctTextures[this.currentQuestion]?.includes(name);
    const isWrong = wrongTextures.includes(name);

    if (isCorrect) {
      //答對Combo+1
      this.comboCount++;

      //若連續答對>5，將分值提升為 20
      if (this.comboCount > 5) {
        this.currentScoreValue = 20;
      } else if (this.comboCount > 4) {
        this.currentScoreValue = 18;
      } else if (this.comboCount > 3) {
        this.currentScoreValue = 15;
      } else if (this.comboCount > 2) {
        this.currentScoreValue = 12;
      }

      this.score += this.currentScoreValue;
      console.log("正確，+" + this.currentScoreValue + "分");
    } else if (isWrong) {
      //答錯Combo歸零,切割完全錯誤的水果扣15分
      this.comboCount = 0;
      this.currentScoreValue = 10;
      this.score = Math.max(this.score - 15, 0);
      console.log("錯誤，-15分");
    } else {
      //答錯Combo歸零
      this.comboCount = 0;
      this.currentScoreValue = 10;
      this.score = Math.max(this.score - 10, 0);
      console.log("錯誤，-10分");
    }

    //創建上下半部分的 Sprite
    const topSprite = new Sprite(Texture.from(name));
    const bottomSprite = new Sprite(Texture.from(name));

    //設定上下半部分的位置、大小、錨點
    topSprite.scale.set(sprite.scale.x, sprite.scale.y);
    bottomSprite.scale.set(sprite.scale.x, sprite.scale.y);

    topSprite.anchor.set(0.5);
    bottomSprite.anchor.set(0.5);

    topSprite.x = sprite.x;
    topSprite.y = sprite.y;
    bottomSprite.x = sprite.x;
    bottomSprite.y = sprite.y;

    //設定上下半部分的遮罩
    const topMask = new Graphics();
    topMask.rect(
      -sprite.width / 2,
      -sprite.height / 2,
      sprite.width,
      sprite.height / 2
    );
    topMask.fill(0x00ff00);

    const bottomMask = new Graphics();
    bottomMask.rect(-sprite.width / 2, 0, sprite.width, sprite.height / 2);
    bottomMask.fill(0xff0000);

    topSprite.mask = topMask;
    bottomSprite.mask = bottomMask;

    topMask.x = topSprite.x;
    topMask.y = topSprite.y;
    bottomMask.x = bottomSprite.x;
    bottomMask.y = bottomSprite.y;

    //設定上下半部分的運動
    const speed = 5;
    const angle = (Math.random() * Math.PI) / 4 + Math.PI / 8; //22.5 ~ 67.5 度

    this.objects.push({
      sprite: topSprite,
      vx: -speed * Math.cos(angle),
      vy: -speed * Math.sin(angle),
      gravity: gravity,
      rotation: -Math.random() * 0.1 - 0.05,
      canBeCut: false,
      mask: topMask,
    });

    this.objects.push({
      sprite: bottomSprite,
      vx: speed * Math.cos(angle),
      vy: -speed * Math.sin(angle),
      gravity: gravity,
      rotation: Math.random() * 0.1 - 0.05,
      canBeCut: false,
      mask: bottomMask,
    });

    this.sceneContainer.addChild(topSprite, bottomSprite);
    this.sceneContainer.addChild(topMask, bottomMask);

    //移除原本的 sprite
    this.sceneContainer.removeChild(sprite);
    const idx = this.objects.findIndex((obj) => obj.sprite === sprite);
    if (idx >= 0) {
      this.objects.splice(idx, 1);
    }
  }

  async GameStart() {
    if (this.isGameRunning) {
      return;
    }

    this.isGameRunning = true;

    await this.fadeOutScene();

    this.sceneContainer.removeChildren();
    this.sceneContainer.addChild(this.pineMomCon);
    this.pineMomCon.x = 1700;
    this.pineMomCon.y = 180;

    this.comboText = new Text({
      text: "",
      style: this.comboStyle,
    });
    this.comboText.x = 850;
    this.comboText.y = 90;
    this.sceneContainer.addChild(this.comboText);

    //分數時間顯示
    this.scoreText = new Text({
      text: `分數: ${this.score}`,
      style: this.scoreStyle,
    });
    this.scoreText.x = 100;
    this.scoreText.y = 100;

    this.timeText = new Text({
      text: `時間: ${this.time}`,
      style: this.scoreStyle,
    });
    this.timeText.x = 500;
    this.timeText.y = 100;

    this.sceneContainer.addChild(this.scoreText, this.timeText);

    let switchQuestionInterval = setInterval(() => {
      //根據目前題目狀態來切換
      if (this.currentQuestion === QUESTION_TYPE.SEXUAL) {
        this.currentQuestion = QUESTION_TYPE.ASEXUAL;
      } else {
        this.currentQuestion = QUESTION_TYPE.SEXUAL;
      }
      console.log("切換題目:", this.currentQuestion);
    }, 10000); //10秒切換一次

    // 在遊戲開始時，一口氣丟出 3個
    for (let i = 0; i < 2; i++) {
      this.spawnRandomObject();
    }

    // 或每隔幾秒自動再生
    let jumpUp = setInterval(() => {
      this.spawnRandomObject();
    }, 550);

    //時間倒數
    let timeOut = setInterval(() => {
      this.time--;
      if (this.time < 2) {
        clearInterval(jumpUp);
        clearInterval(switchQuestionInterval);
      }
      if (this.time < 0) {
        this.time = 0;
        clearInterval(timeOut);
        this.endGame();
      }
    }, 1000);

    this.setupMouseEvents();

    await this.fadeInScene();
  }

  async endGame() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();
    this.isGameRunning = false;

    this.endText = new Text({ text: "遊戲結束", style: this.titleStyle });
    this.endText.anchor.set(0.5);
    this.endText.x = 960;
    this.endText.y = 340;

    this.userScoreText = new Text({
      text: `你的分數: ${this.score}`,
      style: this.infoStyle,
    });
    this.userScoreText.anchor.set(0.5);
    this.userScoreText.x = 960;
    this.userScoreText.y = 540;

    this.sceneContainer.addChild(this.endText, this.userScoreText);

    //確定按鈕
    this.confirmButton = new Graphics();
    this.confirmButton.roundRect(-170, -50, 340, 100, 20);
    this.confirmButton.fill(0xffffff);
    this.confirmButton.stroke({ width: 10, color: 0x6a8783 });
    this.confirmText = new Text({ text: "確定", style: this.infoStyle2 });
    this.confirmText.anchor.set(0.5);

    this.confirmCon = new Container();
    this.confirmCon.addChild(this.confirmButton, this.confirmText);
    this.confirmCon.x = 960;
    this.confirmCon.y = 800;

    this.sceneContainer.addChild(this.confirmCon);

    //點擊事件
    this.confirmButton.eventMode = "static";
    this.confirmButton.cursor = "pointer";
    this.confirmButton.on("pointerdown", () => {
      this.leaderboard();
    });

    //滑鼠移入移出事件
    this.confirmButton.on("pointerover", () => {
      this.confirmButton.tint = 0xffda2a;
    });
    this.confirmButton.on("pointerout", () => {
      this.confirmButton.tint = 0xffffff;
    });
    leaderboard.addPlayer(this.userName, this.score);
    await this.fadeInScene();
  }

  async leaderboard() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();

    const VIEWPORT_WIDTH = 1000;
    const VIEWPORT_HEIGHT = 600;
    const ENTRY_HEIGHT = 100;
    const START_X = 460;
    const START_Y = 200;

    //建立背景
    const bgRect = new Graphics();
    bgRect.roundRect(START_X, START_Y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 20);
    bgRect.fill(0xffffff);
    bgRect.stroke({ width: 5, color: 0x779938 });
    this.sceneContainer.addChild(bgRect);

    const mask = new Graphics();
    mask.roundRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 20);
    mask.fill(0xffffff);
    mask.x = START_X;
    mask.y = START_Y;
    this.sceneContainer.addChild(mask);

    //建立滾動容器
    const scrollContainer = new Container();
    scrollContainer.x = START_X;
    scrollContainer.y = START_Y;
    scrollContainer.mask = mask;
    this.sceneContainer.addChild(scrollContainer);

    const contentHeight = leaderboard.data.length * ENTRY_HEIGHT;
    const maxScroll = Math.max(0, contentHeight - VIEWPORT_HEIGHT);

    const scrollbarBG = new Graphics();
    scrollbarBG.roundRect(
      START_X + VIEWPORT_WIDTH + 10,
      START_Y,
      20,
      VIEWPORT_HEIGHT,
      10
    );
    scrollbarBG.fill(0xcccccc);

    const handleHeight = Math.max(
      50,
      (VIEWPORT_HEIGHT / contentHeight) * VIEWPORT_HEIGHT
    );
    const scrollbarHandle = new Graphics();
    scrollbarHandle.roundRect(0, 0, 20, handleHeight, 10);
    scrollbarHandle.fill(0x779938);
    scrollbarHandle.x = START_X + VIEWPORT_WIDTH + 10;
    scrollbarHandle.y = START_Y;

    this.sceneContainer.addChild(scrollbarBG, scrollbarHandle);

    //滾動條事件
    const topIndicator = new Graphics();
    topIndicator.fill({ color: 0x779938, alpha: 0.5 });
    topIndicator.moveTo(-20, 0);
    topIndicator.lineTo(20, 0);
    topIndicator.lineTo(0, -20);
    topIndicator.closePath();
    topIndicator.x = START_X + VIEWPORT_WIDTH / 2;
    topIndicator.y = START_Y - 10;
    topIndicator.visible = false;

    const bottomIndicator = new Graphics();
    bottomIndicator.fill({ color: 0x779938, alpha: 0.5 });
    bottomIndicator.moveTo(-20, 0);
    bottomIndicator.lineTo(20, 0);
    bottomIndicator.lineTo(0, 20);
    bottomIndicator.closePath();
    bottomIndicator.x = START_X + VIEWPORT_WIDTH / 2;
    bottomIndicator.y = START_Y + VIEWPORT_HEIGHT + 10;
    bottomIndicator.visible = false;

    this.sceneContainer.addChild(topIndicator, bottomIndicator);

    //建立標題
    const headerBG = new Graphics();
    headerBG.roundRect(START_X, START_Y - 80, VIEWPORT_WIDTH, 60, 10);
    headerBG.fill(0x779938);

    const rankHeader = new Text({ text: "排名", style: this.infoStyle2 });
    rankHeader.x = START_X + 40;
    rankHeader.y = START_Y - 70;

    const nameHeader = new Text({ text: "玩家", style: this.infoStyle2 });
    nameHeader.x = START_X + 270;
    nameHeader.y = START_Y - 70;

    const scoreHeader = new Text({ text: "分數", style: this.infoStyle2 });
    scoreHeader.x = START_X + 720;
    scoreHeader.y = START_Y - 70;

    this.sceneContainer.addChild(headerBG, rankHeader, nameHeader, scoreHeader);

    //建立排行榜資料條目
    const createEntryContainer = (player, index, isAnimated = false) => {
      const entryContainer = new Container();
      entryContainer.y = index * ENTRY_HEIGHT;

      if (isAnimated) {
        entryContainer.y += ENTRY_HEIGHT;
        entryContainer.alpha = 0;
      }

      const entryBG = new Graphics();
      entryBG.roundRect(0, 0, VIEWPORT_WIDTH - 20, 80, 10);
      entryBG.fill(player.name === this.userName ? 0xffda2a : 0xf0fff0);
      entryBG.stroke({ width: 3, color: 0x779938 });

      let rankPrefix = "";
      if (index === 0) rankPrefix = "🥇 ";
      else if (index === 1) rankPrefix = "🥈 ";
      else if (index === 2) rankPrefix = "🥉 ";

      const rankText = new Text({
        text: `${rankPrefix}${index + 1}`,
        style: this.defaultStyle,
      });
      rankText.x = 40;
      rankText.y = 20;

      const nameText = new Text({
        text: player.name,
        style: this.defaultStyle,
      });
      nameText.x = 270;
      nameText.y = 20;

      const scoreText = new Text({
        text: player.score.toString(),
        style: this.defaultStyle,
      });
      scoreText.x = 720;
      scoreText.y = 20;

      entryContainer.addChild(entryBG, rankText, nameText, scoreText);
      return entryContainer;
    };

    let currentScroll = 0;
    const updateScroll = (newScroll) => {
      if (this.currentScrollAnimation) {
        this.currentScrollAnimation.kill();
      }

      currentScroll = Math.max(0, Math.min(newScroll, maxScroll));

      this.currentScrollAnimation = gsap.to(scrollContainer, {
        y: START_Y - currentScroll,
        duration: 0.3,
        ease: "power2.out",
        onUpdate: () => {
          const scrollPercentage = currentScroll / maxScroll;
          const scrollRange = VIEWPORT_HEIGHT - handleHeight;
          scrollbarHandle.y = START_Y + scrollRange * scrollPercentage;

          topIndicator.visible = currentScroll > 0;
          bottomIndicator.visible = currentScroll < maxScroll;
        },
      });
    };

    const throttledScroll = (e) => {
      if (this.scrollThrottleTimeout) return;

      this.scrollThrottleTimeout = setTimeout(() => {
        const newScroll = currentScroll + e.deltaY;
        updateScroll(newScroll);
        this.scrollThrottleTimeout = null;
      }, 16);
    };

    //更新排行榜
    leaderboard.data.forEach((player, index) => {
      const isCurrentPlayer = player.name === this.userName;
      const entryContainer = createEntryContainer(
        player,
        index,
        isCurrentPlayer
      );
      scrollContainer.addChild(entryContainer);

      if (isCurrentPlayer) {
        const targetScroll = Math.max(
          0,
          Math.min(
            index * ENTRY_HEIGHT - VIEWPORT_HEIGHT / 2 + ENTRY_HEIGHT / 2,
            maxScroll
          )
        );
        //排行榜動畫
        gsap
          .timeline()
          .to(scrollContainer, {
            y: START_Y - targetScroll,
            duration: 0.8,
            ease: "power2.inOut",
          })
          .to(
            entryContainer,
            {
              y: index * ENTRY_HEIGHT,
              alpha: 1,
              duration: 0.5,
              ease: "back.out",
            },
            "+=0.2"
          )
          .to(
            scrollbarHandle,
            {
              y:
                START_Y +
                (targetScroll / maxScroll) * (VIEWPORT_HEIGHT - handleHeight),
              duration: 0.5,
              ease: "power2.inOut",
            },
            "-=0.5"
          );
      }
    });

    if (bgRect.eventMode === "static") {
      bgRect.removeAllListeners();
    }
    bgRect.eventMode = "static";
    bgRect.on("wheel", throttledScroll);

    const isOnLeaderboard = leaderboard.data.some(
      (player) => player.name === this.userName
    );

    if (!isOnLeaderboard) {
      const encourageText = new Text({
        text: "噢不！找不到你，別灰心！再接再厲！",
        style: this.infoStyle,
      });
      encourageText.anchor.set(0.5);
      encourageText.x = START_X + VIEWPORT_WIDTH / 2;
      encourageText.y = START_Y - 120;
      this.sceneContainer.addChild(encourageText);
    }

    const cleanup = () => {
      if (this.scrollThrottleTimeout) {
        clearTimeout(this.scrollThrottleTimeout);
      }
      if (this.currentScrollAnimation) {
        this.currentScrollAnimation.kill();
      }
      if (bgRect.eventMode === "static") {
        bgRect.removeAllListeners();
      }
    };

    //再試一次按鈕
    const retryButton = new Graphics();
    retryButton.roundRect(-170, -50, 340, 100, 20);
    retryButton.fill(0xffffff);
    retryButton.stroke({ width: 10, color: 0x6a8783 });

    const retryText = new Text({
      text: "再試一次",
      style: this.infoStyle2,
    });
    retryText.anchor.set(0.5);

    const retryContainer = new Container();
    retryContainer.addChild(retryButton, retryText);
    retryContainer.x = START_X + VIEWPORT_WIDTH / 2;
    retryContainer.y = START_Y + VIEWPORT_HEIGHT + 100;
    this.sceneContainer.addChild(retryContainer);

    retryButton.eventMode = "static";
    retryButton.cursor = "pointer";
    retryButton.on("pointerdown", () => {
      cleanup();
      this.sceneContainer.removeChildren();
      this.startTitle();
    });
    retryButton.on("pointerover", () => (retryButton.tint = 0xffda2a));
    retryButton.on("pointerout", () => (retryButton.tint = 0xffffff));

    await this.fadeInScene();
  }

  updateScoreAndTime() {
    this.timeText.text = `時間: ${this.time}`;
    this.scoreText.text = `分數: ${this.score}`;
    this.questionText.text = this.currentQuestion;
    this.questBG.tint =
      this.currentQuestion === QUESTION_TYPE.SEXUAL ? 0x779938 : 0xffffff;

    if (this.comboCount > 1) {
      this.comboText.text = `combo ${this.comboCount - 1}`;
      const comboColors = [0xffd700, 0x3cb371, 0x8a2be2, 0x1e90ff, 0xdc143c];
      const colorIndex = Math.min(this.comboCount - 2, comboColors.length - 1);
      this.comboText.style.fill = comboColors[colorIndex];
    } else {
      this.comboText.text = "";
    }
  }

  handleMouseMovement() {
    const x1 = this.lastPointerPos.x;
    const y1 = this.lastPointerPos.y;
    const x2 = this.currentPointerPos.x;
    const y2 = this.currentPointerPos.y;

    const moveDistance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    //如果移動距離過小，不處理
    if (moveDistance <= 20) return;

    //碰撞檢查
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      if (!obj.canBeCut) continue;

      const radius =
        Math.max(obj.sprite.width, obj.sprite.height) *
        0.5 *
        obj.sprite.scale.x;
      if (
        checkLineCircleCollision(
          x1,
          y1,
          x2,
          y2,
          obj.sprite.x,
          obj.sprite.y,
          radius
        )
      ) {
        this.handleCut(obj.sprite);
        i--; //刪除後索引往回
      }
    }

    //更新滑鼠位置
    this.lastPointerPos.x = this.currentPointerPos.x;
    this.lastPointerPos.y = this.currentPointerPos.y;
  }

  update(delta) {
    //確認開始遊戲
    if (!this.timeText) return;

    //更新時間分數顯示
    this.updateScoreAndTime();

    //更新滑鼠事件
    if (this.mouseDown) {
      this.handleMouseMovement();
    }

    //更新所有飛行物件
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];

      obj.sprite.x += obj.vx;
      obj.sprite.y += obj.vy;

      if (obj.rotation) {
        obj.sprite.rotation += obj.rotation * 0.1;
      }
      if (obj.mask) {
        obj.mask.x = obj.sprite.x;
        obj.mask.y = obj.sprite.y;
        obj.mask.rotation = obj.sprite.rotation;
      }

      obj.vy += obj.gravity;

      //如果飛出畫面，就移除
      if (obj.sprite.y > 1080) {
        this.sceneContainer.removeChild(obj.sprite);
        if (obj.mask) this.sceneContainer.removeChild(obj.mask);
        this.objects.splice(i, 1);
        i--; //刪除後索引往回
      }
    }
  }

  //鳳梨說明動畫效果
  animateInWave(pineappleArray) {
    this.stopWaveAnimation();

    pineappleArray.forEach((pineapple, i) => {
      if (!pineapple.originalY) {
        pineapple.originalY = pineapple.y; //記錄初始 Y 位置
      } else {
        pineapple.y = pineapple.originalY;
      }
      //每個鳳梨在 Y 軸上下跳動
      const tl = gsap.to(pineapple, {
        y: pineapple.y - 30,
        duration: 0.5,
        ease: "power1.inOut",
        repeat: -1, //無限重複
        yoyo: true, //來回
        delay: i * 0.1, //每個鳳梨延遲 0.1 秒
      });
      this.waveTimelines.push(tl);
    });
  }

  //停止動畫
  stopWaveAnimation() {
    this.waveTimelines.forEach((tl) => {
      tl.kill();
    });
    this.waveTimelines = [];
  }
}

//碰撞檢查
function checkLineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  //線段長度平方
  const len2 = dx * dx + dy * dy;

  //若線段近似點(只是一個點)，直接改用點到圓心距離判斷
  if (len2 === 0) {
    const dist2 = (cx - x1) * (cx - x1) + (cy - y1) * (cy - y1);
    return dist2 <= r * r;
  }

  //向量 AB dot AC 比例算出投影
  let t = ((cx - x1) * dx + (cy - y1) * dy) / len2;
  //t < 0 表示最近點在 [x1,y1] 之前，t > 1 表示在 [x2,y2] 之後
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  //找線段上最近點
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;

  //計算最近點與圓心距離
  const distX = cx - nearestX;
  const distY = cy - nearestY;
  const dist2 = distX * distX + distY * distY;

  return dist2 <= r * r;
}
