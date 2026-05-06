import React, { useState, useRef, useEffect } from "react";
import { Box, Button, Page, Text, Modal } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Volume2, VolumeX } from "lucide-react";
import bgMain from "../assets/bg_main.png";
import jazzBgm from "../assets/sounds/Jazz.m4a?url";
import jackpotSfx from "../assets/sounds/Jackpot.m4a?url";

const BACKEND_URL = "https://api.hto.edu.vn/api/hito/submit";
const STORAGE_MUTED_KEY = "hito_lucky_spin_muted";
const STORAGE_SKIP_INFO_KEY = "hito_skip_info";
const STORAGE_PLAYER_KEY = "hito_player_data";

const BGM_VOLUME = 0.25;
const JACKPOT_VOLUME = 0.9;
const SPIN_DURATION = 5000;
const EXTRA_SPINS = 5;

const REWARDS = [
  {
    label: "Gối ôm cổ",
    weight: 10,
    isPrize: true,
    message: "Congrats! Bạn đã nhận GỐI ÔM CỔ – ready cho những chuyến bay ‘xịn sò’ phía trước",
  },
  {
    label: "Lời chúc 1",
    weight: 18,
    isPrize: false,
    message: "Chúc bạn sớm chạm tay đến giấc mơ du học và định cư mà bạn luôn ấp ủ 🌏",
  },
  {
    label: "Lời chúc 2",
    weight: 14,
    isPrize: false,
    message: "Một vòng quay nhỏ – một bước tiến lớn trên hành trình vươn ra thế giới ✈️",
  },
  {
    label: "Lời chúc 3",
    weight: 14,
    isPrize: false,
    message: "HTO chúc bạn luôn vững tin trên hành trình xây dựng tương lai tại nước ngoài 💼",
  },
  {
    label: "Lời chúc 4",
    weight: 12,
    isPrize: false,
    message: "Cơ hội toàn cầu đang gọi tên bạn – sẵn sàng bứt phá chưa? 🚀",
  },
  {
    label: "Lời chúc 5",
    weight: 10,
    isPrize: false,
    message: "Hành trình vạn dặm bắt đầu từ một vòng quay – chúc bạn sớm đạt được mục tiêu lớn 🎯",
  },
  {
    label: "Lời chúc 6",
    weight: 22,
    isPrize: false,
    message: "Một ngày không xa, bạn sẽ tự hào về quyết định bắt đầu từ hôm nay 🏡",
  },
];

const NUM_REWARDS = REWARDS.length;
const ARC_SIZE = (2 * Math.PI) / NUM_REWARDS;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const pickWeightedIndex = (items) => {
  const totalWeight = items.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    if (random < items[i].weight) return i;
    random -= items[i].weight;
  }
  return 0;
};

