import storyboardJson from "../content/agent_xiezuo/storyboard.json";
import narrationTimestampData from "../public/audio/agent_xiezuo/narration-timestamps.json";

export const FPS = 30;
export const TRANSITION_FRAMES = FPS * 0.5;

const CHARACTERS_PER_SECOND = 5;
const AUDIO_TAIL_PADDING_SECONDS = 0.1;

export type StoryboardScene = {
  durationSeconds: number;
  corner?: string;
  title: string;
  points: string[];
  narration: string;
};

type Storyboard = {
  durationSeconds: number;
  scenes: StoryboardScene[];
};

const storyboard = storyboardJson as Storyboard;

const countCharacters = (value: string) => Array.from(value).length;

const getScreenCharacterCount = (scene: StoryboardScene) => {
  return [scene.corner, scene.title, ...scene.points]
    .filter((value): value is string => Boolean(value))
    .reduce(
    (total, value) => total + countCharacters(value),
    0,
    );
};

const getEstimatedDurationInFrames = (scene: StoryboardScene) => {
  const screenReadingSeconds = Math.ceil(
    getScreenCharacterCount(scene) / CHARACTERS_PER_SECOND,
  );
  const narrationReadingSeconds = Math.ceil(
    countCharacters(scene.narration) / CHARACTERS_PER_SECOND,
  );
  const audioDurationSeconds =
    narrationTimestampData.scenes[storyboard.scenes.indexOf(scene)]?.durationSeconds ?? 0;

  if (audioDurationSeconds > 0) {
    return Math.ceil(
      (audioDurationSeconds + AUDIO_TAIL_PADDING_SECONDS) * FPS,
    );
  }

  return Math.ceil(
    Math.max(screenReadingSeconds, narrationReadingSeconds) * FPS,
  );
};

let elapsedFrames = 0;

export const sceneTimings = storyboard.scenes.map((scene, index) => {
  const baseDurationInFrames = getEstimatedDurationInFrames(scene);
  const readableFrames = Math.max(
    1,
    baseDurationInFrames - AUDIO_TAIL_PADDING_SECONDS * FPS,
  );
  const totalCharacters = getScreenCharacterCount(scene);
  let elapsedCharacters = countCharacters(scene.title);
  if (scene.corner) elapsedCharacters += countCharacters(scene.corner);

  const pointEntryFrames = scene.points.map((point) => {
    const entryFrame = Math.round(
      (elapsedCharacters / totalCharacters) * readableFrames,
    );
    elapsedCharacters += countCharacters(point);
    return entryFrame;
  });

  const timing = {
    scene,
    index,
    startInFrames: elapsedFrames,
    baseDurationInFrames,
    durationInFrames:
      baseDurationInFrames +
      (index === storyboard.scenes.length - 1 ? 0 : TRANSITION_FRAMES),
    pointEntryFrames,
  };

  elapsedFrames += baseDurationInFrames;
  return timing;
});

export const TOTAL_FRAMES = elapsedFrames;
export const DECLARED_DURATION_SECONDS = storyboard.durationSeconds;
