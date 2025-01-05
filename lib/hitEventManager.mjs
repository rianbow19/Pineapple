import { Graphics } from "./pixi.mjs";
import { playSound, gameSound } from "./soundManager.mjs";

//多邊形碰撞區域的映射表
const COLLISION_POLYGONS = {
  "草莓.png": [
    260, -2.55, 421.25, -28.8, 706.25, 102.45, 788.75, 282.45, 687.5, 522.45, 571.25, 698.7, 361.25, 792.45, 248.75, 751.2, 80, 548.7, 27.5, 319.95,
    72.5, 79.95,
  ],
  "香蕉.png": [
    260, -2.55, 421.25, -28.8, 539.21, 112.15, 595.46, 355.9, 527.96, 629.65, 362.96, 802.15, 164.21, 907.15, 115.46, 847.15, 171.71, 712.15, 252.58,
    429.96, 201.71, 145.9,
  ],
  "基因轉殖鳳梨.png": [
    252.5, 159.95, 567.5, 216.2, 668.75, 452.45, 668.75, 666.2, 608.75, 876.2, 466.25, 999.95, 256.25, 1018.7, 80, 939.95, 5, 823.7, -6.25, 666.2,
    27.5, 448.7, 128.75, 253.7,
  ],
  "種子鳳梨.png": [
    293.75, 77.45, 501.61, 177.36, 651.61, 398.61, 707.86, 657.36, 650, 793.7, 507.5, 917.45, 297.5, 936.2, 121.25, 857.45, 46.25, 741.2, -38.39,
    484.86, -15.89, 282.36, 92.86, 154.86,
  ],
  "冠芽鳳梨.png": [
    317.83, -7.5, 432, -17.5, 447.83, 32.5, 367.83, 87.5, 315.33, 152.5, 397.83, 242.5, 469.5, 395, 492.83, 564.17, 470.33, 721.67, 412.83, 839.17,
    295.33, 929.17, 115.33, 961.67, -67.17, 919.17, -194.67, 789.17, -237.17, 591.67, -207.17, 394.17, -127.17, 252.5, -47.17, 157.5, -132.17, 57.5,
    -74.67, -13.33,
  ],
  "組織培養的鳳梨.png": [
    411.5, 87.7, 610.25, 218.95, 640.25, 417.7, 645.61, 596.36, 580.25, 800.2, 454.36, 930.11, 251.86, 967.61, 40.25, 893.95, -85.64, 727.61, -64.75,
    477.7, 36.5, 316.45, 220.25, 173.95,
  ],
  "裔芽鳳梨.png": [
    205.5, 285.5, 430.5, 368, 565.5, 270.5, 423, 600.5, 610.5, 578, 475.5, 758, 625.5, 975.5, 633, 1290.5, 490.5, 1493, 273, 1545.5, 123, 1515.5,
    -34.5, 1358, -57, 1193, -19.5, 975.5, 85.5, 810.5, 205.5, 743, 63, 540.5, 205.5, 540.5, 123, 315.5, 235.5, 398,
  ],
  "吸芽鳳梨.png": [
    515, 161.5, 522.5, 326.5, 732.5, 199, 485, 499, 732.5, 274, 500, 604, 560, 611.5, 440, 821.5, 567.5, 1016.5, 597.5, 1324, 455, 1526.5, 237.5,
    1579, 87.5, 1549, -70, 1391.5, -92.5, 1226.5, -55, 1009, 50, 844, 260, 739, 252.5, 499, 305, 634, 365, 206.5, 410, 319,
  ],
};

class HitEventManager {
  constructor(game) {
    this.game = game;

    this.mouseState = {
      isDown: false, // 滑鼠是否按下
      startPos: { x: 0, y: 0 }, // 滑鼠按下起始位置
      currentPos: { x: 0, y: 0 }, // 當前滑鼠位置
      lastCutTime: 0, // 上次切割時間（用於冷卻）
      MIN_CUT_DISTANCE: 20, // 最小切割距離
      COOLDOWN: 100, // 切割冷卻時間（毫秒）
      NEARBY_RANGE: 100, // 連帶切割的範圍
      pressStartTime: 0, // 記錄按下的時間
      MAX_PRESS_DURATION: 200, // 最大允許按下時間（毫秒）
    };

    this.trailSystem = {
      graphics: new Graphics(), // 用於繪製滑鼠痕跡
      currentLine: null, // 當前正在繪製的線條
      lines: [], // 儲存所有活動中的線條
      LINE_LIFETIME: 300, // 線條存在時間（毫秒）
      LINE_FADE_TIME: 200, // 線條淡出時間（毫秒）
      LINE_COLOR: 0xffffff, // 線條顏色
      LINE_WIDTH: 20, // 線條寬度
    };
    this.mouseState.cutSoundPlayed = false;
  }

