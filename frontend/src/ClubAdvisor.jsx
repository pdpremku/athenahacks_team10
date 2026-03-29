import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "http://localhost:8000";

const C = {
  bg: "#210124",
  coral: "#FF5E5B",
  ivory: "#FFFFEA",
  muted: "rgba(255,255,234,0.45)",
  border: "rgba(255,255,234,0.12)",
};

const STEPS = {
  INTRO: "intro",
  GENDER: "gender",
  MAJOR: "major",
  ABOUT: "about",
  FINDING: "finding",
  DONE: "done",
};

const VOICE_TEXT = "Click space to continue with voice speaking.";

function safeSpeakText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function normalizeClub(club) {
  if (typeof club === "string") {
    return { name: club, description: "" };
  }
  if (club && typeof club === "object") {
    return {
      name: club.name || club.title || "Club",
      description: club.description || club.reason || club.summary || "",
    };
  }
  return { name: "Club", description: "" };
}

export default function ClubAdvisor() {
  const [messages, setMessages] = useState([]);
  const [clubResults, setClubResults] = useState([]);
  const [step, setStep] = useState(STEPS.INTRO);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [gender, setGender] = useState("");
  const [major, setMajor] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Voice off");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const pendingSpeechRef = useRef(Promise.resolve());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const placeholder = useMemo(() => {
    if (step === "gender-other") return "Type how you identify…";
    if (step === STEPS.MAJOR) return "Type your major and press Enter…";
    if (step === STEPS.ABOUT) return "Tell Pip about who you are…";
    if (step === STEPS.DONE) return "Ask Pip another question…";
    return "Message Pip…";
  }, [step]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, step, clubResults]);

  useEffect(() => {
    if (!voiceEnabled) {
      stopAudio();
      setVoiceStatus("Voice off");
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if (step === STEPS.MAJOR || step === STEPS.ABOUT || step === "gender-other" || step === STEPS.DONE) {
      inputRef.current?.focus();
    }
  }, [step]);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  const speak = async (text, force = false) => {
    const cleanText = safeSpeakText(text);
    if (!cleanText || (!voiceEnabled && !force)) return;

    setIsSpeaking(true);
    setVoiceStatus("Speaking…");

    try {
      const response = await fetch(`${API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`TTS failed (${response.status}): ${detail}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch((err) => {
          URL.revokeObjectURL(url);
          reject(err);
        });
      });

      setVoiceStatus("Voice on");
    } catch (error) {
      console.error("TTS error:", error);
      setVoiceStatus("Voice unavailable");
    } finally {
      setIsSpeaking(false);
    }
  };

  const userSay = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, from: "user", text },
    ]);
  };

  const botSay = (text, delay = 900) => {
    const cleanText = safeSpeakText(text);

    const task = pendingSpeechRef.current.then(
      () =>
        new Promise((resolve) => {
          setIsTyping(true);
          window.setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              { id: `${Date.now()}-${Math.random()}`, from: "bot", text: cleanText },
            ]);
            resolve(cleanText);
          }, delay);
        })
    );

    pendingSpeechRef.current = task.then((spokenText) => {
      if (voiceEnabled) {
        return speak(spokenText);
      }
      return undefined;
    });

    return task;
  };

  const submitGenderOther = async (answer) => {
    const trimmed = safeSpeakText(answer);
    if (!trimmed) return;

    setGender(trimmed);
    userSay(trimmed);
    setInputVal("");
    setStep(STEPS.MAJOR);
    await botSay("Got it, thanks for sharing. What are you studying in college right now?", 900);
  };

  const submitMajor = async (answer) => {
    const trimmed = safeSpeakText(answer);
    if (!trimmed) return;

    setMajor(trimmed);
    userSay(trimmed);
    setInputVal("");
    setStep(STEPS.ABOUT);
    await botSay(
      "Love it. Last thing: tell me who you are and what you're interested in. Think hobbies, skills, goals, anything that feels like you.",
      1200
    );
  };

  const submitAbout = async (answer) => {
    const trimmed = safeSpeakText(answer);
    if (!trimmed) return;

    userSay(trimmed);
    setInputVal("");
    setStep(STEPS.FINDING);

    await botSay("Okay, I love that. Give me just a second while I look for clubs that fit you.", 1000);
    await botSay("I'm matching you based on everything you shared — your major, your vibe, all of it.", 1200);

    let clubs = [];
    try {
      const response = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          major,
          about: trimmed,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.clubs)) {
          clubs = data.clubs;
        }
      } else {
        console.error("Recommend failed:", await response.text());
      }
    } catch (error) {
      console.error("Recommend error:", error);
    }

    setClubResults(clubs.map(normalizeClub));
    await botSay("Alright, I found some matches. You can review them below.", 900);
    setStep(STEPS.DONE);
  };

  const handleGender = async (value) => {
    if (step !== STEPS.GENDER || isTyping) return;

    const lower = value.toLowerCase();
    setGender(lower);
    userSay(value.charAt(0).toUpperCase() + value.slice(1));

    if (lower !== "other") {
      setStep(STEPS.MAJOR);
      await botSay("Nice! And what are you studying in college right now? You can type it or use the mic.", 900);
    } else {
      setStep("gender-other");
      await botSay("Of course. Go ahead and type how you identify, or use the mic to answer.", 900);
    }
  };

  const applyTranscript = (transcript) => {
  const clean = safeSpeakText(transcript);
  if (!clean) return;

  const lower = clean.toLowerCase();

  if (step === STEPS.GENDER) {
    if (lower.includes("female") || lower.includes("woman") || lower.includes("girl")) {
      void handleGender("female");
      return;
    }

    if (lower.includes("male") || lower.includes("man") || lower.includes("boy")) {
      void handleGender("male");
      return;
    }

    if (lower.includes("other") || lower.includes("nonbinary") || lower.includes("non-binary")) {
      void handleGender("other");
      return;
    }

    setVoiceStatus("Say male, female, or other.");
    return;
  }

  if (step === "gender-other") {
    setInputVal(clean);
    void handleGenderOtherConfirm();
    return;
  }

  if (step === STEPS.MAJOR) {
    setInputVal(clean);
    setMajor(clean);
    return;
  }

  if (step === STEPS.ABOUT) {
    setInputVal(clean);
    return;
  }

  setInputVal(clean);
};

  const pickRecorderMimeType = () => {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  if (typeof window.MediaRecorder === "undefined") return "";

  return candidates.find((type) => window.MediaRecorder.isTypeSupported(type)) || "";
};