const LuckySpinPage = () => {
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [prize, setPrize] = useState(null);
  const [resultText, setResultText] = useState("");
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem(STORAGE_MUTED_KEY) === "1");
  const isMutedRef = useRef(isMuted);
  const canvasRef = useRef(null);
  const currentAngle = useRef(0);
  const frameId = useRef(null);
  const bgmRef = useRef(null);
  const jackpotElRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const audioCtxRef = useRef(null);
  const jackpotBufferRef = useRef(null);
  const jackpotLoadingRef = useRef(false);
  const isTestMode = (import.meta?.env?.DEV ?? false) || localStorage.getItem(STORAGE_SKIP_INFO_KEY) === "1";

  const startBgm = (mutedOverride) => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    const shouldMute = mutedOverride ?? isMutedRef.current;
    if (shouldMute) {
      bgm.pause();
      return;
    }

    bgm.muted = false;
    bgm.volume = BGM_VOLUME;

    bgm.play().catch(() => {
      bgm.muted = true;
      bgm.play().catch(() => {});
    });
  };

  const decodeAudioDataAsync = (ctx, arrayBuffer) =>
    new Promise((resolve, reject) => {
      try {
        const maybePromise = ctx.decodeAudioData(arrayBuffer, resolve, reject);
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(resolve).catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });

  const ensureJackpotBufferLoaded = async () => {
    if (jackpotBufferRef.current) return;
    if (jackpotLoadingRef.current) return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = new AudioContextCtor();
      audioCtxRef.current = ctx;
    }

    jackpotLoadingRef.current = true;
    try {
      const res = await fetch(jackpotSfx);
      const arr = await res.arrayBuffer();
      const decoded = await decodeAudioDataAsync(ctx, arr);
      jackpotBufferRef.current = decoded;
    } catch {
    } finally {
      jackpotLoadingRef.current = false;
    }
  };

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) {
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContextCtor();
        audioCtxRef.current.resume?.().catch(() => {});
      } catch {
      }
    }

    ensureJackpotBufferLoaded();

    const bgm = bgmRef.current;
    const sfx = jackpotElRef.current;

    if (bgm) {
      const prevMuted = bgm.muted;
      bgm.muted = true;
      bgm.play()
        .then(() => {
          bgm.pause();
          bgm.currentTime = 0;
          bgm.muted = prevMuted;
        })
        .catch(() => {
          bgm.muted = prevMuted;
        });
    }

    if (sfx) {
      const prevVolume = sfx.volume;
      sfx.volume = 0;
      sfx.play()
        .then(() => {
          sfx.pause();
          sfx.currentTime = 0;
          sfx.volume = prevVolume;
        })
        .catch(() => {
          sfx.volume = prevVolume;
        });
    }
  };

  const playJackpot = () => {
    if (isMutedRef.current) return;
    const sfx = jackpotElRef.current;
    const bgm = bgmRef.current;
    const prevBgmVolume = bgm ? bgm.volume : null;

    const ctx = audioCtxRef.current;
    const buffer = jackpotBufferRef.current;
    if (ctx && buffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        if (bgm) bgm.volume = Math.min(bgm.volume, 0.12);
        source.start(0);
        if (bgm && prevBgmVolume !== null) {
          window.setTimeout(() => {
            const nowBgm = bgmRef.current;
            if (nowBgm) nowBgm.volume = prevBgmVolume;
          }, 900);
        }
        return;
      } catch {
      }
    }

    if (!sfx) return;
    try {
      sfx.pause();
      sfx.currentTime = 0;
      if (bgm) bgm.volume = Math.min(bgm.volume, 0.12);
      sfx.play().catch(() => {});
      if (bgm && prevBgmVolume !== null) {
        window.setTimeout(() => {
          const nowBgm = bgmRef.current;
          if (nowBgm) nowBgm.volume = prevBgmVolume;
        }, 900);
      }
    } catch {
    }
  };

  const handleClaimPrize = () => {
    const savedData = localStorage.getItem(STORAGE_PLAYER_KEY);
    if (savedData && prize?.isPrize && !isTestMode) {
      const userData = JSON.parse(savedData);
      const payload = {
        ...userData,
        score: 0,
        gift_name: prize.label,
        submitted_at: new Date().toLocaleString("vi-VN"),
      };

      axios
        .post(BACKEND_URL, payload)
        .then(() => {
          localStorage.removeItem(STORAGE_PLAYER_KEY);
        })
        .catch((err) => {
          console.error("❌ [Hito] Lỗi gửi data trúng thưởng:", err.message);
        });
    }
    setResultModal(false);
    if (!isTestMode) navigate("/", { replace: true });
  };

  useEffect(() => {
    drawWheel();
  }, []);

  useEffect(() => {
    const bgm = new Audio(jazzBgm);
    bgm.loop = true;
    bgm.volume = BGM_VOLUME;
    bgm.preload = "auto";
    bgmRef.current = bgm;

    const sfx = new Audio(jackpotSfx);
    sfx.loop = false;
    sfx.volume = JACKPOT_VOLUME;
    sfx.preload = "auto";
    jackpotElRef.current = sfx;

    startBgm();

    const onFirstUserGesture = () => unlockAudio();
    window.addEventListener("pointerdown", onFirstUserGesture);
    window.addEventListener("touchstart", onFirstUserGesture);

    return () => {
      window.removeEventListener("pointerdown", onFirstUserGesture);
      window.removeEventListener("touchstart", onFirstUserGesture);

      if (frameId.current) cancelAnimationFrame(frameId.current);

      bgm.pause();
      bgmRef.current = null;

      sfx.pause();
      jackpotElRef.current = null;

      try {
        audioCtxRef.current?.close?.();
      } catch {
      }
      audioCtxRef.current = null;
      jackpotBufferRef.current = null;
      jackpotLoadingRef.current = false;
    };
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
    const bgm = bgmRef.current;
    const sfx = jackpotElRef.current;
    if (bgm) {
      if (isMuted) {
        bgm.pause();
      } else {
        bgm.muted = false;
        bgm.volume = BGM_VOLUME;
        bgm.pause();
        startBgm(false);
      }
    }
    if (sfx) {
      sfx.volume = isMuted ? 0 : JACKPOT_VOLUME;
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_MUTED_KEY, next ? "1" : "0");
      if (!next) {
        unlockAudio();
        startBgm(false);
      } else {
        bgmRef.current?.pause();
      }
      return next;
    });
  };

  const drawWheel = (rotation = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const fontSize = Math.max(12, Math.floor(radius * 0.1));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    REWARDS.forEach((reward, i) => {
      const angle = rotation + i * ARC_SIZE;
      const hue = (i * 360) / NUM_REWARDS;
      const sliceGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.12,
        centerX,
        centerY,
        radius
      );
      sliceGradient.addColorStop(0, `hsla(${hue}, 95%, 75%, 1)`);
      sliceGradient.addColorStop(0.55, `hsla(${(hue + 18) % 360}, 95%, 58%, 1)`);
      sliceGradient.addColorStop(1, `hsla(${hue}, 95%, 42%, 1)`);
      
      ctx.beginPath();
      ctx.fillStyle = sliceGradient;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + ARC_SIZE);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + ARC_SIZE / 2);
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = hue > 40 && hue < 80 ? "#0e4b75" : "white";
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillText(reward.label, radius - 24, 5);
      ctx.restore();
    });

    const ringGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.6,
      centerX,
      centerY,
      radius + 6
    );
    ringGradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    ringGradient.addColorStop(1, "rgba(255, 255, 255, 0.95)");
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = ringGradient;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#0e4b75";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const spin = () => {
    if (isSpinning) return;

    unlockAudio();
    startBgm();
    setIsSpinning(true);

    const selectedIndex = pickWeightedIndex(REWARDS);
    const startRotation = currentAngle.current;
    
    const targetRotation = startRotation + 
                           (EXTRA_SPINS * 2 * Math.PI) + 
                           (2 * Math.PI - (startRotation % (2 * Math.PI))) + 
                           (1.5 * Math.PI) - 
                           ((selectedIndex + 0.5) * ARC_SIZE);

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      
      const nowRotation = startRotation + (targetRotation - startRotation) * easeOutCubic(progress);
      currentAngle.current = nowRotation;
      drawWheel(nowRotation);

      if (progress < 1) {
        frameId.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const selectedReward = REWARDS[selectedIndex];
        playJackpot();
        setPrize(selectedReward);
        setResultText(selectedReward?.message || selectedReward?.label || "");
        setResultModal(true);
      }
    };

    frameId.current = requestAnimationFrame(animate);
  };

  return (
    <Page className="flex flex-col h-full overflow-hidden" style={{ backgroundImage: `url(${bgMain})`, backgroundSize: 'cover' }}>
      <Box className="flex-1 flex flex-col items-center justify-center p-4">
        <Box className="bg-white/90 rounded-[3rem] p-8 w-full max-w-sm text-center shadow-2xl border-4 border-white relative">
          <Text className="text-[#0e4b75] font-black text-3xl uppercase italic mb-2">
            VÒNG QUAY
          </Text>
          <Text className="text-[#3a9edb] font-black text-xl uppercase italic mb-8">
            MAY MẮN
          </Text>
          
          <Box className="relative flex items-center justify-center mb-8">
            <Box className="absolute -top-4 left-1/2 -translate-x-1/2 z-20" style={{
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderTop: '30px solid #ff4757',
              filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))'
            }} />
            
            <Box className="rounded-full p-2 bg-[#0e4b75] shadow-xl border-4 border-white w-full max-w-[360px]">
              <canvas 
                ref={canvasRef} 
                width={360} 
                height={360}
                style={{ width: "100%", height: "auto", maxWidth: "340px" }}
                className="rounded-full"
              />
            </Box>
          </Box>

          <Box className="space-y-4">
            <Button 
              fullWidth 
              className={`rounded-full font-black h-14 text-xl shadow-lg border-b-4 transition-all ${
                isSpinning ? 'bg-gray-400 border-gray-500 opacity-70' : 'bg-[#f9d423] text-[#0e4b75] border-[#c58f1f] active:translate-y-1 active:border-b-0'
              }`}
              onClick={spin}
              disabled={isSpinning}
            >
              {isSpinning ? "ĐANG QUAY..." : "QUAY NGAY"}
            </Button>
            
            <Button 
              fullWidth 
              variant="secondary" 
              className="rounded-full font-bold h-12 text-gray-500" 
              onClick={() => navigate("/")}
              disabled={isSpinning}
            >
              VỀ TRANG CHỦ
            </Button>
          </Box>

          <Box className="mt-6 flex justify-center">
            <Button
              size="small"
              className="rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-md border bg-white text-[#0e4b75]"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
          </Box>
        </Box>
      </Box>

      <Modal
        visible={resultModal}
        title={prize?.isPrize ? "CHÚC MỪNG!" : "CHÚC BẠN MAY MẮN!"}
        onClose={() => setResultModal(false)}
        verticalActions
      >
        <Box className="p-6 text-center">
          {prize?.isPrize ? (
            <>
              <Text className="text-3xl font-black italic mb-4 text-[#3a9edb]">
                {prize?.label}
              </Text>
              <Text className="text-gray-600 font-semibold text-sm mb-6">
                {resultText}
              </Text>
            </>
          ) : (
            <Text className="text-[#0e4b75] font-black italic text-lg mb-6">
              {resultText}
            </Text>
          )}
          <Box className="w-24 h-24 bg-[#f0f9ff] rounded-full mx-auto flex items-center justify-center mb-6 border-4 border-[#3a9edb] animate-bounce">
            <Text className="text-4xl">{prize?.isPrize ? "🎁" : "🍀"}</Text>
          </Box>
          <Button 
            fullWidth 
            className={`${prize?.isPrize ? "bg-[#3a9edb] text-white" : "bg-[#f9d423] text-[#0e4b75]"} rounded-full font-bold h-12 shadow-lg`}
            onClick={prize?.isPrize ? handleClaimPrize : () => setResultModal(false)}
          >
            {prize?.isPrize ? "NHẬN QUÀ" : "QUAY TIẾP"}
          </Button>
        </Box>
      </Modal>
    </Page>
  );
};

export default LuckySpinPage;