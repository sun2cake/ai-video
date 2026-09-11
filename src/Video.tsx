import {
  AbsoluteFill,
  Html5Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  sceneTimings,
  TOTAL_FRAMES,
  TRANSITION_FRAMES,
  type StoryboardScene,
} from "./storyboard";
import narrationTimestampData from "../public/audio/agent_xiezuo/narration-timestamps.json";
import sceneOneMiddle from "../content/agent_xiezuo/bg/midle.svg";
import { theme } from "./theme";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// 全片统一的状态色：青绿主色、浅蓝辅助、珊瑚红风险、薄荷绿成功、灰蓝中性。
const normalizeAccent = (color: string) => {
  const colorMap: Record<string, string> = {
    "#a78bfa": "#4de1d4",
    "#f472b6": "#4de1d4",
    "#38bdf8": "#8bdcff",
    "#60a5fa": "#8bdcff",
    "#fbbf24": "#4de1d4",
    "#34d399": "#8ff7c6",
    "#8ff7c6": "#8ff7c6",
    "#fb7185": "#fb7185",
    "#8fa4ad": "#8fa4ad",
  };
  return colorMap[color.toLowerCase()] ?? color;
};

type SceneProps = {
  scene: StoryboardScene;
  sceneIndex: number;
  baseDurationInFrames: number;
  pointEntryFrames: number[];
};

const isSpokenCharacter = (character: string) =>
  character.length > 0 &&
  ((character.charCodeAt(0) >= 0x4e00 && character.charCodeAt(0) <= 0x9fff) ||
    /[A-Za-z0-9]/.test(character));

type TimedWord = {
  text: string;
  start: number;
  end: number;
};

const narrationTimestamps = narrationTimestampData.scenes as Array<{
  words: TimedWord[];
}>;

type SceneOneAsset = {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

const getPhraseStartSeconds = (
  words: TimedWord[],
  phrase: string,
  fallback: number,
) => {
  for (let startIndex = 0; startIndex < words.length; startIndex++) {
    let candidate = "";
    for (let index = startIndex; index < words.length; index++) {
      candidate += words[index].text;
      if (candidate === phrase) return words[startIndex].start;
      if (!phrase.startsWith(candidate)) break;
    }
  }
  return fallback;
};

const sceneOneWords = narrationTimestamps[0]?.words ?? [];
const sceneOneEntranceSeconds = {
  demand: getPhraseStartSeconds(sceneOneWords, "需求忘了", 6.64),
  testing: getPhraseStartSeconds(sceneOneWords, "测试漏了", 7.9),
  code: getPhraseStartSeconds(sceneOneWords, "代码也越写越乱", 8.98),
  page: getPhraseStartSeconds(sceneOneWords, "刚写完页面", 11.28),
  database: getPhraseStartSeconds(sceneOneWords, "数据库", 12.2),
  safety: getPhraseStartSeconds(sceneOneWords, "安全检查", 13.1),
  security: getPhraseStartSeconds(
    sceneOneWords,
    "数据库和安全检查",
    16.58,
  ),
};

type SceneOneFragmentProps = {
  assets: SceneOneAsset[];
  startSeconds: number;
  fromX: number;
  fromY: number;
  fromRotation: number;
};

const SceneOneFragment: React.FC<SceneOneFragmentProps> = ({
  assets,
  startSeconds,
  fromX,
  fromY,
  fromRotation,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSeconds * fps);
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
    durationInFrames: 24,
  });
  const opacity = interpolate(progress, [0, 0.28], [0, 1], clamp);
  const blur = interpolate(progress, [0, 1], [8, 0], clamp);
  const scale = interpolate(progress, [0, 1], [0.9, 1], clamp);
  const translateX = interpolate(progress, [0, 1], [fromX, 0], clamp);
  const translateY = interpolate(progress, [0, 1], [fromY, 0], clamp);
  const rotation = interpolate(progress, [0, 1], [fromRotation, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        opacity,
        filter: `blur(${blur}px) drop-shadow(0 0 18px rgba(77, 225, 212, 0.34))`,
        transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotate(${rotation}deg)`,
        willChange: "filter, opacity, transform",
      }}
    >
      {assets.map((asset) => (
        <Img
          key={asset.src}
          src={asset.src}
          style={{
            position: "absolute",
            left: asset.left,
            top: asset.top,
            width: asset.width,
            height: asset.height,
            objectFit: "contain",
            filter: "drop-shadow(0 0 12px rgba(77, 225, 212, 0.16))",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const sceneOneOverloadSeconds = {
  tasks: 2.5,
  website: getPhraseStartSeconds(sceneOneWords, "校园二手书网站", 11.28),
};

type SceneOneTaskCardProps = {
  left: number;
  top: number;
  title: string;
  detail: string;
  status?: string;
  statusSeconds?: number;
  startSeconds?: number;
  accent?: string;
  fromX?: number;
  fromY?: number;
};

const SceneOneTaskCard: React.FC<SceneOneTaskCardProps> = ({
  left,
  top,
  title,
  detail,
  status,
  statusSeconds,
  startSeconds = sceneOneOverloadSeconds.tasks,
  accent = theme.colors.accent,
  fromX = 0,
  fromY = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - Math.round(startSeconds * fps),
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.8 },
    durationInFrames: 24,
  });
  const statusFrame = Math.round((statusSeconds ?? -100) * fps);
  const statusProgress = interpolate(
    frame,
    [statusFrame, statusFrame + 10, statusFrame + 24],
    [0, 1, 1],
    clamp,
  );
  const x = interpolate(enter, [0, 1], [fromX, 0], clamp);
  const y = interpolate(enter, [0, 1], [fromY, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 300,
        height: 84,
        boxSizing: "border-box",
        padding: "14px 20px",
        border: `1px solid ${statusProgress > 0 ? "#fb7185" : `${accent}99`}`,
        borderRadius: 18,
        background: "rgba(13, 29, 43, 0.94)",
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "center",
        opacity: interpolate(enter, [0, 0.25], [0, 1], clamp) * (statusProgress > 0 ? 0.52 : 1),
        transform: `translate3d(${x}px, ${y}px, 0) scale(${1 + statusProgress * 0.04})`,
        boxShadow: `0 0 ${statusProgress > 0 ? 24 : 12}px ${statusProgress > 0 ? "#fb7185" : `${accent}33`}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 16 }}>
        <span style={{ color: statusProgress > 0 ? "#fb7185" : accent, fontSize: 26, fontWeight: theme.fontWeights.bold }}>
          {title}
        </span>
        <span style={{ color: theme.colors.textMuted, fontSize: 18 }}>{detail}</span>
      </div>
      {status && statusProgress > 0 ? (
        <div style={{ marginTop: 4, color: "#fb7185", fontSize: 18, fontWeight: theme.fontWeights.bold }}>
          {status}
        </div>
      ) : null}
    </div>
  );
};

const SceneOneOverloadMeter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = Math.round(sceneOneOverloadSeconds.tasks * fps);
  const progress = interpolate(frame, [start, start + 220], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 690, top: 850, width: 540, color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span>单个 Agent 负载</span>
        <span style={{ color: progress > 0.78 ? "#fb7185" : theme.colors.accent }}>{Math.round(progress * 120)}%</span>
      </div>
      <div style={{ height: 16, overflow: "hidden", borderRadius: 8, background: "rgba(143,164,173,0.2)" }}>
        <div style={{ width: `${Math.min(100, progress * 120)}%`, height: "100%", borderRadius: 8, background: progress > 0.78 ? "#fb7185" : "#60a5fa", boxShadow: "0 0 14px #fb7185" }} />
      </div>
    </div>
  );
};

