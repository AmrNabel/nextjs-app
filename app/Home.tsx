"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { SetStateAction, useRef, useState } from "react";
import {
  Button,
  CircularProgress,
  TextField,
  Container,
  Typography,
} from "@mui/material";

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [trimmedVideo, setTrimmedVideo] = useState<string | null>(null);

  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    setLoaded(true);
    setIsLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const videoURL = URL.createObjectURL(file);
      if (videoRef.current) videoRef.current.src = videoURL;
    }
  };

  const trimVideo = async () => {
    if (!uploadedFile || !startTime || !endTime) {
      alert("Please upload a video and specify start and end times.");
      return;
    }

    const ffmpeg = ffmpegRef.current;
    const fileData = await fetchFile(uploadedFile);
    await ffmpeg.writeFile("input.mp4", fileData);

    // Execute FFmpeg command for trimming
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-ss",
      startTime,
      "-to",
      endTime,
      "-c",
      "copy",
      "output.mp4",
    ]);

    const data = (await ffmpeg.readFile("output.mp4")) as any;
    const trimmedVideoURL = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" })
    );
    setTrimmedVideo(trimmedVideoURL);
  };

  return loaded ? (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Video Trimmer
      </Typography>

      <video
        ref={videoRef}
        controls
        style={{ maxWidth: "100%", marginBottom: "16px" }}
      ></video>

      <input
        type="file"
        accept="video/mp4,video/x-m4v,video/*"
        onChange={handleFileUpload}
        style={{ display: "none" }}
        id="upload-video"
      />
      <label htmlFor="upload-video">
        <Button variant="contained" component="span" color="primary">
          Upload Video
        </Button>
      </label>

      <div style={{ margin: "16px 0" }}>
        <TextField
          label="Start Time (e.g., 00:00:10)"
          variant="outlined"
          value={startTime}
          onChange={(e: { target: { value: SetStateAction<string> } }) =>
            setStartTime(e.target.value)
          }
          margin="normal"
          fullWidth
        />
        <TextField
          label="End Time (e.g., 00:00:20)"
          variant="outlined"
          value={endTime}
          onChange={(e: { target: { value: SetStateAction<string> } }) =>
            setEndTime(e.target.value)
          }
          margin="normal"
          fullWidth
        />
      </div>

      <Button variant="contained" color="secondary" onClick={trimVideo}>
        Trim Video
      </Button>

      {trimmedVideo && (
        <div style={{ marginTop: "16px" }}>
          <Typography variant="h6">Trimmed Video:</Typography>
          <video
            src={trimmedVideo}
            controls
            style={{ maxWidth: "100%" }}
          ></video>
        </div>
      )}

      <p ref={messageRef} style={{ marginTop: "16px" }}></p>
    </Container>
  ) : (
    <Container
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={load}
        disabled={isLoading}
        startIcon={isLoading && <CircularProgress size={24} />}
      >
        Load FFmpeg
      </Button>
    </Container>
  );
}