  setupMouseEvents() {
    //碰撞偵測
    const hitArea = new Graphics();
    hitArea.rect(0, 0, 1920, 1080);
    hitArea.fill(0xff0000);
    hitArea.alpha = 0;
    this.game.sceneContainer.addChild(hitArea);

    // 設置互動
    hitArea.eventMode = "static";
    hitArea.on("pointerdown", (e) => {
      if (!this.game.isGameRunning) return;

      const pos = this.game.sceneContainer.toLocal(e.global);
      this.mouseState.isDown = true;
      this.mouseState.startPos = { x: pos.x, y: pos.y };
      this.mouseState.currentPos = { x: pos.x, y: pos.y };
      this.mouseState.pressStartTime = Date.now();
      this.startNewTrailLine(pos);
    });

    // 滑鼠放開事件
    hitArea.on("pointerup", () => {
      this.mouseState.isDown = false;
      this.mouseState.pressStartTime = 0;
      this.endCurrentTrailLine();
    });

    // 滑鼠移動事件
    hitArea.on("pointermove", (e) => {
      if (!this.game.isGameRunning || !this.mouseState.isDown) return;
      if (!this.mouseState.cutSoundPlayed) {
        playSound(gameSound.cut);
        this.mouseState.cutSoundPlayed = true;
      }
      // 檢查按下時間是否超過限制
      const pressDuration = Date.now() - this.mouseState.pressStartTime;
      if (pressDuration > this.mouseState.MAX_PRESS_DURATION) {
        // 如果超過時間，自動觸發放開事件
        this.mouseState.isDown = false;
        this.mouseState.pressStartTime = 0;
        this.endCurrentTrailLine();
        return;
      }

      const pos = this.game.sceneContainer.toLocal(e.global);
      this.mouseState.currentPos = { x: pos.x, y: pos.y };

      this.updateTrailLine(pos);
      this.checkCutting();
    });
  }
  startNewTrailLine(pos) {
    // 創建新的線條對象
    this.trailSystem.currentLine = {
      points: [pos.x, pos.y],
      startTime: Date.now(),
      alpha: 1,
    };
    this.trailSystem.lines.push(this.trailSystem.currentLine);
  }

  updateTrailLine(pos) {
    if (!this.trailSystem.currentLine) return;

    // 添加新的點到當前線條
    this.trailSystem.currentLine.points.push(pos.x, pos.y);

    // 重新繪製所有線條
    this.drawTrailLines();
  }

  endCurrentTrailLine() {
    this.trailSystem.currentLine = null;
    this.mouseState.cutSoundPlayed = false;
  }

  drawTrailLines() {
    const graphics = this.trailSystem.graphics;
    graphics.clear();

    const currentTime = Date.now();

    // 繪製所有活動中的線條
    this.trailSystem.lines = this.trailSystem.lines.filter((line) => {
      const age = currentTime - line.startTime;

      // 如果線條超過生命週期，則移除
      if (age > this.trailSystem.LINE_LIFETIME) return false;

      // 計算線條透明度
      let alpha = 1;
      if (age > this.trailSystem.LINE_LIFETIME - this.trailSystem.LINE_FADE_TIME) {
        alpha = 1 - (age - (this.trailSystem.LINE_LIFETIME - this.trailSystem.LINE_FADE_TIME)) / this.trailSystem.LINE_FADE_TIME;
      }

      // 設定線條樣式
      graphics.setStrokeStyle({
        width: this.trailSystem.LINE_WIDTH,
        color: this.trailSystem.LINE_COLOR,
        alpha: alpha,
        cap: "round",
        join: "round",
      });

      graphics.beginPath();

      // 繪製線條
      for (let i = 0; i < line.points.length; i += 2) {
        if (i === 0) {
          graphics.moveTo(line.points[i], line.points[i + 1]);
        } else {
          graphics.lineTo(line.points[i], line.points[i + 1]);
        }
      }

      graphics.stroke();

      return true;
    });
  }

