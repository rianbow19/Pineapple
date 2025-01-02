import { Application, Container } from "./pixi.mjs";
import { AssetsLoader } from "./assets.mjs";
import { Game } from "./game.mjs";

//初始化APP
let div = document.createElement("div");
div.classList.add("container");
document.body.appendChild(div);

const app = new Application();
await app.init({ background: "#E0E0E0", autoDensity: true });
app.renderer.resolution = window.devicePixelRatio;
app.renderer.events.resolution = window.devicePixelRatio;

div.appendChild(app.canvas);
app.canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
app.canvas.classList.add("appView");

//資產讀取
let assetsLoader = new AssetsLoader();
await assetsLoader.loadAllTexture();
console.log("Start Main");

//建立Container
const viewport = new Container();
const game = new Game();
viewport.addChild(game.container);
app.stage.addChild(viewport);

//每影格更新APP
app.ticker.add((delta) => {
  try {
    game.update(delta);
  } catch (error) {
    console.log(error);
  }
});

function onWindowResize() {
  const isPortrait = window.innerHeight > window.innerWidth;
  let vpScale = isPortrait
    ? Math.min(window.innerWidth / 1080, window.innerHeight / 1920)
    : Math.min(window.innerWidth / 1920, window.innerHeight / 1080);

  if (isPortrait) {
    app.renderer.resize(1080 * vpScale, 1920 * vpScale);
    viewport.rotation = Math.PI / 2;
    viewport.position.set(1080 * vpScale, 0); // 若有位移偏差，可適當微調
  } else {
    app.renderer.resize(1920 * vpScale, 1080 * vpScale);
    viewport.rotation = 0;
    viewport.position.set(0, 0);
  }

  viewport.scale.set(vpScale); // 確保縮放應用到 viewport
}
window.addEventListener("load", onWindowResize);
window.addEventListener("resize", onWindowResize);
onWindowResize();
