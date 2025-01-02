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
  SEXUAL: "有性生殖", // 題目1
  ASEXUAL: "無性生殖", // 題目2
};

// 定義每種題目的正確素材名稱
const correctTextures = {
  [QUESTION_TYPE.SEXUAL]: ["基因轉殖鳳梨.png", "種子鳳梨.png"],
  [QUESTION_TYPE.ASEXUAL]: [
    "冠芽鳳梨.png",
    "組織培養的鳳梨.png",
    "吸芽鳳梨.png",
    "裔芽鳳梨.png",
  ],
};
// 定義所有錯誤素材（無論哪一題，出現在題目就算錯）
const wrongTextures = ["香蕉.png", "草莓.png"];

class Game {
  constructor() {
    this.container = new Container();
    this.sceneContainer = new Container();

    //初始化變數
    this.score = 0;
    this.time = gameTime;
    this.scoreText;
    this.timeText;
    this.userName = "";

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

    //標題文字樣式
    this.defaultStyle = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 50,
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

    this.inputStyle = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 50,
      fontWeight: "bold",
      fill: "#000000",
    });

    this.infoStyle = new TextStyle({
      fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
      fontSize: 45,
      fontWeight: "bold",
      fill: "#3C3C3C",
      stroke: { color: "#F0FFF0", width: 5, join: "round" },
      wordWrap: true,
      wordWrapWidth: 1200,
      breakWords: true, // 允許在單詞中間換行（對中文很有用）
      align: "left", // 文本對齊方式
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

    const title = new Sprite(Texture.from("標題.png"));
    const truck = new Sprite(Texture.from("鳳梨卡車.png"));
    const book = new Sprite(Texture.from("鳳梨生態秘笈.png"));
    this.sceneContainer.addChild(truck, title, book);

    //書
    book.scale.set(0.35);
    book.anchor.set(0.5);
    book.x = 180;
    book.y = 120;

    // 書的左右擺動動畫
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

    // 初始化按钮状态
    startText.tint = 0x6a8783;

    this.inputBox.domInput.addEventListener("input", (event) => {
      this.inputBox.showtext.text = event.target.value;
      this.inputBox.enterLine.x = this.inputBox.showtext.width / 2 + 5;
      this.inputBox.placeholder.visible =
        this.inputBox.showtext.text.length === 0;
      if (this.inputBox.showtext.text.trim() !== "") {
        startButton.eventMode = "static";
        startButton.cursor = "pointer";
        startText.tint = 0xffffff; // 按钮可用的颜色
        startButton.off("pointerover");
        startButton.off("pointerout");
        // 按钮点击事件
        startButton.on("pointerdown", () => {
          this.userName = this.inputBox.showtext.text;
          this.inputBox.showtext.text = "";
          this.GameStart();
        });
        //滑鼠移入移出事件
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
        startText.tint = 0x6a8783; // 按钮禁用的颜色}
        startButton.off("pointerover");
        startButton.off("pointerout");
      }
    });

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
      .slice(0, 2) // 基因鳳梨和種子鳳梨
      .map((textureName, index) => {
        const pineapple = new Sprite(Texture.from(textureName));
        pineapple.textureName = textureName.replace(/\.png$/, ""); // 去掉 .png
        pineapple.scale.set(0.22);
        pineapple.anchor.set(0.5);
        // 設定到畫面右半部
        pineapple.x = 1300 + index * 250;
        pineapple.y = 780;
        return pineapple;
      });

    const bottomPineapples = pineappleTextures
      .slice(2) // 其他四個鳳梨
      .map((textureName, index) => {
        const pineapple = new Sprite(Texture.from(textureName));
        pineapple.textureName = textureName.replace(/\.png$/, "");
        pineapple.scale.set(0.22);
        pineapple.anchor.set(0.5);
        // 設定到畫面左半部上下排列
        pineapple.x = 300 + index * 220; // 左半部，X 間距固定
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

    // 關閉按鈕
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
    // 1. 從素材清單中「隨機」挑一張貼圖
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

    // 4. 設定拋物線需要的參數(速度、重力)
    //    取得一個隨機的拋出角度 & 拋出力道
    const angle = Math.random() * Math.PI - Math.PI / 6;

    // vx, vy
    const vx = Math.cos(angle) * 4; // 水平速度
    const vy = -(25 + Math.random() * 15); //  -20 ~ -35

    // highestY = y0 - (vy^2 / (2*g))  (vy是負的，但 (vy)^2 為正)
    const highestY = y0 - (vy * vy) / (2 * gravity);

    // 3. 判斷是否超過你的最低允許高度
    if (highestY > 350) {
      // 代表實際最高點比350還大 (更靠下)，跳太低了
      return;
    }

    // 2. 建立 sprite
    const sprite = new Sprite(Texture.from(textureName));
    sprite.scale.set(0.3);
    sprite.anchor.set(0.5);
    sprite._textureName = textureName;

    // 設定初始位置 (隨機)，但要先檢查是否和其他物件 x 位置太近
    let newX;
    let tooClose;
    do {
      newX = Math.random() * 1400 + 100;
      tooClose = false;
      for (let obj of this.objects) {
        // 這裡假設 100 是你定義的最小間距
        if (Math.abs(obj.sprite.x - newX) < 100) {
          tooClose = true;
          break;
        }
      }
    } while (tooClose);

    sprite.x = newX;
    sprite.y = y0; // 從畫面最底部出現

    // 5. 把這些記錄為一個物件，存入 this.objects
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
    // 或 sprite.texture.textureCacheIds[0]，視你的載入方式而定
    // 確保拿到的是我們的 "基因轉殖鳳梨.png" 之類的檔名
    console.log("被切到的是:", name);
    if (!sprite._textureName) {
      console.error("切割的 sprite 缺少 textureName");
      return;
    }

    // 判斷對錯

    const isCorrect = correctTextures[this.currentQuestion]?.includes(name);
    const isWrong = wrongTextures.includes(name);

    if (isCorrect) {
      // 成功切到正確項目
      this.comboCount++;

      // 若連續答對 >=5 (包含 5)，將分值提升為 20
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
      // 錯誤 -10 分
      this.comboCount = 0; // 連續答對中斷
      this.currentScoreValue = 10;
      this.score = Math.max(this.score - 15, 0);
      console.log("錯誤，-15分");
    } else {
      // 這裡假如有漏網之魚，或要做更細的判斷
      this.comboCount = 0; // 連續答對中斷
      this.currentScoreValue = 10;
      this.score = Math.max(this.score - 10, 0);
      console.log("錯誤，-10分");
    }

    // 創建上下半部分的 Sprite
    const topSprite = new Sprite(Texture.from(name));
    const bottomSprite = new Sprite(Texture.from(name));

    // 5. Position the halves precisely
    topSprite.scale.set(sprite.scale.x, sprite.scale.y);
    bottomSprite.scale.set(sprite.scale.x, sprite.scale.y);

    topSprite.anchor.set(0.5);
    bottomSprite.anchor.set(0.5);

    topSprite.x = sprite.x;
    topSprite.y = sprite.y;
    bottomSprite.x = sprite.x;
    bottomSprite.y = sprite.y;

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

    // 6. Add physics properties for the split pieces
    const speed = 5;
    const angle = (Math.random() * Math.PI) / 4 + Math.PI / 8; // Random angle between π/8 and 3π/8

    // Give the pieces opposite horizontal velocities
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

    // 7. Add the new sprites to the container
    this.sceneContainer.addChild(topSprite, bottomSprite);
    this.sceneContainer.addChild(topMask, bottomMask);

    // 8. Remove the original sprite
    this.sceneContainer.removeChild(sprite);
    const idx = this.objects.findIndex((obj) => obj.sprite === sprite);
    if (idx >= 0) {
      this.objects.splice(idx, 1);
    }
  }

  async GameStart() {
    await this.fadeOutScene();

    this.sceneContainer.removeChildren();
    this.sceneContainer.addChild(this.pineMomCon);
    this.pineMomCon.x = 1700;
    this.pineMomCon.y = 180;

    this.comboText = new Text({
      text: "",
      style: this.titleStyle,
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
      // 根據目前題目狀態來切換
      if (this.currentQuestion === QUESTION_TYPE.SEXUAL) {
        this.currentQuestion = QUESTION_TYPE.ASEXUAL;
      } else {
        this.currentQuestion = QUESTION_TYPE.SEXUAL;
      }
      console.log("切換題目:", this.currentQuestion);
    }, 10000); // 10秒切換一次

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
      }
      if (this.time < 0) {
        this.time = 0;
        clearInterval(timeOut);
        clearInterval(switchQuestionInterval);
        this.endGame();
      }
    }, 1000);

    this.setupMouseEvents();

    await this.fadeInScene();
  }

  async endGame() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();
    this.timeText = false;

    this.endText = new Text({ text: "遊戲結束", style: this.titleStyle });
    this.endText.anchor.set(0.5);
    this.endText.x = 960;
    this.endText.y = 540;

    this.userScoreText = new Text({
      text: `你的分數: ${this.score}`,
      style: this.defaultStyle,
    });
    this.userScoreText.anchor.set(0.5);
    this.userScoreText.x = 960;
    this.userScoreText.y = 640;

    this.sceneContainer.addChild(this.endText, this.userScoreText);

    //確定按鈕
    this.confirmButton = new Graphics();
    this.confirmButton.rect(-170, -50, 340, 100);
    this.confirmButton.fill(0xffda2a);
    this.confirmText = new Text({ text: "確定", style: this.defaultStyle });
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
      this.confirmButton.tint = 0xffffff;
    });
    this.confirmButton.on("pointerout", () => {
      this.confirmButton.tint = 0xffda2a;
    });
    leaderboard.addPlayer(this.userName, this.score);
    await this.fadeInScene();
  }

  async leaderboard() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();

    console.log(leaderboard.data);
    //標題文字
    this.rankText = new Text({ text: "排行榜", style: this.titleStyle });
    this.rankText.x = 960;
    this.rankText.y = 100;
    this.rankText.anchor.set(0.5);
    this.sceneContainer.addChild(this.rankText);

    //榜單背景
    this.userRankBG = new Graphics();
    this.userRankBG.rect(-170, -50, 340, 100);
    this.userRankBG.fill(0xffda2a);
    this.sceneContainer.addChild(this.userRankBG);

    //再試一次按鈕
    this.confirmButton = new Graphics();
    this.confirmButton.rect(-170, -50, 340, 100);
    this.confirmButton.fill(0xffda2a);
    this.confirmText = new Text({ text: "再試一次", style: this.defaultStyle });
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
      this.startTitle();
    });

    //滑鼠移入移出事件
    this.confirmButton.on("pointerover", () => {
      this.confirmButton.tint = 0xffffff;
    });
    this.confirmButton.on("pointerout", () => {
      this.confirmButton.tint = 0xffda2a;
    });

    await this.fadeInScene();
  }

  updateScoreAndTime() {
    this.timeText.text = `時間: ${this.time}`;
    this.scoreText.text = `分數: ${this.score}`;
    this.questionText.text = this.currentQuestion;
    this.questBG.tint =
      this.currentQuestion === QUESTION_TYPE.SEXUAL ? 0x779938 : 0xffffff;

    // 更新 combo 顯示
    if (this.comboCount > 1) {
      this.comboText.text = `combo ${this.comboCount - 1}`;
      const comboColors = [0x705434, 0xff0000, 0xacacac, 0x000000];
      const colorIndex = Math.min(this.comboCount - 3, comboColors.length - 1);
      this.comboText.tint = comboColors[colorIndex];
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

    // 如果移動距離過小，不處理
    if (moveDistance <= 20) return;

    // 碰撞檢查
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
        i--; // 移除對象後索引回退
      }
    }

    // 更新滑鼠位置
    this.lastPointerPos.x = this.currentPointerPos.x;
    this.lastPointerPos.y = this.currentPointerPos.y;
  }

  update(delta) {
    //確認開始遊戲
    if (!this.timeText) return;

    // 更新時間分數顯示
    this.updateScoreAndTime();

    // 更新滑鼠事件
    if (this.mouseDown) {
      this.handleMouseMovement();
    }

    // 更新所有飛行物件
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];

      // 1. 更新位置
      obj.sprite.x += obj.vx;
      obj.sprite.y += obj.vy;

      // 添加旋轉效果
      if (obj.rotation) {
        obj.sprite.rotation += obj.rotation * 0.1;
      }
      if (obj.mask) {
        obj.mask.x = obj.sprite.x;
        obj.mask.y = obj.sprite.y;
        obj.mask.rotation = obj.sprite.rotation;
      }

      obj.vy += obj.gravity;

      // 3. 如果飛出畫面，就移除
      if (obj.sprite.y > 1080) {
        // 從容器移除
        this.sceneContainer.removeChild(obj.sprite);
        if (obj.mask) this.sceneContainer.removeChild(obj.mask);
        // 從陣列移除
        this.objects.splice(i, 1);
        i--; // splice 後，索引要往回
      }
    }
  }

  // 鳳梨說明動畫效果
  animateInWave(pineappleArray) {
    // 先清除舊的 timeline
    this.stopWaveAnimation();

    // 依序對 pineappleArray 裡的每個鳳梨做動畫
    pineappleArray.forEach((pineapple, i) => {
      if (!pineapple.originalY) {
        pineapple.originalY = pineapple.y; // 記錄初始 Y 位置
      } else {
        pineapple.y = pineapple.originalY; // 重置 Y 位置
      }
      // 每個鳳梨在 Y 軸上下跳動
      const tl = gsap.to(pineapple, {
        y: pineapple.y - 30, // 往上跳 30
        duration: 0.5,
        ease: "power1.inOut",
        repeat: -1, // 無限重複
        yoyo: true, // 來回
        delay: i * 0.1, // 讓每顆延後 0.1 秒開始，營造波浪效果
      });
      this.waveTimelines.push(tl);
    });
  }

  // 停止動畫的函式
  stopWaveAnimation() {
    this.waveTimelines.forEach((tl) => {
      tl.kill();
    });
    this.waveTimelines = [];
  }
}

// utilities: 檢查線段 (x1,y1) -> (x2,y2) 與 圓心 (cx,cy)半徑 r 是否相交
function checkLineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  // 線段長度平方
  const len2 = dx * dx + dy * dy;

  // 若線段近似點(只是一個點)，直接改用點到圓心距離判斷
  if (len2 === 0) {
    const dist2 = (cx - x1) * (cx - x1) + (cy - y1) * (cy - y1);
    return dist2 <= r * r;
  }

  // 向量 AB dot AC 比例算出投影
  let t = ((cx - x1) * dx + (cy - y1) * dy) / len2;
  // t < 0 表示最近點在 [x1,y1] 之前，t > 1 表示在 [x2,y2] 之後
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  // 找線段上最近點
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;

  // 計算最近點與圓心距離
  const distX = cx - nearestX;
  const distY = cy - nearestY;
  const dist2 = distX * distX + distY * distY;

  return dist2 <= r * r;
}