const SceneOneOverload: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <SceneOneFragment assets={[{ src: sceneOneMiddle, left: 580, top: 170, width: 760, height: 665 }]} startSeconds={0.8} fromX={0} fromY={36} fromRotation={0} />
    <SceneOneTaskCard left={150} top={285} title="需求" detail="规则" status="✕ 忘记" statusSeconds={sceneOneEntranceSeconds.demand} startSeconds={sceneOneEntranceSeconds.demand} fromX={-100} accent="#a78bfa" />
    <SceneOneTaskCard left={150} top={405} title="页面" detail="设计" startSeconds={sceneOneEntranceSeconds.page} fromX={-100} accent="#f472b6" />
    <SceneOneTaskCard left={150} top={525} title="接口" detail="开发" status="⚠ 代码开始混乱" statusSeconds={sceneOneEntranceSeconds.code} startSeconds={sceneOneEntranceSeconds.code} fromX={-100} accent="#38bdf8" />
    <SceneOneTaskCard left={1470} top={285} title="数据库" detail="后端" status="未检查" statusSeconds={sceneOneEntranceSeconds.database} startSeconds={sceneOneEntranceSeconds.database} fromX={100} accent="#fbbf24" />
    <SceneOneTaskCard left={1470} top={405} title="测试" detail="验收" status="↷ 被跳过" statusSeconds={sceneOneEntranceSeconds.testing} startSeconds={sceneOneEntranceSeconds.testing} fromX={100} accent="#34d399" />
    <SceneOneTaskCard left={1470} top={525} title="安全" detail="审查" status="未检查" statusSeconds={sceneOneEntranceSeconds.safety} startSeconds={sceneOneEntranceSeconds.safety} fromX={100} accent="#fb7185" />
    <SceneOneOverloadMeter />
    <SceneThreeCard left={720} top={705} width={480} height={100} title="页面已完成" detail="但后端与安全仍是空白" startSeconds={sceneOneOverloadSeconds.website} fromY={28} accent="#fb7185" />
  </AbsoluteFill>
);

const sceneTwoWords = narrationTimestamps[1]?.words ?? [];
const sceneTwoEntranceSeconds = {
  chat: 0,
  model: getPhraseStartSeconds(sceneTwoWords, "大模型", 4.92),
  memory: getPhraseStartSeconds(sceneTwoWords, "记忆工具和目标", 7.46),
  tools: getPhraseStartSeconds(sceneTwoWords, "工具和目标", 8.26),
  goal: getPhraseStartSeconds(sceneTwoWords, "目标能够", 9.1),
  action: getPhraseStartSeconds(sceneTwoWords, "主动行动", 11.42),
  memoryExplain: getPhraseStartSeconds(sceneTwoWords, "记忆保存上下文", 14.42),
  toolsExplain: getPhraseStartSeconds(sceneTwoWords, "工具负责搜索", 16.5),
  goalExplain: getPhraseStartSeconds(sceneTwoWords, "目标则告诉", 20.56),
  modelExplain: getPhraseStartSeconds(sceneTwoWords, "大模型负责思考", 13.48),
};

type SceneTwoNodeProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  detail: string;
  icon: string;
  startSeconds: number;
  fromX?: number;
  fromY?: number;
  accent?: string;
  highlightSeconds?: number;
  detailSeconds?: number;
};

const SceneTwoNode: React.FC<SceneTwoNodeProps> = ({
  left,
  top,
  width,
  height,
  label,
  detail,
  icon,
  startSeconds,
  fromX = 0,
  fromY = 28,
  accent = theme.colors.accent,
  highlightSeconds,
  detailSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accentColor = normalizeAccent(accent);
  const progress = spring({
    frame: frame - Math.round(startSeconds * fps),
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
    durationInFrames: 24,
  });
  const opacity = interpolate(progress, [0, 0.25], [0, 1], clamp);
  const translateX = interpolate(progress, [0, 1], [fromX, 0], clamp);
  const translateY = interpolate(progress, [0, 1], [fromY, 0], clamp);
  const scale = interpolate(progress, [0, 1], [0.88, 1], clamp);
  const highlightFrame = Math.round((highlightSeconds ?? -100) * fps);
  const highlight = interpolate(
    frame,
    [highlightFrame, highlightFrame + 8, highlightFrame + 18, highlightFrame + 30],
    [0, 1, 0.35, 0],
    clamp,
  );
  const detailFrame = Math.round((detailSeconds ?? startSeconds) * fps);
  const detailProgress = spring({
    frame: frame - detailFrame,
    fps,
    config: { damping: 15, stiffness: 120 },
    durationInFrames: 18,
  });

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        boxSizing: "border-box",
        padding: "22px 28px",
        border: `1px solid ${accentColor}${highlight > 0 ? "ff" : "99"}`,
        borderRadius: 24,
        background: "rgba(13, 29, 43, 0.92)",
        boxShadow: `0 0 ${24 + highlight * 26}px ${accentColor}${highlight > 0 ? "88" : "33"}, inset 0 0 24px ${accentColor}${highlight > 0 ? "35" : "12"}`,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        opacity,
        transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale * (1 + highlight * 0.045)})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -10,
          border: `2px solid ${accent}`,
          borderRadius: 32,
          opacity: highlight,
          transform: `scale(${1 + highlight * 0.08})`,
          boxShadow: `0 0 22px ${accent}`,
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "grid",
            width: 58,
            height: 58,
            placeItems: "center",
            borderRadius: 16,
            background: `${accent}22`,
            color: accent,
            fontSize: 28,
            fontWeight: theme.fontWeights.bold,
          }}
        >
          {icon}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: accent, fontSize: 30, fontWeight: theme.fontWeights.bold }}>
            {label}
          </div>
          <div
            style={{
              marginTop: 8,
              color: theme.colors.textMuted,
              fontSize: 21,
              opacity: interpolate(detailProgress, [0, 0.25], [0, 1], clamp),
              transform: `translateY(${interpolate(detailProgress, [0, 1], [10, 0], clamp)}px)`,
            }}
          >
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
};

const SceneTwoConnector: React.FC<{
  path: string;
  startSeconds: number;
}> = ({ path, startSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round((startSeconds - 0.35) * fps);
  const progress = interpolate(
    frame,
    [startFrame, startFrame + Math.round(0.35 * fps)],
    [0, 1],
    clamp,
  );
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <path
        d={path}
        pathLength={1}
        fill="none"
        stroke="rgba(77, 225, 212, 0.18)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      <path
        d={path}
        pathLength={1}
        fill="none"
        stroke="#76d9d1"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
};

const SceneTwoDiagram: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <div
      style={{
        position: "absolute",
        left: 760,
        top: 225,
        width: 400,
        textAlign: "center",
        color: theme.colors.textMuted,
        fontFamily: theme.fonts.body,
        fontSize: 26,
        letterSpacing: "0.12em",
      }}
    >
      先是聊天，然后学会行动
    </div>
    <SceneTwoNode
      left={780}
      top={270}
      width={360}
      height={130}
      label="聊天机器人"
      detail="只能回答问题"
      icon="…"
      startSeconds={sceneTwoEntranceSeconds.chat}
      fromY={-48}
      accent="#8fa4ad"
    />
    <SceneTwoNode
      left={780}
      top={430}
      width={360}
      height={170}
      label="大模型"
      detail="负责思考与理解"
      icon="AI"
      startSeconds={sceneTwoEntranceSeconds.model}
      fromY={38}
      accent="#60a5fa"
      detailSeconds={sceneTwoEntranceSeconds.modelExplain}
      highlightSeconds={sceneTwoEntranceSeconds.modelExplain}
    />
    <SceneTwoConnector path="M 960 400 L 960 430" startSeconds={sceneTwoEntranceSeconds.model} />
    <SceneTwoConnector path="M 850 600 L 560 690" startSeconds={sceneTwoEntranceSeconds.memory} />
    <SceneTwoConnector path="M 960 600 L 960 690" startSeconds={sceneTwoEntranceSeconds.tools} />
    <SceneTwoConnector path="M 1070 600 L 1360 690" startSeconds={sceneTwoEntranceSeconds.goal} />
    <SceneTwoNode
      left={400}
      top={690}
      width={320}
      height={140}
      label="记忆"
      detail="保存上下文"
      icon="▤"
      startSeconds={sceneTwoEntranceSeconds.memory}
      fromX={-130}
      accent="#a78bfa"
      detailSeconds={sceneTwoEntranceSeconds.memoryExplain}
      highlightSeconds={sceneTwoEntranceSeconds.memoryExplain}
    />
    <SceneTwoNode
      left={800}
      top={690}
      width={320}
      height={140}
      label="工具"
      detail="搜索、写文件、调 API"
      icon="⌘"
      startSeconds={sceneTwoEntranceSeconds.tools}
      fromY={90}
      accent="#38bdf8"
      detailSeconds={sceneTwoEntranceSeconds.toolsExplain}
      highlightSeconds={sceneTwoEntranceSeconds.toolsExplain}
    />
    <SceneTwoNode
      left={1200}
      top={690}
      width={320}
      height={140}
      label="目标"
      detail="明确最终交付什么"
      icon="◎"
      startSeconds={sceneTwoEntranceSeconds.goal}
      fromX={130}
      accent="#fbbf24"
      detailSeconds={sceneTwoEntranceSeconds.goalExplain}
      highlightSeconds={sceneTwoEntranceSeconds.goalExplain}
    />
    <div
      style={{
        position: "absolute",
        left: 820,
        top: 865,
        width: 280,
        textAlign: "center",
        color: theme.colors.accent,
        fontFamily: theme.fonts.body,
        fontSize: 28,
        fontWeight: theme.fontWeights.bold,
        opacity: interpolate(
          spring({
            frame: useCurrentFrame() - Math.round(sceneTwoEntranceSeconds.action * useVideoConfig().fps),
            fps: useVideoConfig().fps,
            config: { damping: 14, stiffness: 120 },
            durationInFrames: 24,
          }),
          [0, 0.25],
          [0, 1],
          clamp,
        ),
      }}
    >
      Agent：理解任务并主动行动
    </div>
  </AbsoluteFill>
);

