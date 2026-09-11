import { Composition } from "remotion";
import { FPS, TOTAL_FRAMES } from "./storyboard";
import { Video } from "./Video";

export const MyComposition = () => {
  return (
    <Composition
      id="AiVideoPreview"
      component={Video}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
