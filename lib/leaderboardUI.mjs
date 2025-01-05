import { Container, Graphics, Text } from "./pixi.mjs";
import { gsap } from "../node_modules/gsap/index.js";
import { leaderboard } from "./leaderboardData.mjs";

// Constants for leaderboard layout
const VIEWPORT_WIDTH = 1000;
const VIEWPORT_HEIGHT = 600;
const ENTRY_HEIGHT = 100;
const START_X = 460;
const START_Y = 200;

export class LeaderboardUI {
  constructor(game) {
    this.game = game;
    this.currentScrollAnimation = null;
    this.scrollThrottleTimeout = null;
    this.container = new Container();
  }

  // Creates text styles used in the leaderboard
  createStyles() {
    return {
      default: this.game.defaultStyle,
      info: this.game.infoStyle,
      info2: this.game.infoStyle2,
    };
  }

  // Creates a single entry container for the leaderboard
  createEntryContainer(player, index, isAnimated = false) {
    const styles = this.createStyles();
    const entryContainer = new Container();
    entryContainer.y = index * ENTRY_HEIGHT;

    if (isAnimated) {
      entryContainer.y += ENTRY_HEIGHT;
      entryContainer.alpha = 0;
    }

    // Create background for entry
    const entryBG = new Graphics();
    entryBG.roundRect(0, 0, VIEWPORT_WIDTH - 20, 80, 10);
    entryBG.fill(player.name === this.game.userName ? 0xffda2a : 0xf0fff0);
    entryBG.stroke({ width: 3, color: 0x779938 });

    // Add ranking medals for top 3
    let rankPrefix = "";
    if (index === 0) rankPrefix = "🥇 ";
    else if (index === 1) rankPrefix = "🥈 ";
    else if (index === 2) rankPrefix = "🥉 ";

    // Create text elements
    const rankText = new Text({
      text: `${rankPrefix}${index + 1}`,
      style: styles.default,
    });
    rankText.x = 40;
    rankText.y = 20;

    const nameText = new Text({
      text: player.name,
      style: styles.default,
    });
    nameText.x = 270;
    nameText.y = 20;

    const scoreText = new Text({
      text: player.score.toString(),
      style: styles.default,
    });
    scoreText.x = 720;
    scoreText.y = 20;

    entryContainer.addChild(entryBG, rankText, nameText, scoreText);
    return entryContainer;
  }

  // Creates the scrollbar elements
  createScrollbar(maxScroll) {
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
      (VIEWPORT_HEIGHT / (leaderboard.data.length * ENTRY_HEIGHT)) *
        VIEWPORT_HEIGHT
    );

    const scrollbarHandle = new Graphics();
    scrollbarHandle.roundRect(0, 0, 20, handleHeight, 10);
    scrollbarHandle.fill(0x779938);
    scrollbarHandle.x = START_X + VIEWPORT_WIDTH + 10;
    scrollbarHandle.y = START_Y;

