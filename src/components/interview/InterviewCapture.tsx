import React, { useEffect, useRef, useState } from "react";

type Props = {
  onAudioReady: (blob: Blob) => void;
  onFaceFrame: (jpegBase64: string) => void;
  faceIntervalMs?: number;
  wsEnabled?: boolean; // scaffold only, disabled by default
  wsUrl?: string;
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

  const startRecording = () => {
    if (!audioStream) return;
    audioChunksRef.current = [];

    if (wsEnabled && wsUrl && !wsRef.current) {
      try {
        wsRef.current = new WebSocket(wsUrl);
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

    if (faceTimerRef.current) window.clearInterval(faceTimerRef.current);
    faceTimerRef.current = window.setInterval(captureFaceFrame, faceIntervalMs);
  };

  const stopRecording = async () => {
    setRecording(false);
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
  };

  const captureFaceFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
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
      <div className="flex gap-2">
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
