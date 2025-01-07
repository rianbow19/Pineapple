const volume = 0.4;

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
  cut: createSound("sounds/shu.m4a", volume * 1.2),
  correct: createSound("sounds/correct.m4a", volume * 0.4),
  wrong: createSound("sounds/wrong.m4a", volume * 0.9),
  winRank: createSound("sounds/win_rank.mp3", volume),
  uhOh: createSound("sounds/uh_oh.mp3", volume),
  select: createSound("sounds/select.m4a", volume),
  button: createSound("sounds/button.m4a", volume),
  change: createSound("sounds/change.m4a", volume),
  timeUp: createSound("sounds/bi.m4a", volume * 0.6),
};

// 跟踪當前正在播放的音效
let currentlyPlaying = [];

// 播放change音效時不會被其他音效蓋掉
export const playChangeSound = () => {
  const changeSound = gameSound.change;
  changeSound.currentTime = 0;
  changeSound.play().catch((error) => console.log("change音效播放錯誤:", error));
};

// 播放音效並處理錯誤
export const playSound = (sound) => {
  try {
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
