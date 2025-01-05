import { TextStyle } from "./pixi.mjs";

const defaultStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 45,
  fontWeight: "bold",
  fill: "#000000",
});

const titleStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 80,
  fontWeight: "bold",
  fill: "#779938",
  stroke: { color: "#ffffff", width: 15, join: "round" },
});

const scoreStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 60,
  fontWeight: "bold",
  fill: "#ffffff",
  stroke: { color: "#000000", width: 15, join: "round" },
});

const comboStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 80,
  fontWeight: "bold",
  fill: "#ffd700",
  stroke: { color: "#ffffff", width: 15, join: "round" },
});

const infoStyle = new TextStyle({
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

const infoStyle2 = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 45,
  fontWeight: "bold",
  fill: "#F0FFF0",
  stroke: { color: "#3C3C3C", width: 15, join: "round" },
});

export {
  defaultStyle,
  titleStyle,
  scoreStyle,
  comboStyle,
  infoStyle,
  infoStyle2,
};
