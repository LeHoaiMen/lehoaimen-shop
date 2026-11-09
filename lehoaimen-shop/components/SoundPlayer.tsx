'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioLines, Pause, Play, Volume2, VolumeX } from 'lucide-react';

type SoundEngine = { context: AudioContext; source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode; lfo: OscillatorNode; lfoGain: GainNode };

function createWaterAmbience(): SoundEngine {
  const context = new AudioContext();
  const length = context.sampleRate * 3;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let brown = 0;
  for (let index = 0; index < length; index += 1) {
    brown = (brown + 0.018 * (Math.random() * 2 - 1)) / 1.018;
    channel[index] = brown * 3.5;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  filter.type = 'lowpass';
  filter.frequency.value = 1250;
  filter.Q.value = 0.7;
  gain.gain.value = 0.0001;
  lfo.frequency.value = 0.13;
  lfoGain.gain.value = 390;
  lfo.connect(lfoGain).connect(filter.frequency);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
  lfo.start();
  return { context, source, gain, filter, lfo, lfoGain };
}

export default function SoundPlayer() {
  const engineRef = useRef<SoundEngine | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.source.stop();
    engine.lfo.stop();
    void engine.context.close();
  }, []);

  const togglePlayback = async () => {
    if (!engineRef.current) engineRef.current = createWaterAmbience();
    const engine = engineRef.current;
    if (engine.context.state === 'suspended') await engine.context.resume();
    const next = !playing;
    engine.gain.gain.cancelScheduledValues(engine.context.currentTime);
    engine.gain.gain.setTargetAtTime(next && !muted ? 0.12 : 0.0001, engine.context.currentTime, 0.6);
    setPlaying(next);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    const engine = engineRef.current;
    if (engine) {
      engine.gain.gain.cancelScheduledValues(engine.context.currentTime);
      engine.gain.gain.setTargetAtTime(playing && !next ? 0.12 : 0.0001, engine.context.currentTime, 0.25);
    }
  };

  return (
    <aside className="fixed bottom-5 left-4 z-40 flex items-center gap-1 border-double border-4 border-[#D4AF37]/45 bg-[#161412]/95 p-1.5 text-[#FDFBF7] shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur sm:bottom-6 sm:left-6" aria-label="Âm thanh thư giãn">
      <button type="button" onClick={togglePlayback} aria-pressed={playing} className="inline-flex min-h-10 items-center gap-2 px-2.5 text-xs font-semibold text-[#F3E5AB] transition-colors hover:text-[#E6B800]">
        <span className={`grid h-7 w-7 place-items-center rounded-full border border-[#D4AF37]/50 ${playing ? 'text-[#E6B800]' : 'text-[#D1C7B7]'}`}>{playing ? <Pause size={14} /> : <Play size={14} />}</span>
        <span className="hidden sm:inline">{playing ? 'Đang thư giãn' : 'Tiếng nước'}</span>
        <AudioLines size={15} className={playing ? 'animate-pulse text-[#E6B800]' : 'text-[#A09585]'} />
      </button>
      <button type="button" onClick={toggleMute} aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} aria-pressed={muted} className="grid h-9 w-9 place-items-center border-l border-[#4A3E2D] text-[#D1C7B7] transition-colors hover:text-[#E6B800]">
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </aside>
  );
}
