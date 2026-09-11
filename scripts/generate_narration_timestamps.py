import json
from difflib import SequenceMatcher
from pathlib import Path

from faster_whisper import WhisperModel


ROOT = Path(__file__).resolve().parents[1]
STORYBOARD = ROOT / "content" / "agent_xiezuo" / "storyboard.json"
AUDIO_DIR = ROOT / "public" / "audio" / "agent_xiezuo"
OUTPUT = AUDIO_DIR / "narration-timestamps.json"


def spoken_units(text: str) -> list[str]:
    return [char for char in text if char.isalnum() or "\u4e00" <= char <= "\u9fff"]


def distribute(start: float, end: float, count: int) -> list[tuple[float, float]]:
    if count == 0:
        return []
    step = max(0.001, (end - start) / count)
    return [(start + step * i, start + step * (i + 1)) for i in range(count)]


def align(reference: str, recognized: list[tuple[str, float, float]]) -> list[dict]:
    ref_units = spoken_units(reference)
    rec_units = spoken_units("".join(item[0] for item in recognized))
    rec_times = [(item[1], item[2]) for item in recognized for _ in spoken_units(item[0])]
    matcher = SequenceMatcher(None, rec_units, ref_units, autojunk=False)
    result: list[dict] = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset in range(j2 - j1):
                start, end = rec_times[i1 + offset]
                result.append({"text": ref_units[j1 + offset], "start": round(start, 3), "end": round(end, 3)})
            continue
        source_start = rec_times[i1][0] if i1 < i2 else (rec_times[i1 - 1][1] if i1 else 0.0)
        source_end = rec_times[i2 - 1][1] if i1 < i2 else (rec_times[i1][0] if i1 < len(rec_times) else source_start)
        for char, (start, end) in zip(ref_units[j1:j2], distribute(source_start, source_end, j2 - j1)):
            result.append({"text": char, "start": round(start, 3), "end": round(end, 3)})
    return result


def main() -> None:
    storyboard = json.loads(STORYBOARD.read_text(encoding="utf-8"))
    model = WhisperModel("small", device="cpu", compute_type="int8")
    scenes = []
    for index, scene in enumerate(storyboard["scenes"], start=1):
        audio_path = AUDIO_DIR / f"narration-scene-{index:02d}.mp3"
        segments, info = model.transcribe(
            str(audio_path), language="zh", word_timestamps=True, vad_filter=True, beam_size=5
        )
        segments = list(segments)
        recognized = [(word.word.strip(), word.start, word.end) for segment in segments for word in (segment.words or []) if word.word.strip()]
        recognized_text = "".join(item[0] for item in recognized)
        words = align(scene["narration"], recognized)
        previous_start = 0.0
        for word in words:
            word["start"] = max(word["start"], previous_start)
            word["end"] = max(word["end"], word["start"])
            previous_start = word["start"]
        scenes.append({
            "scene": index,
            "audio": f"audio/narration-scene-{index:02d}.mp3",
            "text": scene["narration"],
            "recognizedText": recognized_text,
            "words": words,
            "durationSeconds": round(info.duration, 3),
        })
        print(f"scene {index}: recognized {len(recognized_text)} chars, corrected to {len(words)} timed chars")
    OUTPUT.write_text(json.dumps({"scenes": scenes}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUTPUT}")


if __name__ == "__main__":
    main()
