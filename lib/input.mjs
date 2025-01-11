import { Container, Graphics, Rectangle, Text, TextStyle } from "./pixi.mjs";

export class TextInput extends Container {
  constructor(style = {}) {
    super();

    // 預設樣式
    const defaultStyle = {
      width: 200,
      height: 50,
      radius: 10,
      color: 0xffffff,
      stroke: 0x000000,
      stroke_width: 1,
      focus_color: 0xff8000,
      focus_width: 3,
      textColor: 0x000000,
      fontSize: 30,
      placeholder: "請輸入文字",
      placeholderColor: 0xe0e0e0,
    };

    // 合併自訂樣式與預設樣式
    this.style = { ...defaultStyle, ...style };

    // 初始化元件
    this.baseGraphic = new Graphics();
    this.blurArea = new Graphics();
    this.blurArea.hitArea = new Rectangle(-5000, -5000, 10000, 10000);
    this.blurArea.eventMode = "passive";

    this.enterLine = new Graphics();
    this.enterLine.rect(-4, -this.style.fontSize / 2 - 5, 4, this.style.fontSize + 5);
    this.enterLine.fill(this.style.focus_color);
    this.enterLine.visible = false;
    setInterval(() => {
      this.enterLine.alpha = !this.enterLine.alpha;
    }, 500);

    this.showtext = new Text({
      text: "",
      style: new TextStyle({
        fill: this.style.textColor,
        fontSize: this.style.fontSize,
      }),
    });
    this.showtext.anchor.set(0.5);

    this.placeholder = new Text({
      text: this.style.placeholder,
      style: new TextStyle({
        fill: this.style.placeholderColor,
        fontSize: this.style.fontSize,
      }),
    });
    this.placeholder.anchor.set(0.5);

    this.addChild(this.blurArea, this.baseGraphic, this.placeholder, this.showtext, this.enterLine);

    // 初始化狀態
    this.isFocus = false;

    // 繪製與事件綁定
    this.drawRect();
    this.createDOMInput();
    this.bindDom();
  }

  get text() {
    return this.showtext.text;
  }

  drawRect() {
    this.baseGraphic.clear();
    this.style.radius
      ? this.baseGraphic.roundRect(-this.style.width / 2, -this.style.height / 2, this.style.width, this.style.height, this.style.radius)
      : this.baseGraphic.rect(-this.style.width / 2, -this.style.height / 2, this.style.width, this.style.height);
    this.baseGraphic.fill({ color: this.style.color });
    this.baseGraphic.stroke({ color: this.style.stroke, width: this.style.stroke_width });
  }

  drawFocus() {
    this.style.radius
      ? this.baseGraphic.roundRect(-this.style.width / 2, -this.style.height / 2, this.style.width, this.style.height, this.style.radius)
      : this.baseGraphic.rect(-this.style.width / 2, -this.style.height / 2, this.style.width, this.style.height);
    this.baseGraphic.stroke({ color: this.style.focus_color, width: this.style.focus_width });
  }

  createDOMInput() {
    // 建立 DOM 輸入框
    this.domInput = document.createElement("input");
    this.domInput.type = "text";

    // 手機鍵盤優化設定
    this.domInput.style.position = "fixed";
    this.domInput.style.opacity = "0";
    this.domInput.style.pointerEvents = "none";
    this.domInput.style.width = "100px";
    this.domInput.style.height = "100px";
    this.domInput.style.fontSize = "16px"; // Prevent zoom on iOS
    this.domInput.autocomplete = "off";
    this.domInput.autocorrect = "off";
    this.domInput.autocapitalize = "off";
    this.domInput.spellcheck = false;

    document.body.appendChild(this.domInput);

    this.domInput.addEventListener("input", (event) => {
      this.showtext.text = event.target.value;
      this.enterLine.x = this.showtext.width / 2 + 5;
      this.placeholder.visible = this.showtext.text.length == 0;
    });
  }

  bindDom() {
    this.baseGraphic.eventMode = "static";
    this.baseGraphic.cursor = "text";

    const showMobileKeyboard = () => {
      // Position input near click for better UX
      const bounds = this.baseGraphic.getBounds();
      const globalPosition = this.getGlobalPosition();

      this.domInput.style.top = `${globalPosition.y}px`;
      this.domInput.style.left = `${globalPosition.x}px`;
      this.domInput.style.display = "block";
      this.domInput.focus();
    };

    this.baseGraphic
      .on("pointerdown", () => {
        this.isFocus = true;
        this.enterLine.visible = true;
        this.blurArea.eventMode = "static";
        this.drawRect();
        this.drawFocus();
        showMobileKeyboard();
      })
      .on("touchstart", (e) => {
        e.stopPropagation();
        showMobileKeyboard();
      });

    this.blurArea.on("pointerdown", () => {
      this.isFocus = false;
      this.enterLine.visible = false;
      this.drawRect();
      this.domInput.blur();
      this.domInput.style.display = "none";
      this.blurArea.eventMode = "passive";
    });

    window.addEventListener("keydown", () => {
      if (this.isFocus === true) {
        this.domInput.focus();
      }
    });
  }
}
