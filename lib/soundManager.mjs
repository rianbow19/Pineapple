const volume = 0.5;

// 遊戲的音效管理模組
const createSound = (src, volume = volume) => {
  const sound = new Audio(src);
  sound.volume = volume;
  sound.preload = "auto";
  return sound;
};

// 初始化所有遊戲音效
export const gameSound = {
  readyGo: createSound("sounds/ready_go.m4a", volume),
  cut: createSound("sounds/shu.m4a", volume),
  correct: createSound("sounds/correct.m4a", volume),
  wrong: createSound("sounds/wrong.m4a", volume),
  winRank: createSound("sounds/win_rank.mp3", volume * 0.5),
  uhOh: createSound("sounds/uh_oh.mp3", volume),
  select: createSound("sounds/select.m4a", volume),
  button: createSound("sounds/button.m4a", volume),
  change: createSound("sounds/change.m4a", volume),
  bgm: createSound("sounds/sand_castle.mp3", volume),
  bgm2: createSound("sounds/robot_city.mp3", volume),
};

// 跟踪當前正在播放的音效
let currentlyPlaying = [];
let bgmPlaying = null; // 跟踪當前正在播放的背景音樂

// 播放音效並處理錯誤
export const playSound = (sound) => {
  try {
    // 如果播放的是背景音樂，單獨處理
    if (sound === gameSound.bgm || sound === gameSound.bgm2) {
      if (bgmPlaying) {
        bgmPlaying.pause();
        bgmPlaying.currentTime = 0;
      }
      sound.loop = true; // 設置背景音樂循環播放
      sound.play().catch((error) => console.log("背景音樂播放錯誤:", error));
      bgmPlaying = sound;
      return;
    }

    // 停止所有當前正在播放的音效
    currentlyPlaying.forEach((playingSound) => {
      playingSound.pause();
      playingSound.currentTime = 0;
    });

    // 清空當前播放的音效數組
    currentlyPlaying = [];

    // 播放新的音效
    sound.currentTime = 0;
    sound.play().catch((error) => console.log("音效播放錯誤:", error));

    // 將新的音效添加到當前播放的音效數組中
    currentlyPlaying.push(sound);
  } catch (error) {
    console.log("音效錯誤:", error);
  }
};

// 停止播放背景音樂
export const stopBgm = () => {
  if (bgmPlaying) {
    bgmPlaying.pause();
    bgmPlaying.currentTime = 0;
    bgmPlaying = null;
  }
};