  checkCutting() {
    const now = Date.now();
    // 檢查冷卻時間
    if (now - this.mouseState.lastCutTime < this.mouseState.COOLDOWN) {
      return;
    }

    const { startPos, currentPos, MIN_CUT_DISTANCE, NEARBY_RANGE } = this.mouseState;

    // 計算移動距離和速度
    const moveDistance = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));

    // 如果移動距離太小，不處理切割
    if (moveDistance < MIN_CUT_DISTANCE) {
      return;
    }

    // 建立已切割物件的集合，避免重複切割
    const cutObjects = new Set();

    // 檢查所有物件
    for (let i = 0; i < this.game.objects.length; i++) {
      const obj = this.game.objects[i];
      if (!obj.canBeCut || cutObjects.has(obj)) continue;

      // 取得物件的碰撞多邊形
      const polygonPoints = COLLISION_POLYGONS[obj.sprite._textureName];
      if (!polygonPoints) continue;

      // 根據物件位置和縮放調整碰撞區域
      const transformedPolygon = this.transformPolygon(
        polygonPoints,
        obj.sprite.x - 50,
        obj.sprite.y - 80,
        obj.sprite.scale.x,
        obj.sprite.rotation,
        1,
        obj.sprite.width / 2,
        obj.sprite.height / 2
      );

      // 檢查切線是否與多邊形相交
      if (this.checkLinePolygonCollision(startPos.x, startPos.y, currentPos.x, currentPos.y, transformedPolygon)) {
        cutObjects.add(obj);

        // 尋找附近的可切割物件
        for (const nearbyObj of this.game.objects) {
          if (!nearbyObj.canBeCut || cutObjects.has(nearbyObj)) continue;

          const distance = Math.sqrt(Math.pow(obj.sprite.x - nearbyObj.sprite.x, 2) + Math.pow(obj.sprite.y - nearbyObj.sprite.y, 2));

          if (distance <= NEARBY_RANGE) {
            cutObjects.add(nearbyObj);
          }
        }
      }
    }

    // 執行切割
    if (cutObjects.size > 0) {
      this.mouseState.lastCutTime = now;
      for (const obj of cutObjects) {
        this.game.handleCut(obj.sprite);
      }
    }

    // 更新起始位置為當前位置
    this.mouseState.startPos = { ...this.mouseState.currentPos };
  }

  // 轉換多邊形頂點
  transformPolygon(polygon, x, y, scale, rotation, globalScale, offsetX, offsetY) {
    const transformed = [];
    for (let i = 0; i < polygon.length; i += 2) {
      const relativeX = polygon[i] - offsetX;
      const relativeY = polygon[i + 1] - offsetY;

      // 應用縮放
      const px = relativeX * globalScale * scale;
      const py = relativeY * globalScale * scale;

      // 應用旋轉
      const rotatedX = px * Math.cos(rotation) - py * Math.sin(rotation);
      const rotatedY = px * Math.sin(rotation) + py * Math.cos(rotation);

      // 應用平移
      transformed.push(rotatedX + x, rotatedY + y);
    }
    return transformed;
  }

  // 檢查線段是否與多邊形相交
  checkLinePolygonCollision(x1, y1, x2, y2, polygonPoints) {
    for (let i = 0; i < polygonPoints.length; i += 2) {
      const j = (i + 2) % polygonPoints.length;
      const px1 = polygonPoints[i];
      const py1 = polygonPoints[i + 1];
      const px2 = polygonPoints[j];
      const py2 = polygonPoints[j + 1];

      if (this.checkLineIntersection(x1, y1, x2, y2, px1, py1, px2, py2)) {
        return true;
      }
    }
    return false;
  }

  // 檢查兩線段是否相交
  checkLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denominator === 0) return false;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }
}

export { HitEventManager, COLLISION_POLYGONS };
