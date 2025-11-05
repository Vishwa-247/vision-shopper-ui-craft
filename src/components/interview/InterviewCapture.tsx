import React, { useEffect, useRef, useState } from "react";

type Props = {
  onAudioReady: (blob: Blob) => void;
  onFaceFrame: (jpegBase64: string) => void;
  onTranscriptUpdate?: (text: string) => void;
  faceIntervalMs?: number;
  wsEnabled?: boolean; // scaffold only, disabled by default
  wsUrl?: string;
  onRecordingChange?: (recording: boolean) => void;
};

const InterviewCapture: React.FC<Props> = ({
  onAudioReady,
  onFaceFrame,
  faceIntervalMs = 2000,
  wsEnabled = false,
  wsUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const faceTimerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [recording, setRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0); // seconds
  const [audioLevel, setAudioLevel] = useState(0);
  const maxDurationSec = 180;
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  useEffect(() => {
    const init = async () => {
      const a = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const v = await navigator.mediaDevices.getUserMedia({ video: true });
      setAudioStream(a);
      setVideoStream(v);
      if (videoRef.current) {
        videoRef.current.srcObject = v;
        await videoRef.current.play();
      }
    };
    init().catch(console.error);
    return () => {
      if (audioStream) audioStream.getTracks().forEach((t) => t.stop());
      if (videoStream) videoStream.getTracks().forEach((t) => t.stop());
      if (faceTimerRef.current) window.clearInterval(faceTimerRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureStreams = async () => {
    if (!audioStream) {
      const a = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setAudioStream(a);
    }
    if (!videoStream) {
      const v = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(v);
      if (videoRef.current) {
        videoRef.current.srcObject = v;
        await videoRef.current.play();
      }
    }
    // Apply current toggle states to tracks if streams already exist
    if (audioStream) audioStream.getAudioTracks().forEach(t => (t.enabled = micEnabled));
    if (videoStream) videoStream.getVideoTracks().forEach(t => (t.enabled = camEnabled));
  };

  const startRecording = async () => {
    try {
      await ensureStreams();
    } catch (e) {
      console.error('Media permission error:', e);
      return;
    }
    if (!audioStream) return;
    audioChunksRef.current = [];

    if (wsEnabled && wsUrl && !wsRef.current) {
      try {
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.onopen = () => {
          // Connected for transcription streaming
        };
        wsRef.current.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data?.transcript && typeof onTranscriptUpdate === 'function') {
              onTranscriptUpdate(data.transcript);
            }
          } catch {
            // ignore
          }
        };
      } catch (e) {
        console.warn("WS init failed", e);
      }
    }

    const mr = new MediaRecorder(audioStream, { mimeType: "audio/webm;codecs=opus" });
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunksRef.current.push(e.data);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(e.data);
        }
      }
    };
    mr.start(1000); // 1s chunks
    mediaRecorderRef.current = mr;
    setRecording(true);
    if (typeof onRecordingChange === 'function') onRecordingChange(true);

    // start timer
    setRecordingTime(0);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((t) => {
        const next = t + 1;
        if (next >= maxDurationSec) {
          // auto-stop at limit
          stopRecording().catch(() => {});
        }
        return next;
      });
    }, 1000);

    if (faceTimerRef.current) window.clearInterval(faceTimerRef.current);
    faceTimerRef.current = window.setInterval(captureFaceFrame, faceIntervalMs);

    // setup audio analyser for level meter
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const source = ctx.createMediaStreamSource(audioStream);
      source.connect(analyser);
      analyserRef.current = analyser;
      audioCtxRef.current = ctx;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length; // 0-255
        setAudioLevel(avg);
        if (recording) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (e) {
      // ignore analyser errors
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    if (typeof onRecordingChange === 'function') onRecordingChange(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
      });
    }
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
    onAudioReady(audioBlob);

    if (faceTimerRef.current) {
      window.clearInterval(faceTimerRef.current);
      faceTimerRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    wsRef.current = null;
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
  };

  const captureFaceFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!camEnabled) return; // don't capture when camera is off
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    onFaceFrame(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="rounded border p-2 bg-black">
        <video ref={videoRef} className="max-w-full" muted playsInline />
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Time: {String(Math.floor(recordingTime / 60)).padStart(2,'0')}:{String(recordingTime % 60).padStart(2,'0')} / 03:00
        </div>
        <div className="flex items-center gap-2">
          <span>Mic</span>
          <div className="h-2 w-24 bg-muted rounded">
            <div className="h-2 bg-green-500 rounded" style={{ width: `${Math.min(100, Math.round((audioLevel/255)*100))}%` }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            try {
              await ensureStreams();
              const next = !micEnabled;
              setMicEnabled(next);
              if (audioStream) audioStream.getAudioTracks().forEach(t => (t.enabled = next));
            } catch {}
          }}
          className={`px-3 py-2 rounded ${micEnabled ? 'bg-primary text-white' : 'bg-secondary text-foreground'}`}
        >
          {micEnabled ? 'Mic On' : 'Mic Off'}
        </button>
        <button
          onClick={async () => {
            try {
              await ensureStreams();
              const next = !camEnabled;
              setCamEnabled(next);
              if (videoStream) videoStream.getVideoTracks().forEach(t => (t.enabled = next));
            } catch {}
          }}
          className={`px-3 py-2 rounded ${camEnabled ? 'bg-primary text-white' : 'bg-secondary text-foreground'}`}
        >
          {camEnabled ? 'Camera On' : 'Camera Off'}
        </button>
        {!recording ? (
          <button onClick={startRecording} className="px-3 py-2 rounded bg-primary text-white">
            Start Interview (audio + camera analysis)
          </button>
        ) : (
          <button onClick={stopRecording} className="px-3 py-2 rounded bg-red-600 text-white">
            Stop & Save Answer
          </button>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default InterviewCapture;
