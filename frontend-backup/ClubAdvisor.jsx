import { useEffect, useMemo, useRef, useState } from "react";

const C = {
  bg: "#210124",
  coral: "#FF5E5B",
  ivory: "#FFFFEA",
  bubble: { bot: "#FF5E5B", user: "#FFFFEA" },
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

const PIP_B64 = "data:image/png;base64,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";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const S = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    background: C.bg,
    fontFamily: "'DM Sans', sans-serif",
    color: C.ivory,
    overflow: "hidden",
    position: "relative",
  },
  grain: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
    backgroundSize: "200px 200px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 24px",
    borderBottom: `1px solid ${C.border}`,
    position: "relative",
    zIndex: 10,
    backdropFilter: "blur(8px)",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: C.ivory,
    cursor: "pointer",
    fontSize: 20,
    padding: "4px 8px 4px 0",
    opacity: 0.7,
    lineHeight: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${C.coral}, #c0392b)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
    objectFit: "cover",
    border: "2px solid rgba(255,94,91,0.4)",
  },
  botName: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 17,
    fontWeight: 400,
    color: C.ivory,
    lineHeight: 1.2,
  },
  botSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  menuBtn: {
    background: "none",
    border: "none",
    color: C.muted,
    cursor: "pointer",
    fontSize: 20,
    letterSpacing: 1,
    padding: 4,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    position: "relative",
    zIndex: 1,
  },
  msgRow: (isBot) => ({
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    flexDirection: isBot ? "row" : "row-reverse",
  }),
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  bubble: (isBot) => ({
    maxWidth: "72%",
    padding: "11px 16px",
    borderRadius: isBot ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
    background: isBot ? C.coral : C.ivory,
    color: "#210124",
    fontSize: 14,
    lineHeight: 1.55,
    fontWeight: isBot ? 500 : 400,
    border: "none",
    boxShadow: isBot ? "0 2px 12px rgba(255,94,91,0.25)" : "0 2px 8px rgba(0,0,0,0.15)",
  }),
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#210124",
    display: "inline-block",
    margin: "0 2px",
    animation: "bounce 1.2s infinite",
  },
  bottomArea: {
    position: "relative",
    zIndex: 10,
    padding: "0 16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  chipsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    paddingRight: 2,
  },
  chip: (selected) => ({
    padding: "9px 22px",
    borderRadius: 24,
    border: `1.5px solid ${selected ? C.coral : C.ivory}`,
    background: selected ? "rgba(255,94,91,0.18)" : "rgba(255,255,234,0.08)",
    color: selected ? C.coral : C.ivory,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.18s",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: selected ? 600 : 400,
    backdropFilter: "blur(6px)",
  }),
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: C.ivory,
    borderRadius: 30,
    padding: "10px 16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  inputBarIcon: { color: "#210124", fontSize: 18, cursor: "pointer", flexShrink: 0 },
  inputBarField: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: 14,
    color: "#210124",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  },
  micBtn: (rec) => ({
    background: rec ? C.coral : "rgba(33,1,36,0.1)",
    border: "none",
    borderRadius: "50%",
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.2s",
    fontSize: 16,
  }),
  sendBtn: {
    border: "none",
    background: "transparent",
    color: "#210124",
    fontSize: 18,
    cursor: "pointer",
    flexShrink: 0,
    opacity: 0.75,
    padding: 0,
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  },
  assistiveBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,234,0.06)",
    borderRadius: 16,
    padding: "10px 12px",
    color: C.ivory,
    fontSize: 13,
  },
  plainButton: {
    appearance: "none",
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,234,0.08)",
    color: C.ivory,
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
  },
  status: {
    fontSize: 12,
    color: C.muted,
  },
};

const VOICE_TEXT = "Click space to continue with voice speaking.";

function safeSpeakText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