const sceneThreeWords = narrationTimestamps[2]?.words ?? [];
const sceneThreeEntranceSeconds = {
  manager: getPhraseStartSeconds(sceneThreeWords, "主管Agent", 1.94),
  split: getPhraseStartSeconds(sceneThreeWords, "拆出需求", 3.66),
  assign: getPhraseStartSeconds(sceneThreeWords, "分给不同Agent", 9.12),
  product: getPhraseStartSeconds(sceneThreeWords, "产品明确规则", 10.66),
  design: getPhraseStartSeconds(sceneThreeWords, "设计开始画页面", 12.44),
  development: getPhraseStartSeconds(sceneThreeWords, "开发接着写接口", 14.56),
  testing: getPhraseStartSeconds(sceneThreeWords, "测试负责找问题", 16.32),
  merge: getPhraseStartSeconds(sceneThreeWords, "主管汇总", 19.14),
};

type SceneThreeCardProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  title: string;
  detail: string;
  startSeconds: number;
  highlightSeconds?: number;
  fromX?: number;
  fromY?: number;
  accent?: string;
};

const SceneThreeCard: React.FC<SceneThreeCardProps> = ({
  left,
  top,
  width,
  height,
  title,
  detail,
  startSeconds,
  highlightSeconds,
  fromX = 0,
  fromY = 34,
  accent = theme.colors.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accentColor = normalizeAccent(accent);
  const enter = spring({
    frame: frame - Math.round(startSeconds * fps),
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.8 },
    durationInFrames: 24,
  });
  const highlightFrame = Math.round((highlightSeconds ?? -100) * fps);
  const highlight = interpolate(
    frame,
    [highlightFrame, highlightFrame + 8, highlightFrame + 18, highlightFrame + 30],
    [0, 1, 0.3, 0],
    clamp,
  );
  const opacity = interpolate(enter, [0, 0.25], [0, 1], clamp);
  const x = interpolate(enter, [0, 1], [fromX, 0], clamp);
  const y = interpolate(enter, [0, 1], [fromY, 0], clamp);
  const scale = interpolate(enter, [0, 1], [0.9, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        boxSizing: "border-box",
        padding: "20px 24px",
        border: `1px solid ${accentColor}${highlight > 0 ? "ff" : "99"}`,
        borderRadius: 20,
        background: "rgba(13, 29, 43, 0.94)",
        boxShadow: `0 0 ${18 + highlight * 26}px ${accentColor}${highlight > 0 ? "88" : "33"}`,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        opacity,
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale * (1 + highlight * 0.05)})`,
      }}
    >
      <div style={{ color: accentColor, fontSize: 28, fontWeight: theme.fontWeights.bold }}>
        {title}
      </div>
      <div style={{ marginTop: 10, color: theme.colors.textMuted, fontSize: 20 }}>
        {detail}
      </div>
      {highlight > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: -8,
            border: `2px solid ${accentColor}`,
            borderRadius: 27,
            opacity: highlight,
            boxShadow: `0 0 18px ${accentColor}`,
          }}
        />
      ) : null}
    </div>
  );
};

const SceneThreePipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mergeProgress = spring({
    frame: frame - Math.round(sceneThreeEntranceSeconds.merge * fps),
    fps,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 26,
  });
  const mergeOpacity = interpolate(mergeProgress, [0, 0.25], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <SceneThreeCard
        left={760}
        top={150}
        width={400}
        height={120}
        title="校园二手书网站"
        detail="复杂项目"
        startSeconds={0}
        fromY={-32}
        accent="#fbbf24"
      />
      <SceneThreeCard
        left={760}
        top={315}
        width={400}
        height={125}
        title="主管 Agent"
        detail="拆解任务，统一调度"
        startSeconds={sceneThreeEntranceSeconds.manager}
        highlightSeconds={sceneThreeEntranceSeconds.assign}
        accent={theme.colors.accent}
      />
      <SceneThreeCard
        left={90}
        top={555}
        width={320}
        height={130}
        title="需求"
        detail="产品 Agent"
        startSeconds={sceneThreeEntranceSeconds.split}
        highlightSeconds={sceneThreeEntranceSeconds.product}
        fromX={-110}
        accent="#a78bfa"
      />
      <SceneThreeCard
        left={480}
        top={555}
        width={320}
        height={130}
        title="设计"
        detail="设计 Agent"
        startSeconds={sceneThreeEntranceSeconds.split + 0.45}
        highlightSeconds={sceneThreeEntranceSeconds.design}
        fromX={-80}
        accent="#f472b6"
      />
      <SceneThreeCard
        left={870}
        top={555}
        width={320}
        height={130}
        title="开发"
        detail="开发 Agent"
        startSeconds={sceneThreeEntranceSeconds.split + 0.9}
        highlightSeconds={sceneThreeEntranceSeconds.development}
        accent="#38bdf8"
      />
      <SceneThreeCard
        left={1260}
        top={555}
        width={280}
        height={130}
        title="测试"
        detail="测试 Agent"
        startSeconds={sceneThreeEntranceSeconds.split + 1.35}
        highlightSeconds={sceneThreeEntranceSeconds.testing}
        fromX={80}
        accent="#34d399"
      />
      <SceneThreeCard
        left={1610}
        top={555}
        width={220}
        height={130}
        title="安全"
        detail="审查 Agent"
        startSeconds={sceneThreeEntranceSeconds.split + 1.8}
        fromX={110}
        accent="#fb7185"
      />
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d="M 960 270 L 960 315" stroke="rgba(77,225,212,0.5)" strokeWidth="3" strokeDasharray="8 10" />
        <path d="M 960 440 L 250 555 M 960 440 L 640 555 M 960 440 L 1030 555 M 960 440 L 1400 555 M 960 440 L 1720 555" stroke="rgba(118,217,209,0.42)" strokeWidth="2" fill="none" strokeDasharray="7 11" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 710,
          top: 820,
          width: 500,
          height: 86,
          display: "grid",
          placeItems: "center",
          border: "2px solid #34d399",
          borderRadius: 22,
          color: "#8ff7c6",
          fontFamily: theme.fonts.body,
          fontSize: 30,
          fontWeight: theme.fontWeights.bold,
          background: "rgba(16, 58, 52, 0.76)",
          boxShadow: "0 0 26px rgba(52, 211, 153, 0.3)",
          opacity: mergeOpacity,
          transform: `scale(${interpolate(mergeProgress, [0, 1], [0.86, 1], clamp)})`,
        }}
      >
        ✓ 可运行版本
      </div>
    </AbsoluteFill>
  );
};

const sceneFourWords = narrationTimestamps[3]?.words ?? [];
const sceneFourEntranceSeconds = {
  solo: 0,
  overload: getPhraseStartSeconds(sceneFourWords, "复杂任务太大", 2.58),
  capacity: getPhraseStartSeconds(sceneFourWords, "单个上下文", 4.9),
  lost: getPhraseStartSeconds(sceneFourWords, "丢失前面的决定", 7.99),
  split: getPhraseStartSeconds(sceneFourWords, "拆开之后", 9.52),
  test: getPhraseStartSeconds(sceneFourWords, "测试还能独立挑错", 13.65),
  result: getPhraseStartSeconds(sceneFourWords, "速度和质量同时提升", 15.86),
};

const SceneFourParallel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const capacityFrame = Math.round(sceneFourEntranceSeconds.capacity * fps);
  const lostFrame = Math.round(sceneFourEntranceSeconds.lost * fps);
  const splitFrame = Math.round(sceneFourEntranceSeconds.split * fps);
  const testFrame = Math.round(sceneFourEntranceSeconds.test * fps);
  const resultFrame = Math.round(sceneFourEntranceSeconds.result * fps);
  const capacityProgress = interpolate(frame, [capacityFrame, lostFrame], [0, 1], clamp);
  const splitProgress = spring({
    frame: frame - splitFrame,
    fps,
    config: { damping: 16, stiffness: 110 },
    durationInFrames: 34,
  });
  const testProgress = spring({
    frame: frame - testFrame,
    fps,
    config: { damping: 15, stiffness: 120 },
    durationInFrames: 26,
  });
  const resultProgress = spring({
    frame: frame - resultFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 24,
  });
  const resultOpacity = interpolate(resultProgress, [0, 0.25], [0, 1], clamp);
  const laneOpacity = interpolate(splitProgress, [0, 0.3], [0, 1], clamp);
  const singleOpacity = interpolate(splitProgress, [0, 0.7], [1, 0], clamp);
  const meterWidth = Math.min(100, capacityProgress * 112);

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div style={{ position: "absolute", left: 310, top: 150, width: 1300, textAlign: "center", color: theme.colors.text, fontFamily: theme.fonts.body }}>
        <div style={{ fontSize: 40, fontWeight: theme.fontWeights.bold }}>一个 Agent 全包</div>
        <div style={{ marginTop: 12, color: theme.colors.textMuted, fontSize: 24 }}>所有任务挤在同一条上下文车道</div>
      </div>
      <div style={{ position: "absolute", left: 360, top: 340, width: 1200, opacity: singleOpacity }}>
        <div style={{ height: 92, borderRadius: 46, border: "2px solid rgba(96,165,250,0.58)", background: "rgba(37,73,107,0.26)", boxShadow: "0 0 26px rgba(96,165,250,0.16)" }} />
        {[
          [40, "需求", "#a78bfa"],
          [290, "设计", "#f472b6"],
          [540, "后端", "#38bdf8"],
          [790, "测试", "#34d399"],
        ].map(([left, label, color]) => (
          <div key={label as string} style={{ position: "absolute", left: left as number, top: 22, width: 150, height: 48, display: "grid", placeItems: "center", borderRadius: 24, color: "#f5fbff", background: `${color as string}cc`, fontSize: 24, fontWeight: theme.fontWeights.bold, fontFamily: theme.fonts.body }}>{label}</div>
        ))}
        <div style={{ position: "absolute", right: -8, top: 18, width: 10, height: 56, borderRadius: 5, background: "#fb7185", boxShadow: "0 0 20px #fb7185" }} />
      </div>
      <div style={{ position: "absolute", left: 650, top: 500, width: 620, opacity: interpolate(frame, [capacityFrame, capacityFrame + 10], [0, 1], clamp), color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span>单个上下文容量</span><span style={{ color: meterWidth > 82 ? "#fb7185" : theme.colors.accent }}>{Math.round(meterWidth)}%</span></div>
        <div style={{ height: 18, overflow: "hidden", borderRadius: 9, background: "rgba(143,164,173,0.18)" }}><div style={{ width: `${meterWidth}%`, height: "100%", borderRadius: 9, background: meterWidth > 82 ? "#fb7185" : "#60a5fa", boxShadow: `0 0 18px ${meterWidth > 82 ? "#fb7185" : "#60a5fa"}` }} /></div>
      </div>
      <div style={{ position: "absolute", left: 700, top: 635, width: 520, textAlign: "center", color: "#fb7185", fontFamily: theme.fonts.body, fontSize: 30, fontWeight: theme.fontWeights.bold, opacity: interpolate(frame, [lostFrame, lostFrame + 14], [0, 1], clamp), transform: `translateY(${interpolate(frame, [lostFrame, lostFrame + 14], [-18, 0], clamp)}px)` }}>⚠ 决策被挤出上下文</div>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: laneOpacity }}>
        <path d="M 960 390 C 960 520 650 610 650 700 M 960 390 C 960 520 1270 610 1270 700" stroke="rgba(143,164,173,0.55)" strokeWidth="4" fill="none" strokeDasharray="12 12" />
      </svg>
      <div style={{ position: "absolute", left: 240, top: 700, width: 790, opacity: laneOpacity, transform: `translateX(${interpolate(splitProgress, [0, 1], [-100, 0], clamp)}px)` }}>
        <div style={{ color: "#f472b6", fontFamily: theme.fonts.body, fontSize: 28, fontWeight: theme.fontWeights.bold, marginBottom: 12 }}>设计车道</div>
        <div style={{ height: 58, borderRadius: 29, border: "2px solid #f472b6", background: "rgba(244,114,182,0.12)" }} />
        <div style={{ position: "absolute", left: 36, top: 46, color: "#f5fbff", fontFamily: theme.fonts.body, fontSize: 23 }}>独立推进页面方案</div>
      </div>
      <div style={{ position: "absolute", left: 890, top: 700, width: 790, opacity: laneOpacity, transform: `translateX(${interpolate(splitProgress, [0, 1], [100, 0], clamp)}px)` }}>
        <div style={{ color: "#38bdf8", fontFamily: theme.fonts.body, fontSize: 28, fontWeight: theme.fontWeights.bold, marginBottom: 12 }}>后端车道</div>
        <div style={{ height: 58, borderRadius: 29, border: "2px solid #38bdf8", background: "rgba(56,189,248,0.12)" }} />
        <div style={{ position: "absolute", left: 36, top: 46, color: "#f5fbff", fontFamily: theme.fonts.body, fontSize: 23 }}>独立推进接口开发</div>
      </div>
      <div style={{ position: "absolute", left: 560, top: 850, width: 800, opacity: testProgress, transform: `translateY(${interpolate(testProgress, [0, 1], [60, 0], clamp)}px)` }}>
        <div style={{ height: 52, borderRadius: 26, border: "2px solid #34d399", background: "rgba(52,211,153,0.16)", color: "#8ff7c6", display: "grid", placeItems: "center", fontFamily: theme.fonts.body, fontSize: 26, fontWeight: theme.fontWeights.bold }}>测试轨道 · 独立挑错，交叉检查</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 650,
          top: 955,
          width: 620,
          display: "flex",
          justifyContent: "space-between",
          color: "#8ff7c6",
          fontFamily: theme.fonts.body,
          fontSize: 27,
          fontWeight: theme.fontWeights.bold,
          opacity: resultOpacity,
          transform: `scale(${interpolate(resultProgress, [0, 1], [0.9, 1], clamp)})`,
        }}
      >
        <span>速度 ↑</span>
        <span>质量 ↑</span>
        <span>并行完成</span>
      </div>
    </AbsoluteFill>
  );
};

const sceneFiveWords = narrationTimestamps[4]?.words ?? [];
const sceneFiveEntranceSeconds = {
  team: 0,
  communication: getPhraseStartSeconds(sceneFiveWords, "第一是通信", 4.88),
  messages: getPhraseStartSeconds(sceneFiveWords, "传递任务结果和当前状态", 6.52),
  division: getPhraseStartSeconds(sceneFiveWords, "第二是分工", 9.26),
  assign: getPhraseStartSeconds(sceneFiveWords, "按角色或能力", 10.86),
  coordination: getPhraseStartSeconds(sceneFiveWords, "第三是协调", 14.68),
  conflict: getPhraseStartSeconds(sceneFiveWords, "方案冲突", 18.16),
};

const SceneFivePacket: React.FC<{
  from: [number, number];
  to: [number, number];
  startSeconds: number;
  accent: string;
}> = ({ from, to, startSeconds, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accentColor = normalizeAccent(accent);
  const startFrame = Math.round(startSeconds * fps);
  const progress = interpolate(frame, [startFrame, startFrame + 24], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: from[0] + (to[0] - from[0]) * progress - 9,
        top: from[1] + (to[1] - from[1]) * progress - 9,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: accentColor,
        boxShadow: `0 0 16px ${accentColor}`,
        opacity: interpolate(progress, [0, 0.08, 0.85, 1], [0, 1, 1, 0], clamp),
      }}
    />
  );
};

const SceneFiveStatus: React.FC<{
  left: number;
  top: number;
  text: string;
  startSeconds: number;
  accent: string;
}> = ({ left, top, text, startSeconds, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accentColor = normalizeAccent(accent);
  const progress = spring({
    frame: frame - Math.round(startSeconds * fps),
    fps,
    config: { damping: 14, stiffness: 125 },
    durationInFrames: 20,
  });
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        padding: "12px 22px",
        border: `1px solid ${accentColor}`,
        borderRadius: 16,
        color: accentColor,
        background: "rgba(13, 29, 43, 0.94)",
        fontFamily: theme.fonts.body,
        fontSize: 22,
        fontWeight: theme.fontWeights.bold,
        opacity: interpolate(progress, [0, 0.25], [0, 1], clamp),
        transform: `scale(${interpolate(progress, [0, 1], [0.86, 1], clamp)})`,
        boxShadow: `0 0 18px ${accentColor}55`,
      }}
    >
      {text}
    </div>
  );
};

const SceneFiveConsole: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const conflictFrame = Math.round(sceneFiveEntranceSeconds.conflict * fps);
  const rerouteFrame = Math.round((sceneFiveEntranceSeconds.conflict + 0.55) * fps);
  const conflictOpacity = interpolate(frame, [conflictFrame, conflictFrame + 10, rerouteFrame, rerouteFrame + 10], [0, 1, 1, 0], clamp);
  const rerouteOpacity = interpolate(frame, [rerouteFrame, rerouteFrame + 12], [0, 1], clamp);
  const node = (left: number, top: number, label: string, role: string, accent: string) => (
    <div style={{ position: "absolute", left, top, width: 180, textAlign: "center", color: theme.colors.text, fontFamily: theme.fonts.body }}>
      <div style={{ width: 92, height: 92, margin: "0 auto", display: "grid", placeItems: "center", borderRadius: "50%", border: `3px solid ${accent}`, background: `${accent}22`, boxShadow: `0 0 24px ${accent}55`, fontSize: 28, fontWeight: theme.fontWeights.bold }}>{label}</div>
      <div style={{ marginTop: 12, fontSize: 24, fontWeight: theme.fontWeights.bold }}>{role}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div style={{ position: "absolute", top: 125, left: 0, width: "100%", textAlign: "center", color: theme.colors.text, fontFamily: theme.fonts.body }}>
        <div style={{ fontSize: 42, fontWeight: theme.fontWeights.bold }}>协作接力</div>
        <div style={{ marginTop: 10, color: theme.colors.textMuted, fontSize: 24 }}>任务、结果和状态，在 Agent 之间持续传递</div>
      </div>
      {node(170, 390, "A", "产品 Agent", "#a78bfa")}
      {node(620, 390, "B", "开发 Agent", "#38bdf8")}
      {node(1070, 390, "C", "测试 Agent", "#34d399")}
      {node(1520, 390, "D", "安全 Agent", "#fb7185")}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d="M 350 435 L 620 435 M 800 435 L 1070 435 M 1250 435 L 1520 435" stroke="rgba(143,164,173,0.42)" strokeWidth="4" fill="none" strokeDasharray="12 14" />
      </svg>
      <SceneFivePacket from={[350, 435]} to={[620, 435]} startSeconds={sceneFiveEntranceSeconds.messages} accent="#a78bfa" />
      <SceneFivePacket from={[800, 435]} to={[1070, 435]} startSeconds={sceneFiveEntranceSeconds.messages + 1.25} accent="#38bdf8" />
      <SceneFivePacket from={[1250, 435]} to={[1520, 435]} startSeconds={sceneFiveEntranceSeconds.messages + 2.5} accent="#34d399" />
      <SceneFiveStatus left={730} top={250} text="① 通信：接力棒传递任务 · 结果 · 状态" startSeconds={sceneFiveEntranceSeconds.communication} accent="#a78bfa" />
      <div style={{ position: "absolute", left: 470, top: 590, width: 980, display: "flex", justifyContent: "space-between", color: "#8bdcff", fontFamily: theme.fonts.body, fontSize: 26, opacity: interpolate(frame, [Math.round(sceneFiveEntranceSeconds.division * fps), Math.round(sceneFiveEntranceSeconds.division * fps) + 14], [0, 1], clamp) }}><span>产品：定义需求</span><span>开发：实现方案</span><span>测试：发现问题</span></div>
      <SceneFiveStatus left={690} top={690} text="② 分工：接力棒按角色与能力交给下一棒" startSeconds={sceneFiveEntranceSeconds.assign} accent="#38bdf8" />
      <div style={{ position: "absolute", left: 800, top: 790, width: 320, textAlign: "center", color: "#fb7185", fontFamily: theme.fonts.body, fontSize: 34, fontWeight: theme.fontWeights.bold, opacity: conflictOpacity, transform: `scale(${interpolate(conflictOpacity, [0, 1], [0.8, 1], clamp)})` }}>⚡ 方案冲突</div>
      <SceneFiveStatus left={690} top={870} text="③ 协调：发现冲突，重新规划路线" startSeconds={sceneFiveEntranceSeconds.coordination} accent="#fbbf24" />
      <div style={{ position: "absolute", left: 1130, top: 790, width: 660, color: "#8ff7c6", fontFamily: theme.fonts.body, fontSize: 30, fontWeight: theme.fontWeights.bold, opacity: rerouteOpacity }}>✓ 重新路由，接力继续执行</div>
    </AbsoluteFill>
  );
};

const sceneSixWords = narrationTimestamps[5]?.words ?? [];
const sceneSixEntranceSeconds = {
  manager: getPhraseStartSeconds(sceneSixWords, "主管模式", 3.8),
  pipeline: getPhraseStartSeconds(sceneSixWords, "流水线", 9.42),
  negotiate: getPhraseStartSeconds(sceneSixWords, "协商", 15.5),
  blackboard: getPhraseStartSeconds(sceneSixWords, "黑板", 18.22),
  bidding: getPhraseStartSeconds(sceneSixWords, "竞标", 20.22),
};

const SceneSixModeLabel: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <div
    style={{
      position: "absolute",
      top: 235,
      left: 0,
      width: "100%",
      textAlign: "center",
      color,
      fontFamily: theme.fonts.body,
      fontSize: 34,
      fontWeight: theme.fontWeights.bold,
      letterSpacing: "0.12em",
    }}
  >
    {text}
  </div>
);

const SceneSixPhase: React.FC<{
  startSeconds: number;
  endSeconds: number;
  children: React.ReactNode;
}> = ({ startSeconds, endSeconds, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSeconds * fps);
  const endFrame = Math.round(endSeconds * fps);
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(
          frame,
          [startFrame - 8, startFrame, endFrame - 8, endFrame],
          [0, 1, 1, 0],
          clamp,
        ),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const SceneSixTopology: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <SceneThreeCard
      left={720}
      top={90}
      width={480}
      height={100}
      title="任务：二手书网站"
      detail="同一个任务，不同的协作方式"
      startSeconds={0}
      fromY={-24}
      accent="#fbbf24"
    />
    <SceneSixPhase startSeconds={sceneSixEntranceSeconds.manager} endSeconds={sceneSixEntranceSeconds.pipeline}>
      <SceneSixModeLabel text="主管模式 · 中心辐射" color="#a78bfa" />
      <SceneThreeCard left={760} top={350} width={400} height={130} title="主管 Agent" detail="拆解与收口" startSeconds={sceneSixEntranceSeconds.manager} accent="#a78bfa" />
      <SceneThreeCard left={340} top={570} width={300} height={110} title="需求" detail="产品 Agent" startSeconds={sceneSixEntranceSeconds.manager + 0.35} fromX={-80} accent="#38bdf8" />
      <SceneThreeCard left={810} top={570} width={300} height={110} title="开发" detail="开发 Agent" startSeconds={sceneSixEntranceSeconds.manager + 0.55} accent="#38bdf8" />
      <SceneThreeCard left={1280} top={570} width={300} height={110} title="测试" detail="测试 Agent" startSeconds={sceneSixEntranceSeconds.manager + 0.75} fromX={80} accent="#34d399" />
      <SceneTwoConnector path="M 960 480 L 490 570 M 960 480 L 960 570 M 960 480 L 1430 570" startSeconds={sceneSixEntranceSeconds.manager + 0.3} />
    </SceneSixPhase>
    <SceneSixPhase startSeconds={sceneSixEntranceSeconds.pipeline} endSeconds={sceneSixEntranceSeconds.negotiate}>
      <SceneSixModeLabel text="流水线模式 · 单向接力" color="#38bdf8" />
      <SceneThreeCard left={250} top={500} width={300} height={120} title="需求" detail="输入" startSeconds={sceneSixEntranceSeconds.pipeline} fromX={-80} accent="#a78bfa" />
      <SceneThreeCard left={610} top={500} width={300} height={120} title="设计" detail="页面" startSeconds={sceneSixEntranceSeconds.pipeline + 0.3} fromX={-60} accent="#f472b6" />
      <SceneThreeCard left={970} top={500} width={300} height={120} title="开发" detail="接口" startSeconds={sceneSixEntranceSeconds.pipeline + 0.6} fromX={-40} accent="#38bdf8" />
      <SceneThreeCard left={1330} top={500} width={300} height={120} title="测试" detail="验收" startSeconds={sceneSixEntranceSeconds.pipeline + 0.9} fromX={-20} accent="#34d399" />
      <SceneFivePacket from={[550, 560]} to={[610, 560]} startSeconds={sceneSixEntranceSeconds.pipeline + 0.65} accent="#fbbf24" />
      <SceneFivePacket from={[910, 560]} to={[970, 560]} startSeconds={sceneSixEntranceSeconds.pipeline + 0.95} accent="#fbbf24" />
      <SceneFivePacket from={[1270, 560]} to={[1330, 560]} startSeconds={sceneSixEntranceSeconds.pipeline + 1.25} accent="#fbbf24" />
    </SceneSixPhase>
    <SceneSixPhase startSeconds={sceneSixEntranceSeconds.negotiate} endSeconds={sceneSixEntranceSeconds.blackboard}>
      <SceneSixModeLabel text="协商模式 · 圆桌讨论" color="#f472b6" />
      <SceneThreeCard left={790} top={500} width={340} height={120} title="创意议题" detail="方案讨论中" startSeconds={sceneSixEntranceSeconds.negotiate} accent="#f472b6" />
      <SceneThreeCard left={470} top={650} width={260} height={100} title="Agent A" detail="提案" startSeconds={sceneSixEntranceSeconds.negotiate + 0.2} fromX={-80} accent="#a78bfa" />
      <SceneThreeCard left={1190} top={650} width={260} height={100} title="Agent B" detail="批评" startSeconds={sceneSixEntranceSeconds.negotiate + 0.4} fromX={80} accent="#38bdf8" />
      <SceneTwoConnector path="M 730 700 C 820 620 820 620 790 560 M 1190 700 C 1100 620 1100 620 1130 560" startSeconds={sceneSixEntranceSeconds.negotiate + 0.2} />
      <SceneFivePacket from={[730, 700]} to={[790, 560]} startSeconds={sceneSixEntranceSeconds.negotiate + 0.7} accent="#fbbf24" />
      <SceneFivePacket from={[1190, 700]} to={[1130, 560]} startSeconds={sceneSixEntranceSeconds.negotiate + 1.1} accent="#fbbf24" />
    </SceneSixPhase>
    <SceneSixPhase startSeconds={sceneSixEntranceSeconds.blackboard} endSeconds={sceneSixEntranceSeconds.bidding}>
      <SceneSixModeLabel text="黑板模式 · 共享信息" color="#34d399" />
      <SceneThreeCard left={690} top={430} width={540} height={220} title="共享黑板" detail="任务 · 结果 · 状态" startSeconds={sceneSixEntranceSeconds.blackboard} accent="#34d399" />
      <SceneThreeCard left={300} top={400} width={260} height={100} title="Agent A" detail="读写" startSeconds={sceneSixEntranceSeconds.blackboard + 0.15} fromX={-80} accent="#a78bfa" />
      <SceneThreeCard left={1360} top={400} width={260} height={100} title="Agent B" detail="读写" startSeconds={sceneSixEntranceSeconds.blackboard + 0.3} fromX={80} accent="#38bdf8" />
      <SceneFivePacket from={[560, 450]} to={[690, 500]} startSeconds={sceneSixEntranceSeconds.blackboard + 0.5} accent="#a78bfa" />
      <SceneFivePacket from={[1360, 450]} to={[1230, 520]} startSeconds={sceneSixEntranceSeconds.blackboard + 0.8} accent="#38bdf8" />
    </SceneSixPhase>
    <SceneSixPhase startSeconds={sceneSixEntranceSeconds.bidding} endSeconds={23.1}>
      <SceneSixModeLabel text="竞标模式 · 资源调度" color="#fbbf24" />
      <SceneThreeCard left={790} top={400} width={340} height={110} title="发布任务" detail="寻找最合适的 Agent" startSeconds={sceneSixEntranceSeconds.bidding} accent="#fbbf24" />
      <SceneThreeCard left={360} top={650} width={300} height={110} title="Agent A" detail="能力 72" startSeconds={sceneSixEntranceSeconds.bidding + 0.2} fromX={-80} accent="#a78bfa" />
      <SceneThreeCard left={810} top={650} width={300} height={110} title="Agent B" detail="能力 94 ✓" startSeconds={sceneSixEntranceSeconds.bidding + 0.4} accent="#34d399" />
      <SceneThreeCard left={1260} top={650} width={300} height={110} title="Agent C" detail="能力 81" startSeconds={sceneSixEntranceSeconds.bidding + 0.6} fromX={80} accent="#38bdf8" />
      <SceneTwoConnector path="M 960 510 L 510 650 M 960 510 L 960 650 M 960 510 L 1410 650" startSeconds={sceneSixEntranceSeconds.bidding + 0.25} />
    </SceneSixPhase>
  </AbsoluteFill>
);

const sceneSevenWords = narrationTimestamps[6]?.words ?? [];
const sceneSevenEntranceSeconds = {
  warning: 0,
  cost: getPhraseStartSeconds(sceneSevenWords, "通信都会增加成本", 2.8),
  error: getPhraseStartSeconds(sceneSevenWords, "错误也可能被后面不断放大", 5.1),
  governance: getPhraseStartSeconds(sceneSevenWords, "权限安全和责任追踪", 9.42),
  simple: getPhraseStartSeconds(sceneSevenWords, "任务越简单", 13.42),
  complex: getPhraseStartSeconds(sceneSevenWords, "复杂度真的超过", 17.36),
};

const SceneSevenRiskMonitor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const costFrame = Math.round(sceneSevenEntranceSeconds.cost * fps);
  const errorFrame = Math.round(sceneSevenEntranceSeconds.error * fps);
  const governanceFrame = Math.round(sceneSevenEntranceSeconds.governance * fps);
  const simpleFrame = Math.round(sceneSevenEntranceSeconds.simple * fps);
  const complexFrame = Math.round(sceneSevenEntranceSeconds.complex * fps);
  const costProgress = interpolate(frame, [costFrame, errorFrame], [0, 1], clamp);
  const errorProgress = interpolate(frame, [errorFrame, errorFrame + 80], [0, 1], clamp);
  const governanceOpacity = interpolate(frame, [governanceFrame, governanceFrame + 14], [0, 1], clamp);
  const simpleOpacity = interpolate(frame, [simpleFrame, simpleFrame + 14], [0, 1], clamp);
  const complexOpacity = interpolate(frame, [complexFrame, complexFrame + 14], [0, 1], clamp);
  const domino = (left: number, value: string, scale: number, delay: number) => {
    const start = errorFrame + delay;
    const progress = interpolate(frame, [start, start + 18], [0, 1], clamp);
    return <div style={{ position: "absolute", left, top: 485, width: 150, height: 110, display: "grid", placeItems: "center", borderRadius: 18, border: "2px solid #fb7185", color: "#ffd4dc", background: "rgba(111,34,54,0.45)", boxShadow: "0 0 24px rgba(251,113,133,0.28)", fontFamily: theme.fonts.body, fontSize: 30, fontWeight: theme.fontWeights.bold, opacity: progress, transform: `scale(${interpolate(progress, [0, 1], [0.7, scale], clamp)}) rotate(${interpolate(progress, [0, 1], [-8, 0], clamp)}deg)` }}>{value}</div>;
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div style={{ position: "absolute", top: 125, left: 0, width: "100%", textAlign: "center", color: theme.colors.text, fontFamily: theme.fonts.body }}>
        <div style={{ fontSize: 42, fontWeight: theme.fontWeights.bold }}>风险如何沿协作链放大</div>
        <div style={{ marginTop: 10, color: theme.colors.textMuted, fontSize: 24 }}>链路越长，通信成本和错误传播越难控制</div>
      </div>
      <div style={{ position: "absolute", left: 330, top: 300, width: 1260, color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>协作链路</span><span style={{ color: costProgress > 0.7 ? "#fb7185" : "#fbbf24" }}>通信成本 +{Math.round(costProgress * 100)}%</span></div>
        <div style={{ height: 18, marginTop: 10, borderRadius: 9, background: "rgba(143,164,173,0.18)", overflow: "hidden" }}><div style={{ width: `${Math.min(100, costProgress * 100)}%`, height: "100%", borderRadius: 9, background: costProgress > 0.7 ? "#fb7185" : "#fbbf24", boxShadow: "0 0 18px #fb7185" }} /></div>
      </div>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d="M 300 430 L 1620 430" stroke="rgba(143,164,173,0.4)" strokeWidth="5" fill="none" strokeDasharray="12 14" />
      </svg>
      {[{ left: 230, label: "Agent A", role: "传出结果", color: "#a78bfa" }, { left: 680, label: "Agent B", role: "继续处理", color: "#38bdf8" }, { left: 1130, label: "Agent C", role: "接收结果", color: "#34d399" }, { left: 1580, label: "终点", role: "结果收口", color: "#8fa4ad" }].map((agent) => <div key={agent.label} style={{ position: "absolute", left: agent.left, top: 390, width: 180, textAlign: "center", color: theme.colors.text, fontFamily: theme.fonts.body }}><div style={{ width: 78, height: 78, margin: "0 auto", display: "grid", placeItems: "center", borderRadius: "50%", border: `3px solid ${agent.color}`, background: `${agent.color}22`, boxShadow: `0 0 20px ${agent.color}44`, fontSize: 22, fontWeight: theme.fontWeights.bold }}>{agent.label}</div><div style={{ marginTop: 9, color: theme.colors.textMuted, fontSize: 20 }}>{agent.role}</div></div>)}
      <SceneFivePacket from={[410, 430]} to={[680, 430]} startSeconds={sceneSevenEntranceSeconds.cost + 0.3} accent="#fbbf24" />
      <SceneFivePacket from={[860, 430]} to={[1130, 430]} startSeconds={sceneSevenEntranceSeconds.cost + 1} accent="#fbbf24" />
      <SceneFivePacket from={[1310, 430]} to={[1580, 430]} startSeconds={sceneSevenEntranceSeconds.cost + 1.7} accent="#fbbf24" />
      {domino(460, "×2", 1, 0)}{domino(820, "×4", 1.08, 20)}{domino(1180, "×8", 1.16, 40)}
      <div style={{ position: "absolute", left: 440, top: 650, width: 1040, display: "flex", justifyContent: "space-between", color: "#ffb8c5", fontFamily: theme.fonts.body, fontSize: 24, opacity: errorProgress }}>错误被后面不断放大 →</div>
      <div style={{ position: "absolute", left: 500, top: 745, width: 920, display: "flex", justifyContent: "space-between", color: "#ffbec8", fontFamily: theme.fonts.body, fontSize: 27, opacity: governanceOpacity }}><span>🔒 权限边界</span><span>⚠ 安全检查</span><span>？责任追踪</span></div>
      <div style={{ position: "absolute", left: 300, top: 895, width: 560, textAlign: "center", color: "#8ff7c6", fontFamily: theme.fonts.body, fontSize: 29, fontWeight: theme.fontWeights.bold, opacity: simpleOpacity }}>简单任务 → 单 Agent</div>
      <div style={{ position: "absolute", left: 1060, top: 895, width: 560, textAlign: "center", color: "#8bdcff", fontFamily: theme.fonts.body, fontSize: 29, fontWeight: theme.fontWeights.bold, opacity: complexOpacity }}>复杂度越界 → 受控多 Agent</div>
    </AbsoluteFill>
  );
};

const sceneEightWords = narrationTimestamps[7]?.words ?? [];
const sceneEightEntranceSeconds = {
  chatter: getPhraseStartSeconds(sceneEightWords, "扎堆聊天", 2.74),
  communication: getPhraseStartSeconds(sceneEightWords, "通信分工和协调", 5.06),
  organized: getPhraseStartSeconds(sceneEightWords, "组织成一个可靠系统", 7.46),
  judge: getPhraseStartSeconds(sceneEightWords, "判断一个多Agent方案", 13.28),
  chatterAgain: getPhraseStartSeconds(sceneEightWords, "制造更多对话", 16.52),
};

const SceneEightReliableSystem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const communicationFrame = Math.round(sceneEightEntranceSeconds.communication * fps);
  const judgeFrame = Math.round(sceneEightEntranceSeconds.judge * fps);
  const chatterFrame = Math.round(sceneEightEntranceSeconds.chatter * fps);
  const gateProgress = (start: number) => spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 16, stiffness: 120 }, durationInFrames: 20 });
  const systemProgress = gateProgress(sceneEightEntranceSeconds.organized);
  const noiseOpacity = interpolate(frame, [chatterFrame, chatterFrame + 18, communicationFrame, communicationFrame + 16], [0, 1, 1, 0.15], clamp);
  const bubble = (left: number, top: number, text: string, color: string, delay: number) => {
    const progress = interpolate(frame, [chatterFrame + delay, chatterFrame + delay + 14], [0, 1], clamp);
    return <div style={{ position: "absolute", left, top, padding: "12px 20px", borderRadius: 24, border: `2px solid ${color}`, color: "#f5fbff", background: `${color}28`, fontFamily: theme.fonts.body, fontSize: 22, opacity: progress * noiseOpacity, transform: `translateY(${interpolate(progress, [0, 1], [18, 0], clamp)}px) rotate(${interpolate(progress, [0, 1], [-5, 0], clamp)}deg)` }}>{text}</div>;
  };
  const gate = (left: number, title: string, detail: string, color: string, start: number) => {
    const progress = gateProgress(start);
    return <div style={{ position: "absolute", left, top: 445, width: 250, height: 260, borderLeft: `5px solid ${color}`, borderRight: `5px solid ${color}`, background: `${color}12`, opacity: interpolate(progress, [0, 0.25], [0, 1], clamp), transform: `scaleY(${interpolate(progress, [0, 1], [0.75, 1], clamp)})`, transformOrigin: "bottom" }}><div style={{ position: "absolute", top: 72, left: -5, width: 250, textAlign: "center", color, fontFamily: theme.fonts.body, fontSize: 30, fontWeight: theme.fontWeights.bold }}>{title}</div><div style={{ position: "absolute", top: 125, left: 0, width: 250, textAlign: "center", color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: 22 }}>{detail}</div></div>;
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div style={{ position: "absolute", top: 125, left: 0, width: "100%", textAlign: "center", color: theme.colors.text, fontFamily: theme.fonts.body }}><div style={{ fontSize: 42, fontWeight: theme.fontWeights.bold }}>从更多对话，到真正协作</div><div style={{ marginTop: 10, color: theme.colors.textMuted, fontSize: 24 }}>让分散的能力经过组织，汇聚成可靠系统</div></div>
      {bubble(240, 300, "我有一个想法", "#a78bfa", 0)}{bubble(560, 250, "我也来试试", "#38bdf8", 8)}{bubble(860, 325, "结果发给我", "#34d399", 16)}{bubble(1160, 245, "等等，方案冲突了", "#fb7185", 24)}{bubble(1430, 330, "再聊一下？", "#fbbf24", 32)}
      <div style={{ position: "absolute", left: 230, top: 410, width: 1460, height: 6, borderRadius: 3, background: "rgba(143,164,173,0.24)" }} />
      {gate(300, "通信", "消息进入统一通道", "#a78bfa", sceneEightEntranceSeconds.communication)}
      {gate(835, "分工", "角色各司其职", "#38bdf8", sceneEightEntranceSeconds.communication + 0.45)}
      {gate(1370, "协调", "结果合并收口", "#fbbf24", sceneEightEntranceSeconds.communication + 0.9)}
      <div style={{ position: "absolute", left: 710, top: 760, width: 500, textAlign: "center", color: "#8ff7c6", fontFamily: theme.fonts.body, fontSize: 36, fontWeight: theme.fontWeights.bold, opacity: interpolate(systemProgress, [0, 0.25], [0, 1], clamp), transform: `scale(${interpolate(systemProgress, [0, 1], [0.82, 1], clamp)})` }}>✓ 可靠系统</div>
      <div style={{ position: "absolute", left: 280, top: 880, width: 560, textAlign: "center", color: "#ff9eb0", fontFamily: theme.fonts.body, fontSize: 28, fontWeight: theme.fontWeights.bold, opacity: interpolate(frame, [judgeFrame, judgeFrame + 14], [0, 1], clamp) }}>✕ 只是制造更多对话</div>
      <div style={{ position: "absolute", left: 1080, top: 880, width: 560, textAlign: "center", color: "#8ff7c6", fontFamily: theme.fonts.body, fontSize: 28, fontWeight: theme.fontWeights.bold, opacity: interpolate(frame, [judgeFrame, judgeFrame + 14], [0, 1], clamp) }}>✓ 真正的协作系统</div>
    </AbsoluteFill>
  );
};

const SceneBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const driftX = Math.sin(t * 0.18) * 6;
  const driftY = Math.cos(t * 0.14) * 5;
  const glow = 0.78 + Math.sin(t * 0.55) * 0.08;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", background: "linear-gradient(135deg, #070f11 0%, #0a1820 52%, #071317 100%)" }}>
      <div style={{ position: "absolute", inset: -120, opacity: 0.28, transform: `translate(${driftX}px, ${driftY}px)`, backgroundImage: "linear-gradient(rgba(99,230,216,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(99,230,216,0.09) 1px, transparent 1px)", backgroundSize: "84px 84px", backgroundPosition: `${(frame * 0.18) % 84}px ${(frame * 0.12) % 84}px`, maskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)" }} />
      <div style={{ position: "absolute", left: "8%", top: "-18%", width: "62vw", height: "62vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(77,225,212,0.18), transparent 68%)", filter: "blur(28px)", opacity: glow, transform: `translate(${driftX * 2}px, ${driftY}px)` }} />
      <div style={{ position: "absolute", right: "-16%", bottom: "-30%", width: "58vw", height: "58vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,220,242,0.14), transparent 68%)", filter: "blur(34px)", opacity: 0.72, transform: `translate(${-driftX}px, ${-driftY * 1.4}px)` }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 42%, rgba(3,9,12,0.42) 100%)" }} />
    </AbsoluteFill>
  );
};

const getSubtitleChunk = (
  text: string,
  words: TimedWord[],
  elapsedSeconds: number,
) => {
  const chunks = text
    .split(/[，。！？；：、,.!?;:]/u)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  if (chunks.length === 0 || words.length === 0) return text;

  let wordOffset = 0;
  for (const chunk of chunks) {
    const spokenLength = Array.from(chunk).filter(isSpokenCharacter).length;
    const endWord = words[Math.min(words.length - 1, wordOffset + spokenLength - 1)];
    if (elapsedSeconds <= endWord.end) return chunk;
    wordOffset += spokenLength;
  }
  return chunks[chunks.length - 1];
};

const Scene: React.FC<SceneProps> = ({
  scene,
  sceneIndex,
  baseDurationInFrames,
  pointEntryFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isFirst = sceneIndex === 0;
  const isLast = sceneIndex === sceneTimings.length - 1;

  const enterProgress = isFirst
    ? interpolate(frame, [0, 8], [0, 1], clamp)
    : interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], clamp);
  const exitProgress = isLast
    ? interpolate(
        frame,
        [Math.max(0, baseDurationInFrames - 20), baseDurationInFrames],
        [1, 0],
        clamp,
      )
    : interpolate(
        frame,
        [baseDurationInFrames, baseDurationInFrames + TRANSITION_FRAMES],
        [1, 0],
        clamp,
      );
  const translateX =
    (1 - enterProgress) * 28 - (1 - exitProgress) * 28;
  const activePointIndex = pointEntryFrames.reduce(
    (active, entryFrame, index) => (frame >= entryFrame ? index : active),
    -1,
  );
  const subtitle = getSubtitleChunk(
    scene.narration,
    narrationTimestamps[sceneIndex]?.words ?? [],
    frame / fps,
  );
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(enterProgress, exitProgress),
        transform: `translateX(${translateX}px)`,
      }}
    >
      <SceneBackdrop />
      {sceneIndex === 0 ? (
        <SceneOneOverload />
      ) : sceneIndex === 1 ? (
        <SceneTwoDiagram />
      ) : sceneIndex === 2 ? (
        <SceneThreePipeline />
      ) : sceneIndex === 3 ? (
        <SceneFourParallel />
      ) : sceneIndex === 4 ? (
        <SceneFiveConsole />
      ) : sceneIndex === 5 ? (
        <SceneSixTopology />
      ) : sceneIndex === 6 ? (
        <SceneSevenRiskMonitor />
      ) : sceneIndex === 7 ? (
        <SceneEightReliableSystem />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 108,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "81px 102px",
          }}
        >
          {scene.corner ? (
            <div
              style={{
                position: "absolute",
                top: 54,
                left: 60,
                color: theme.colors.accent,
                fontFamily: theme.fonts.body,
                ...theme.video.corner,
              }}
            >
              {scene.corner}
            </div>
          ) : null}

          <h1
            style={{
              width: "92%",
              margin: 0,
              color: theme.colors.title,
              fontFamily: theme.fonts.title,
              ...(sceneIndex === sceneTimings.length - 1
                ? theme.video.finalTitle
                : theme.video.title),
              textShadow: theme.video.titleShadow,
            }}
          >
            {scene.title}
          </h1>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 27,
              minHeight: 294,
              marginTop: 69,
            }}
          >
            {scene.points.map((point, index) => {
              const entryFrame = pointEntryFrames[index];
              const entryProgress = spring({
                frame: Math.max(0, frame - entryFrame),
                fps,
                config: {damping: 16, stiffness: 100},
              });
              const isCurrent = index === activePointIndex;
              const isPrevious = index === activePointIndex - 1;
              const hasPassed = index < activePointIndex;
              const stateOpacity = isCurrent
                ? 1
                : isPrevious
                  ? 0.5
                  : hasPassed
                    ? 0.22
                    : 0;

              return (
                <div
                  key={point}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 27,
                    color: isCurrent ? theme.colors.accent : theme.colors.text,
                    fontFamily: theme.fonts.body,
                    ...(sceneIndex === sceneTimings.length - 1
                      ? theme.video.finalPoint
                      : theme.video.point),
                    fontWeight: isCurrent
                      ? theme.fontWeights.bold
                      : theme.fontWeights.regular,
                    opacity: entryProgress * stateOpacity,
                    transform: `translateY(${(1 - entryProgress) * 18}px)`,
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      flex: "0 0 auto",
                      borderRadius: "50%",
                      background: theme.colors.accent,
                      boxShadow: isCurrent
                        ? theme.video.pointShadow
                        : "none",
                    }}
                  />
                  <span>{point}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 42,
          textAlign: "center",
          color: theme.colors.text,
          fontFamily: theme.fonts.body,
          fontSize: 33,
          fontWeight: theme.fontWeights.regular,
          letterSpacing: "0.1em",
          lineHeight: 1.4,
          textShadow: "0 2px 10px rgba(0, 0, 0, 0.9)",
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgmVolume = Math.min(
    interpolate(frame, [0, fps], [0, 0.16], clamp),
    interpolate(frame, [TOTAL_FRAMES - fps * 2, TOTAL_FRAMES], [0.16, 0], clamp),
  );
  const narrationDuck = sceneTimings.reduce((factor, timing) => {
    const elapsed = frame - timing.startInFrames;
    const durationInFrames = timing.baseDurationInFrames;
    const duckFrames = fps * 0.4;
    if (elapsed < 0 || elapsed > durationInFrames + duckFrames) return factor;
    if (elapsed < duckFrames) {
      return Math.min(factor, interpolate(elapsed, [0, duckFrames], [1, 0.6], clamp));
    }
    if (elapsed > durationInFrames - duckFrames) {
      return Math.min(
        factor,
        interpolate(elapsed, [durationInFrames - duckFrames, durationInFrames], [0.6, 1], clamp),
      );
    }
    return Math.min(factor, 0.6);
  }, 1);
  const progress = interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 100], clamp);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: theme.colors.background,
      }}
    >
      <Html5Audio
        name="Slow ambient BGM"
        src={staticFile("audio/slow-ambient-bed.wav")}
        loop
        volume={() => bgmVolume * narrationDuck}
      />

      {sceneTimings.map((timing) => (
        <Sequence
          key={`narration-${timing.index}`}
          from={timing.startInFrames}
          durationInFrames={timing.baseDurationInFrames}
          name={`Narration ${timing.index + 1}`}
        >
          <Html5Audio
            src={staticFile(
              `audio/agent_xiezuo/narration-scene-${String(timing.index + 1).padStart(2, "0")}.mp3`,
            )}
            volume={1}
          />
        </Sequence>
      ))}

      <div
        style={{
          position: "absolute",
          top: 57,
          right: 81,
          width: 225,
          height: 1,
          background: theme.colors.line,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: theme.colors.accent,
            boxShadow: theme.video.progressShadow,
          }}
        />
      </div>

      {sceneTimings.map((timing) => (
        <Sequence
          key={`scene-${timing.index}`}
          from={timing.startInFrames}
          durationInFrames={timing.durationInFrames}
          premountFor={TRANSITION_FRAMES}
          name={`Scene ${timing.index + 1}`}
        >
          <Scene
            scene={timing.scene}
            sceneIndex={timing.index}
            baseDurationInFrames={timing.baseDurationInFrames}
            pointEntryFrames={timing.pointEntryFrames}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