const transcribeAudio = async (blob) => {
  if (!blob || blob.size < 1000) {
    throw new Error("Recording is too small to transcribe");
  }

  const form = new FormData();
  form.append("audio", blob, "recording.webm");

  const response = await fetch(`${API_BASE}/stt`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`STT failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  applyTranscript(data.text || "");
  return data.text || "";
};

const startListening = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    setVoiceStatus("Microphone unavailable");
    return;
  }

  if (isListening) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickRecorderMimeType();

    if (!mimeType) {
      stream.getTracks().forEach((track) => track.stop());
      setVoiceStatus("No supported audio recording format");
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      console.error("Recorder error:", event.error);
      setVoiceStatus("Speech input unavailable");
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());

      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || mimeType });
      console.log("Recorded audio:", {
        mimeType: recorder.mimeType,
        blobType: blob.type,
        blobSize: blob.size,
        chunks: audioChunksRef.current.length,
      });

      try {
        setIsListening(false);
        setVoiceStatus("Transcribing…");
        const transcript = await transcribeAudio(blob);
        setVoiceStatus(transcript ? "Transcript captured" : "No speech detected");
      } catch (error) {
        console.error("STT error:", error);
        setVoiceStatus(`Speech input unavailable: ${error.message}`);
      } finally {
        setIsListening(false);
      }
    };

    recorder.start(1000);
    setIsListening(true);
    setVoiceStatus("Listening…");
  } catch (error) {
    console.error("Mic error:", error);
    if (error.name === "NotAllowedError") {
      setVoiceStatus("Microphone permission denied");
    } else if (error.name === "NotFoundError") {
      setVoiceStatus("No microphone found");
    } else {
      setVoiceStatus(`Microphone unavailable: ${error.message}`);
    }
    setIsListening(false);
  }
};

const stopListening = () => {
  const recorder = mediaRecorderRef.current;
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
  }
};

  const handleVoiceToggle = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (next) {
        setVoiceStatus("Voice on");
        void speak("Voice enabled.", true);
      } else {
        setVoiceStatus("Voice off");
        stopAudio();
      }
      return next;
    });
  };

  const handleSend = () => {
    if (step === "gender-other") {
      void submitGenderOther(inputVal);
      return;
    }
    if (step === STEPS.MAJOR) {
      void submitMajor(inputVal);
      return;
    }
    if (step === STEPS.ABOUT) {
      void submitAbout(inputVal);
      return;
    }
  };

  const handleInputChange = (val) => {
    setInputVal(val);
    if (step === STEPS.MAJOR) setMajor(val);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== " ") return;
      const tag = event.target?.tagName?.toLowerCase?.() || "";
      if (tag === "input" || tag === "textarea" || event.target?.isContentEditable) return;
      if (!voiceEnabled) return;
      event.preventDefault();
      void speak(VOICE_TEXT, true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [voiceEnabled]);

  useEffect(() => {
    const runIntro = async () => {
      await botSay("Hey! I'm Pip — your personal guide to campus life.", 700);
      await botSay(
        "Finding the right clubs can honestly make or break your college experience, so let's get this right.",
        1200
      );
      await botSay(VOICE_TEXT, 900);
      setStep(STEPS.GENDER);
    };

    void runIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255,94,91,0.55); }
          70% { box-shadow: 0 0 0 10px rgba(255,94,91,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,94,91,0); }
        }
        .msg-anim, .chip-anim { animation: fadeUp 0.3s ease forwards; }
        .mic-on { animation: pulse-ring 1.2s infinite; }
        *:focus-visible {
          outline: 3px solid #ffffff;
          outline-offset: 3px;
        }
        input::placeholder { color: rgba(33,1,36,0.4); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,234,0.15); border-radius: 4px; }
        @media (prefers-reduced-motion: reduce) {
          .msg-anim, .chip-anim, .mic-on { animation: none !important; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100%",
          background: C.bg,
          fontFamily: "'DM Sans', sans-serif",
          color: C.ivory,
          overflow: "hidden",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 24px",
            borderBottom: `1px solid ${C.border}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.coral}, #c0392b)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              border: "2px solid rgba(255,94,91,0.4)",
              flexShrink: 0,
            }}
          >
            🦆
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Pip (Advisor Duck)</div>
            <div style={{ fontSize: 12, color: C.muted }}>Your trusted advisor for club matching</div>
          </div>
          <button
            type="button"
            onClick={handleVoiceToggle}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? "Turn voice off" : "Turn voice on"}
            style={{
              appearance: "none",
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,234,0.08)",
              color: C.ivory,
              borderRadius: 999,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {voiceEnabled ? "Voice on" : "Voice off"}
          </button>
        </header>

        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,234,0.06)",
            borderRadius: 16,
            padding: "10px 12px",
            margin: "12px 16px 0",
            color: C.ivory,
            fontSize: 13,
          }}
        >
          <span>{voiceStatus}</span>
          <span style={{ fontSize: 12, color: C.muted }}>
            {isSpeaking ? "Reading aloud" : isListening ? "Listening" : "Keyboard friendly"}
          </span>
        </div>

        <div
          aria-live="polite"
          aria-relevant="additions text"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 20px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "relative",
          }}
        >
          {messages.map((msg) => {
            const isBot = msg.from === "bot";
            return (
              <div
                key={msg.id}
                className="msg-anim"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  flexDirection: isBot ? "row" : "row-reverse",
                }}
              >
                {isBot && (
                  <div
                    aria-hidden="true"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.coral}, #c0392b)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    🦆
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "72%",
                    padding: "11px 16px",
                    borderRadius: isBot ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                    background: isBot ? C.coral : C.ivory,
                    color: "#210124",
                    fontSize: 14,
                    lineHeight: 1.55,
                    fontWeight: isBot ? 500 : 400,
                    boxShadow: isBot
                      ? "0 2px 12px rgba(255,94,91,0.25)"
                      : "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div
              className="msg-anim"
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                flexDirection: "row",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.coral}, #c0392b)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                🦆
              </div>
              <div
                style={{
                  maxWidth: "72%",
                  padding: "12px 18px",
                  borderRadius: "18px 18px 18px 4px",
                  background: C.coral,
                  color: "#210124",
                  boxShadow: "0 2px 12px rgba(255,94,91,0.25)",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#210124",
                    display: "inline-block",
                    margin: "0 2px",
                    animation: "bounce 1.2s infinite",
                  }}
                />
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#210124",
                    display: "inline-block",
                    margin: "0 2px",
                    animation: "bounce 1.2s infinite",
                    animationDelay: "0.2s",
                  }}
                />
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#210124",
                    display: "inline-block",
                    margin: "0 2px",
                    animation: "bounce 1.2s infinite",
                    animationDelay: "0.4s",
                  }}
                />
              </div>
            </div>
          )}

          {step === STEPS.DONE && clubResults.length > 0 && (
            <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
              {clubResults.map((club, idx) => (
                <div
                  key={`${club.name}-${idx}`}
                  style={{
                    background: "rgba(255,255,234,0.08)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{club.name}</div>
                  {club.description ? (
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.4 }}>{club.description}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={{ position: "relative", padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {step === STEPS.GENDER && !isTyping && (
            <div className="chip-anim">
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  paddingRight: 2,
                }}
              >
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGender(g.toLowerCase())}
                    aria-pressed={gender === g.toLowerCase()}
                    style={{
                      padding: "9px 22px",
                      borderRadius: 24,
                      border: `1.5px solid ${gender === g.toLowerCase() ? C.coral : C.ivory}`,
                      background: gender === g.toLowerCase() ? "rgba(255,94,91,0.18)" : "rgba(255,255,234,0.08)",
                      color: gender === g.toLowerCase() ? C.coral : C.ivory,
                      fontSize: 14,
                      cursor: "pointer",
                      fontWeight: gender === g.toLowerCase() ? 700 : 400,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={isListening ? "mic-on" : ""}
                aria-label={isListening ? "Stop recording" : "Speak your answer"}
                title={isListening ? "Stop recording" : "Speak your answer"}
                style={{
                  marginTop: 10,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  border: `1px solid ${C.border}`,
                  background: isListening ? C.coral : "rgba(255,255,234,0.08)",
                  color: isListening ? "#210124" : C.ivory,
                  borderRadius: 18,
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
              >
                <span aria-hidden="true">{isListening ? "⏹" : "🎙️"}</span>
                <span>{isListening ? "Stop speaking" : "Speak your answer"}</span>
              </button>

              <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                Say “male,” “female,” or “other.”
              </div>
            </div>
          )}

          {(step === "gender-other" || step === STEPS.MAJOR || step === STEPS.ABOUT || step === STEPS.DONE) && !isTyping && (
            <div className="chip-anim">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: C.ivory,
                  borderRadius: 30,
                  padding: "10px 16px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                }}
              >
                <span aria-hidden="true" style={{ color: "#210124", fontSize: 18, flexShrink: 0 }}>
                  ☰
                </span>
                <input
                  ref={inputRef}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: 14,
                    color: "#210124",
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                  placeholder={placeholder}
                  value={inputVal}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  aria-label={placeholder}
                />
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={isListening ? "mic-on" : ""}
                  style={{
                    background: isListening ? C.coral : "rgba(33,1,36,0.1)",
                    border: "none",
                    borderRadius: "50%",
                    width: 34,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    fontSize: 16,
                  }}
                  title={isListening ? "Stop recording" : "Speak to Pip"}
                  aria-label={isListening ? "Stop recording" : "Speak to Pip"}
                >
                  {isListening ? "⏹" : "🎙️"}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  aria-label="Send message"
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#210124",
                    fontSize: 18,
                    cursor: "pointer",
                    flexShrink: 0,
                    opacity: 0.75,
                    padding: 0,
                  }}
                >
                  🔍
                </button>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                Speak, then press stop. Pip will turn your speech into text.
              </div>
            </div>
          )}

          {(step === STEPS.INTRO || (step === STEPS.GENDER && isTyping)) && <div style={{ height: 56 }} />}
        </div>
      </div>
    </>
  );
}