export default function ClubAdvisor() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(STEPS.INTRO);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [gender, setGender] = useState("");
  const [major, setMajor] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Voice off");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const pendingSpeechRef = useRef(Promise.resolve());
  const shouldSpeakRef = useRef(false);

  const placeholder = useMemo(() => {
    if (step === "gender-other") return "Type how you identify…";
    if (step === STEPS.MAJOR) return "Type your major and press Enter…";
    if (step === STEPS.ABOUT) return "Tell Pip about who you are…";
    return "Message Pip…";
  }, [step]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, step]);

  useEffect(() => {
    if (!voiceEnabled) {
      stopAudio();
      setVoiceStatus("Voice off");
    }
  }, [voiceEnabled]);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  const speakViaBackend = async (text, force = false) => {
    const cleanText = safeSpeakText(text);
    if ((!voiceEnabled && !force) || !cleanText) return;

    shouldSpeakRef.current = true;
    setIsSpeaking(true);
    setVoiceStatus("Speaking…");

    try {
      const response = await fetch(`${API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = reject;
        audio.play().catch(reject);
      });

      URL.revokeObjectURL(url);
      setVoiceStatus("Voice on");
    } catch (error) {
      console.error(error);
      setVoiceStatus("Voice unavailable");
    } finally {
      setIsSpeaking(false);
      shouldSpeakRef.current = false;
    }
  };

  const botSay = (text, delay = 900) => {
    const cleanText = safeSpeakText(text);
    const task = pendingSpeechRef.current.then(
      () =>
        new Promise((resolve) => {
          setIsTyping(true);
          window.setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, from: "bot", text: cleanText }]);
            resolve(cleanText);
          }, delay);
        })
    );

    pendingSpeechRef.current = task.then((spokenText) => speakViaBackend(spokenText));
    return task;
  };

  const userSay = (text) => {
    setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, from: "user", text }]);
  };

  useEffect(() => {
    (async () => {
      await botSay("Hey! I'm Pip — your personal guide to campus life.", 700);
      await botSay("Finding the right clubs can honestly make or break your college experience, so let's get this right.", 1200);
      await botSay(VOICE_TEXT, 900);
      setStep(STEPS.GENDER);
    })();
  }, []);

  const handleGender = async (value) => {
    if (step !== STEPS.GENDER || isTyping) return;
    setGender(value);
    userSay(value.charAt(0).toUpperCase() + value.slice(1));
    if (value !== "other") {
      setStep(STEPS.MAJOR);
      await botSay("Nice! And what are you studying in college right now? Just type your major below.", 900);
    } else {
      setStep("gender-other");
      await botSay("Of course. Go ahead and type how you identify in the box below.", 900);
    }
  };

  const handleGenderOtherConfirm = async () => {
    if (!inputVal.trim()) return;
    userSay(inputVal.trim());
    setInputVal("");
    setStep(STEPS.MAJOR);
    await botSay("Got it, thanks for sharing. And what are you studying in college right now?", 900);
  };

  const handleMajorSubmit = async () => {
    if (!major.trim() || step !== STEPS.MAJOR) return;
    userSay(major.trim());
    setMajor(major.trim());
    setInputVal("");
    setStep(STEPS.ABOUT);
    await botSay("Love it. Last thing: tell me who you are and what you're interested in. Think hobbies, skills, goals, anything that feels like you.", 1200);
  };

  const handleAboutSubmit = async () => {
    if (!inputVal.trim() || step !== STEPS.ABOUT) return;
    const text = inputVal.trim();
    setInputVal("");
    userSay(text);
    setStep(STEPS.FINDING);
    await botSay("Okay, I love that. Give me just a second while I dig through the directory for you.", 1000);
    await botSay("I'm matching you based on everything you shared — your major, your vibe, all of it.", 1300);
    await botSay("Alright, here are your top matches. Once the backend is connected, I can read these out loud too.", 1200);
    setStep(STEPS.DONE);
  };

  const handleSend = () => {
    if (step === "gender-other") {
      handleGenderOtherConfirm();
      return;
    }
    if (step === STEPS.MAJOR) {
      handleMajorSubmit();
      return;
    }
    if (step === STEPS.ABOUT) {
      handleAboutSubmit();
    }
  };

  const handleInputChange = (val) => {
    setInputVal(val);
    if (step === STEPS.MAJOR) setMajor(val);
  };

  const handleVoiceToggle = async () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (next) {
        setVoiceStatus("Voice on");
        // Give a clear, user-triggered sound cue so it stays accessibility-friendly.
        void speakViaBackend(VOICE_TEXT, true);
      } else {
        setVoiceStatus("Voice off");
        stopAudio();
      }
      return next;
    });
  };

  const handleSpaceContinue = (event) => {
    if (event.key !== " ") return;
    const tag = event.target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || event.target.isContentEditable) return;
    if (!voiceEnabled) return;
    event.preventDefault();
    void speakViaBackend(VOICE_TEXT, true);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleSpaceContinue);
    return () => window.removeEventListener("keydown", handleSpaceContinue);
  }, [voiceEnabled]);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap"
        rel="stylesheet"
      />
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
        .duck-float { animation: float 10s ease-in-out infinite; }
        @keyframes float {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          20% { transform: translate(40px, -30px) rotate(4deg); }
          40% { transform: translate(-30px, -55px) rotate(-3deg); }
          60% { transform: translate(-50px, -20px) rotate(5deg); }
          80% { transform: translate(25px, -40px) rotate(-4deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        *:focus-visible {
          outline: 3px solid #ffffff;
          outline-offset: 3px;
        }
        input::placeholder { color: rgba(33,1,36,0.4); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,234,0.15); border-radius: 4px; }
        @media (prefers-reduced-motion: reduce) {
          .msg-anim, .chip-anim, .duck-float, .mic-on { animation: none !important; }
          html:focus-within { scroll-behavior: auto; }
        }
      `}</style>

      <div style={S.root}>
        <div style={S.grain} />

        <header style={S.header}>
          <button type="button" style={S.backBtn} aria-label="Go back">←</button>
          <img src={PIP_B64} alt="Pip the advisor duck" style={S.avatar} />
          <div style={{ flex: 1 }}>
            <div style={S.botName}>Pip (Advisor Duck)</div>
            <div style={S.botSub}>Your trusted advisor for club matching</div>
          </div>
          <button
            type="button"
            style={{ ...S.plainButton, fontSize: 12 }}
            onClick={handleVoiceToggle}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? "Turn voice off" : "Turn voice on"}
          >
            {voiceEnabled ? "Voice on" : "Voice off"}
          </button>
        </header>

        <div style={S.assistiveBar} aria-live="polite" aria-atomic="true">
          <span>{voiceStatus}</span>
          <span style={S.status}>{isSpeaking ? "Reading aloud" : "Keyboard friendly"}</span>
        </div>

        <div style={S.messages} aria-live="polite" aria-relevant="additions text">
          <div
            style={{ position: "absolute", left: "50%", bottom: "8%", transform: "translateX(-50%)", zIndex: 0, pointerEvents: "none" }}
          >
            <img
              src={PIP_B64}
              alt=""
              className="duck-float"
              style={{ width: 220, height: 220, objectFit: "contain", filter: "drop-shadow(0 12px 32px rgba(255,94,91,0.2))", opacity: 0.9 }}
            />
          </div>

          {messages.map((msg) => (
            <div key={msg.id} style={S.msgRow(msg.from === "bot")} className="msg-anim">
              {msg.from === "bot" && <img src={PIP_B64} alt="Pip" style={S.msgAvatar} />}
              <div style={S.bubble(msg.from === "bot")}>{msg.text}</div>
            </div>
          ))}

          {isTyping && (
            <div style={S.msgRow(true)} className="msg-anim">
              <img src={PIP_B64} alt="Pip" style={S.msgAvatar} />
              <div style={{ ...S.bubble(true), padding: "12px 18px" }}>
                <span style={S.typingDot} />
                <span style={{ ...S.typingDot, animationDelay: "0.2s" }} />
                <span style={{ ...S.typingDot, animationDelay: "0.4s" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={S.bottomArea}>
          {step === STEPS.GENDER && !isTyping && (
            <div className="chip-anim">
              <div style={S.chipsRow}>
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    type="button"
                    key={g}
                    style={S.chip(gender === g.toLowerCase())}
                    onClick={() => handleGender(g.toLowerCase())}
                    aria-pressed={gender === g.toLowerCase()}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div style={{ ...S.inputBar, marginTop: 10, opacity: 0.5, pointerEvents: "none" }}>
                <span style={S.inputBarIcon}>☰</span>
                <div style={{ ...S.inputBarField, color: "rgba(33,1,36,0.4)" }}>Message Pip…</div>
                <div style={S.micBtn(false)}>🎙️</div>
                <span style={S.sendBtn}>🔍</span>
              </div>
            </div>
          )}

          {(step === "gender-other" || step === STEPS.MAJOR || step === STEPS.ABOUT || step === STEPS.DONE) && !isTyping && (
            <div style={S.inputBar} className="chip-anim">
              <span style={S.inputBarIcon} aria-hidden="true">☰</span>
              <input
                ref={inputRef}
                style={S.inputBarField}
                placeholder={placeholder}
                value={inputVal}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                autoFocus
                aria-label={placeholder}
              />
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={isRecording ? "mic-on" : ""}
                style={S.micBtn(isRecording)}
                title={isRecording ? "Stop recording" : "Speak to Pip"}
                aria-label={isRecording ? "Stop recording" : "Speak to Pip"}
              >
                {isRecording ? "⏹" : "🎙️"}
              </button>
              <button type="button" style={S.sendBtn} onClick={handleSend} aria-label="Send message">🔍</button>
            </div>
          )}

          {(step === STEPS.INTRO || (step === STEPS.GENDER && isTyping)) && <div style={{ height: 56 }} />}
        </div>
      </div>
    </>
  );
}
