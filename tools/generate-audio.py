"""Generate Dhivehi audio for every line the site can speak.

    node tools/extract-lines.js                 # refresh tools/lines.json
    python tools/generate-audio.py              # synthesize missing lines
    python tools/generate-audio.py --redo-all   # regenerate everything (e.g. after a Dhivehi review)

Uses OmniVoice (https://github.com/k2-fsa/OmniVoice), the default engine behind
VoiceStudio, with language "dv". Two reference voices are generated once —
one for the learner ("you" lines and words) and one for shopkeepers ("them"
lines) — and every line is then cloned from them, so each role keeps one
consistent voice instead of a random speaker per clip.

Output: audio/<sha1-of-text>.mp3 plus audio/manifest.json mapping text -> file.
Model weights are CC-BY-NC: keep the generated audio on non-commercial use.
"""
import argparse, hashlib, inspect, json, os, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINES = ROOT / 'tools' / 'lines.json'
OUT = ROOT / 'audio'
REFS = ROOT / 'tools' / 'voices'
SR = 24000

# Reference sentences: ordinary spoken Malé Dhivehi, a few seconds long.
REF = {
    'learner': {'text': 'އަހަރެން ބޭނުން ދެ ގުޅަ އަދި ކަޅު ސައި', 'instruct': 'female, moderate pitch'},
    'seller':  {'text': 'ކިލޯއެއް ފަންސާސް ރުފިޔާ، ކުދިކޮށް ކޮށާލަދެންތަ', 'instruct': 'male, moderate pitch'},
}
ROLE_VOICE = {'you': 'learner', 'word': 'learner', 'them': 'seller'}


def fname(text):
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:14]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--redo-all', action='store_true')
    ap.add_argument('--steps', type=int, default=16, help='diffusion steps (16 fast, 32 best)')
    ap.add_argument('--limit', type=int, default=0, help='only synthesize N lines (for a quick test)')
    ap.add_argument('--seed', type=int, default=1234)
    args = ap.parse_args()

    import numpy as np
    import soundfile as sf
    import torch
    from omnivoice import OmniVoice

    torch.set_num_threads(max(1, os.cpu_count() or 1))
    lines = json.loads(LINES.read_text(encoding='utf-8'))
    OUT.mkdir(exist_ok=True); REFS.mkdir(exist_ok=True)

    fmt = 'MP3' if 'MP3' in sf.available_formats() else 'WAV'
    ext = '.mp3' if fmt == 'MP3' else '.wav'
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    dtype = torch.float16 if device.startswith('cuda') else torch.float32
    print(f'device={device} dtype={dtype} format={fmt} steps={args.steps} lines={len(lines)}', flush=True)

    t0 = time.time()
    model = OmniVoice.from_pretrained('k2-fsa/OmniVoice', device_map=device, dtype=dtype)
    print(f'model loaded in {time.time() - t0:.0f}s', flush=True)

    params = inspect.signature(model.generate).parameters
    lang_kw = next((k for k in ('language_id', 'language', 'lang') if k in params), None)
    base = {'num_step': args.steps} if 'num_step' in params else {}
    if lang_kw: base[lang_kw] = 'dv'
    print('generate() language arg:', lang_kw or 'none (text only)', flush=True)

    def synth(**kw):
        torch.manual_seed(args.seed); np.random.seed(args.seed)
        with torch.inference_mode():
            return model.generate(**base, **kw)[0]

    # reference voices, generated once and reused
    for name, spec in REF.items():
        wav = REFS / f'{name}.wav'
        if wav.exists() and not args.redo_all:
            continue
        t = time.time()
        audio = synth(text=spec['text'], instruct=spec['instruct'])
        sf.write(wav, audio, SR)
        print(f'reference voice {name}: {len(audio) / SR:.1f}s audio in {time.time() - t:.0f}s', flush=True)

    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() and not args.redo_all else {}
    entries = manifest.get('lines', {})
    todo = [l for l in lines if args.redo_all or l['dv'] not in entries or not (OUT / entries[l['dv']]['file']).exists()]
    already = len(lines) - len(todo)
    if args.limit: todo = todo[:args.limit]
    print(f'{len(todo)} to synthesize, {already} already done', flush=True)

    # encode each reference voice once; re-encoding it for every line was most of the time on CPU
    prompts = {}
    if 'voice_clone_prompt' in params and hasattr(model, 'create_voice_clone_prompt'):
        prompts = {name: model.create_voice_clone_prompt(str(REFS / f'{name}.wav'), spec['text']) for name, spec in REF.items()}

    done = 0
    for l in todo:
        voice = ROLE_VOICE.get(l['role'], 'learner')
        t = time.time()
        try:
            clone = {'voice_clone_prompt': prompts[voice]} if voice in prompts else {'ref_audio': str(REFS / f'{voice}.wav'), 'ref_text': REF[voice]['text']}
            audio = synth(text=l['dv'], **clone)
        except Exception as e:  # keep going; a single bad line shouldn't lose the batch
            print(f'  FAILED {l["dv"]!r}: {e}', flush=True)
            continue
        audio = np.asarray(audio, dtype=np.float32)
        peak = float(np.max(np.abs(audio))) or 1.0
        audio = audio / peak * 0.89                         # even loudness across clips
        name = fname(l['dv']) + ext
        sf.write(OUT / name, audio, SR, format=fmt)
        entries[l['dv']] = {'file': name, 'voice': voice, 'seconds': round(len(audio) / SR, 2)}
        done += 1
        manifest = {'engine': 'OmniVoice (k2-fsa/OmniVoice) via VoiceStudio', 'language': 'dv',
                    'license': 'Generated with CC-BY-NC model weights — non-commercial use',
                    'voices': {k: v['instruct'] for k, v in REF.items()}, 'lines': entries}
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'  [{done}/{len(todo)}] {voice:7} {len(audio) / SR:4.1f}s audio in {time.time() - t:5.0f}s  {l["dv"]}', flush=True)

    print(f'finished: {done} clips, {time.time() - t0:.0f}s total', flush=True)


if __name__ == '__main__':
    sys.exit(main())
