import { Assets } from "./pixi.mjs";

const resource = [
  "吸芽鳳梨.png",
  "冠芽鳳梨.png",
  "香蕉.png",
  "草莓.png",
  "基因轉殖鳳梨.png",
  "組織培養的鳳梨.png",
  "裔芽鳳梨.png",
  "種子鳳梨.png",
  "鳳梨卡車.png",
  "鳳梨生態秘笈.png",
  "鳳梨媽媽.png",
  "標題.png",
  "BG.png",
  "bookBG.png",
  "close.png",
];

class AssetsLoader {
  constructor() {
    this.loadDone = false;
  }

  async loadAllTexture() {
    return new Promise((resolve, reject) => {
      let loadArray = [];

      resource.forEach((element) => {
        Assets.add({ alias: element, src: `img/${element}` });
        loadArray.push(element);
      });

      const texturesPromise = Assets.load(loadArray, this.showProgress);
      texturesPromise.then((textures) => {
        this.loadDone = true;
        console.log("Load Finished.");
        resolve(true);
      });

      texturesPromise.onerror = reject;
    });
  }

  showProgress(progress) {
    console.log(progress);
  }
}

function randomInt(start, end) {
  return Math.floor(Math.random() * (end - start + 1)) + start;
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function animateToTarget(current, target, speed, deltaTime) {
  let gap = target - current;
  let gapLength = Math.abs(gap);
  let step = Math.max(Math.ceil(gapLength * speed * deltaTime), 1);
  if (gapLength < 1) {
    current = target;
  } else {
    current += gap > 0 ? step : -step;
  }
  return current;
}

export { randomInt, mapRange, animateToTarget };
export { AssetsLoader };