    return { scrollbarBG, scrollbarHandle, handleHeight };
  }

  // Creates scroll indicators
  createScrollIndicators() {
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

    return { topIndicator, bottomIndicator };
  }

  // Creates the retry button
  createRetryButton(cleanup) {
    const styles = this.createStyles();
    const retryButton = new Graphics();
    retryButton.roundRect(-170, -50, 340, 100, 20);
    retryButton.fill(0xffffff);
    retryButton.stroke({ width: 10, color: 0x6a8783 });

    const retryText = new Text({
      text: "再試一次",
      style: styles.info2,
    });
    retryText.anchor.set(0.5);

    const retryContainer = new Container();
    retryContainer.addChild(retryButton, retryText);
    retryContainer.x = START_X + VIEWPORT_WIDTH / 2;
    retryContainer.y = START_Y + VIEWPORT_HEIGHT + 100;

    // Add button interactions
    retryButton.eventMode = "static";
    retryButton.cursor = "pointer";
    retryButton.on("pointerdown", () => {
      cleanup();
      this.container.removeChildren();
      this.game.startTitle();
    });
    retryButton.on("pointerover", () => {
      retryButton.tint = 0xffda2a;
      retryButton.scale.set(1.05);
      retryText.scale.set(1.05);
    });
    retryButton.on("pointerout", () => {
      retryButton.tint = 0xffffff;
      retryButton.scale.set(1);
      retryText.scale.set(1);
    });

    return retryContainer;
  }

  // Updates the scroll position
  updateScroll(
    scrollContainer,
    currentScroll,
    maxScroll,
    scrollbarHandle,
    indicators
  ) {
    if (this.currentScrollAnimation) {
      this.currentScrollAnimation.kill();
    }

    currentScroll = Math.max(0, Math.min(currentScroll, maxScroll));

    this.currentScrollAnimation = gsap.to(scrollContainer, {
      y: START_Y - currentScroll,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: () => {
        const scrollPercentage = currentScroll / maxScroll;
        const scrollRange = VIEWPORT_HEIGHT - scrollbarHandle.height;
        scrollbarHandle.y = START_Y + scrollRange * scrollPercentage;

        indicators.topIndicator.visible = currentScroll > 0;
        indicators.bottomIndicator.visible = currentScroll < maxScroll;
      },
    });

    return currentScroll;
  }

  // Renders the entire leaderboard
  async render() {
    const styles = this.createStyles();

    // Create main background
    const bgRect = new Graphics();
    bgRect.roundRect(START_X, START_Y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 20);
    bgRect.fill(0xffffff);
    bgRect.stroke({ width: 5, color: 0x779938 });
    this.container.addChild(bgRect);

    // Create mask for scrolling content
    const mask = new Graphics();
    mask.roundRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 20);
    mask.fill(0xffffff);
    mask.x = START_X;
    mask.y = START_Y;
    this.container.addChild(mask);

    // Create scroll container
    const scrollContainer = new Container();
    scrollContainer.x = START_X;
    scrollContainer.y = START_Y;
    scrollContainer.mask = mask;
    this.container.addChild(scrollContainer);

    // Calculate scroll values
    const contentHeight = leaderboard.data.length * ENTRY_HEIGHT;
    const maxScroll = Math.max(0, contentHeight - VIEWPORT_HEIGHT);

    // Create scrollbar elements
    const { scrollbarBG, scrollbarHandle, handleHeight } =
      this.createScrollbar(maxScroll);
    this.container.addChild(scrollbarBG, scrollbarHandle);

    // Create scroll indicators
    const indicators = this.createScrollIndicators();
    this.container.addChild(
      indicators.topIndicator,
      indicators.bottomIndicator
    );

    // Add header
    this.createHeader();

    // Setup scroll handling
    let currentScroll = 0;
    const throttledScroll = (e) => {
      if (this.scrollThrottleTimeout) return;

      this.scrollThrottleTimeout = setTimeout(() => {
        const newScroll = currentScroll + e.deltaY;
        currentScroll = this.updateScroll(
          scrollContainer,
          newScroll,
          maxScroll,
          scrollbarHandle,
          indicators
        );
        this.scrollThrottleTimeout = null;
      }, 16);
    };

    bgRect.eventMode = "static";
    bgRect.on("wheel", throttledScroll);

    // Add all entries
    this.addEntries(scrollContainer, maxScroll, handleHeight);

    // Add retry button
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

    const retryButton = this.createRetryButton(cleanup);
    this.container.addChild(retryButton);
  }

  // Creates the header section of the leaderboard
  createHeader() {
    const styles = this.createStyles();

    const headerBG = new Graphics();
    headerBG.roundRect(START_X, START_Y - 80, VIEWPORT_WIDTH, 60, 10);
    headerBG.fill(0x779938);

    const rankHeader = new Text({ text: "排名", style: styles.info2 });
    rankHeader.x = START_X + 40;
    rankHeader.y = START_Y - 70;

    const nameHeader = new Text({ text: "玩家", style: styles.info2 });
    nameHeader.x = START_X + 270;
    nameHeader.y = START_Y - 70;

    const scoreHeader = new Text({ text: "分數", style: styles.info2 });
    scoreHeader.x = START_X + 720;
    scoreHeader.y = START_Y - 70;

    this.container.addChild(headerBG, rankHeader, nameHeader, scoreHeader);
  }

  // Adds all entries to the leaderboard
  addEntries(scrollContainer, maxScroll, handleHeight) {
    const styles = this.createStyles();

    leaderboard.data.forEach((player, index) => {
      const isCurrentPlayer = player.name === this.game.userName;
      const entryContainer = this.createEntryContainer(
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

        this.animateCurrentPlayerEntry(
          scrollContainer,
          entryContainer,
          targetScroll,
          index,
          handleHeight
        );
      }
    });

    const isOnLeaderboard = leaderboard.data.some(
      (player) => player.name === this.game.userName
    );

    if (!isOnLeaderboard) {
      const encourageText = new Text({
        text: "噢不！找不到你，別灰心！再接再厲！",
        style: styles.info,
      });
      encourageText.anchor.set(0.5);
      encourageText.x = START_X + VIEWPORT_WIDTH / 2;
      encourageText.y = START_Y - 120;
      this.container.addChild(encourageText);
    }
  }

  // Animates the current player's entry
  animateCurrentPlayerEntry(
    scrollContainer,
    entryContainer,
    targetScroll,
    index,
    handleHeight
  ) {
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
}
