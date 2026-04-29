import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Page, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Đã thêm axios
import mascot from "../assets/game.png";
import gameBackground1 from "../assets/game-background-1.png";
import gameBackground2 from "../assets/game-background-2.png";
import gameKoi from "../assets/game-koi.png";
import gameShark from "../assets/game-shark.png";
import gameOceanWaves from "../assets/game-ocean-waves.png";
import "../css/game-style.css";

const GamePage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("START");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isScoring, setIsScoring] = useState(false);

  // Cấu hình vật lý & thông số Game
  const GRAVITY = 0.4;
  const JUMP_STRENGTH = -12;
  const PIPE_WIDTH = 150;
  const BASE_PIPE_SPEED = 5;
  const FISH_SIZE = 135;
  const PIPE_SPACING = 650;
  const HITBOX_PADDING = 55;
  const GROUND_HEIGHT = -10;
  const DIFFICULTY = {
    BASE_SPEED: BASE_PIPE_SPEED,
    MAX_SPEED: 8.5,
    BASE_SPACING: PIPE_SPACING,
    MIN_SPACING: 420,
    SCORE_STEP: 5,
    TIME_STEP_MS: 15000,
    SPEED_STEP: 0.35,
    SPACING_STEP: 10,
    PEAK_INTERVAL: 10,
    PEAK_DURATION: 1000,
    PEAK_SPEED_BONUS: 0.9,
    PEAK_SPACING_PENALTY: 60,
    SPACING_LAND_BUFFER_FRAMES: 12,
    PIPE_MIN_HEIGHT: 70,
    PIPE_MAX_HEIGHT_HARD_CAP: 170,
    PIPE_MAX_GROWTH_PER_LEVEL: 4,
    PIPE_MIN_GROWTH_PER_LEVEL: 1.5,
    PIPE_SAFETY_MARGIN: 15
  };

  const fishY = useRef(0);
  const fishVelocity = useRef(0);
  const pipes = useRef([]);
  const bubbles = useRef([]);
  const particles = useRef([]); 
  const bgX1 = useRef(0);
  const bgX2 = useRef(0);
  const frameId = useRef(null);
  const startTime = useRef(0);
  const peakUntil = useRef(0);
  const lastPeakScore = useRef(0);

  const getDifficultyState = (scoreValue, elapsedMs, now) => {
    const levelFromScore = Math.floor(scoreValue / DIFFICULTY.SCORE_STEP);
    const levelFromTime = Math.floor(elapsedMs / DIFFICULTY.TIME_STEP_MS);
    const level = levelFromScore + levelFromTime;

    const isPeak = now < peakUntil.current;

    let speed = DIFFICULTY.BASE_SPEED + level * DIFFICULTY.SPEED_STEP;
    if (isPeak) speed += DIFFICULTY.PEAK_SPEED_BONUS;
    speed = Math.min(speed, DIFFICULTY.MAX_SPEED);

    let spacing = DIFFICULTY.BASE_SPACING - level * DIFFICULTY.SPACING_STEP;
    if (isPeak) spacing -= DIFFICULTY.PEAK_SPACING_PENALTY;
    spacing = Math.max(spacing, DIFFICULTY.MIN_SPACING);

    const airTimeFrames = Math.ceil((2 * Math.abs(JUMP_STRENGTH)) / GRAVITY);
    const physicsMinSpacing = Math.floor(speed * (airTimeFrames + DIFFICULTY.SPACING_LAND_BUFFER_FRAMES));
    spacing = Math.max(spacing, physicsMinSpacing);

    const maxRise = (JUMP_STRENGTH * JUMP_STRENGTH) / (2 * GRAVITY);
    const maxClearablePipeHeight = Math.floor(maxRise + 5 - DIFFICULTY.PIPE_SAFETY_MARGIN);
    const pipeMaxHeight = Math.min(
      DIFFICULTY.PIPE_MAX_HEIGHT_HARD_CAP,
      maxClearablePipeHeight,
      Math.floor(110 + level * DIFFICULTY.PIPE_MAX_GROWTH_PER_LEVEL)
    );
    const pipeMinHeight = Math.min(
      pipeMaxHeight - 10,
      Math.floor(DIFFICULTY.PIPE_MIN_HEIGHT + level * DIFFICULTY.PIPE_MIN_GROWTH_PER_LEVEL)
    );

    return {
      speed,
      spacing,
      pipeMinHeight: Math.max(DIFFICULTY.PIPE_MIN_HEIGHT, pipeMinHeight),
      pipeMaxHeight: Math.max(DIFFICULTY.PIPE_MIN_HEIGHT + 10, pipeMaxHeight)
    };
  };

  const imgs = useRef({
    mascot: new Image(), bg1: new Image(), bg2: new Image(),
    koi: new Image(), shark: new Image(), wave: new Image()
  });

  useEffect(() => {
    imgs.current.mascot.src = mascot;
    imgs.current.bg1.src = gameBackground1;
    imgs.current.bg2.src = gameBackground2;
    imgs.current.koi.src = gameKoi;
    imgs.current.shark.src = gameShark;
    imgs.current.wave.src = gameOceanWaves;

    bubbles.current = Array.from({ length: 15 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 3 + 3,
      speed: Math.random() * 1 + 1,
      opacity: Math.random() * 0.4
    }));
  }, []);

  const resetGame = () => {
    const canvas = canvasRef.current;
    if (canvas) fishY.current = canvas.height - GROUND_HEIGHT - FISH_SIZE + 10;
    fishVelocity.current = 0; pipes.current = [];
    particles.current = []; setScore(0); setGameState("PLAYING");
    startTime.current = performance.now();
    peakUntil.current = 0;
    lastPeakScore.current = 0;
  };

  const jump = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const groundY = canvas.height - GROUND_HEIGHT - FISH_SIZE + 10;
    if (gameState === "PLAYING" && Math.abs(fishY.current - groundY) < 15) {
      fishVelocity.current = JUMP_STRENGTH;
      for(let i=0; i<8; i++) {
        particles.current.push({
          x: 100 + FISH_SIZE/2, y: groundY + FISH_SIZE - 20,
          vx: Math.random() * 4 - 2, vy: Math.random() * -4 - 2, life: 1.0
        });
      }
    }
  };

  const handleContinue = () => {
    // --- LOGIC GỬI DATA KHI BẤM TIẾP TỤC ---
    const savedData = localStorage.getItem("hito_player_data");
    if (savedData) {
      const userData = JSON.parse(savedData);
      let gift = "Móc khóa";
      if (score >= 2500) gift = "Khoá học";
      else if (score >= 1500) gift = "Sách học";

      const payload = {
        ...userData,
        score: score,
        gift_name: gift,
        submitted_at: new Date().toLocaleString("vi-VN"),
      };

      const BACKEND_URL = "https://api.hto.edu.vn/api/hito/submit";
      axios.post(BACKEND_URL, payload)
        .then(() => {
          console.log("✅ [Hito] Đã gửi data thành công từ GamePage.");
          localStorage.removeItem("hito_player_data");
        })
        .catch(err => console.error("❌ [Hito] Lỗi gửi data:", err.message));
    }
    // Chuyển trang
    navigate("/result", { state: { score: score } });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    const loop = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (gameState === "PLAYING") {
        const now = performance.now();
        const elapsedMs = startTime.current ? now - startTime.current : 0;
        if (score > 0 && score % DIFFICULTY.PEAK_INTERVAL === 0 && score !== lastPeakScore.current) {
          lastPeakScore.current = score;
          peakUntil.current = now + DIFFICULTY.PEAK_DURATION;
        }

        const groundY = canvas.height - GROUND_HEIGHT - FISH_SIZE + 10;
        fishVelocity.current += GRAVITY;
        fishY.current += fishVelocity.current;
        if (fishY.current >= groundY) { fishY.current = groundY; fishVelocity.current = 0; }
        
        const difficulty = getDifficultyState(score, elapsedMs, now);
        const currentSpeed = difficulty.speed;
        bgX1.current = (bgX1.current - currentSpeed * 0.3) % canvas.width;
        bgX2.current = (bgX2.current - currentSpeed * 0.6) % canvas.width;

        if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < canvas.width - difficulty.spacing) {
          const height = Math.random() * (difficulty.pipeMaxHeight - difficulty.pipeMinHeight) + difficulty.pipeMinHeight;
          pipes.current.push({ x: canvas.width, height, passed: false });
        }

        pipes.current.forEach((pipe) => {
          pipe.x -= currentSpeed;
          const fH = { x: 100 + HITBOX_PADDING, y: fishY.current + HITBOX_PADDING, w: FISH_SIZE - HITBOX_PADDING*2, h: FISH_SIZE - HITBOX_PADDING*2 };
          const pH = { x: pipe.x + 10, y: canvas.height - GROUND_HEIGHT - pipe.height + 15, w: PIPE_WIDTH - 20, h: pipe.height - 15 };
          
          if (fH.x < pH.x + pH.w && fH.x + fH.w > pH.x && fH.y < pH.y + pH.h && fH.y + fH.h > pH.y) {
            setGameState("GAME_OVER");
          }
          if (!pipe.passed && pipe.x < 100) { 
            pipe.passed = true; 
            setScore(s => s + 1); 
            setIsScoring(true); 
            setTimeout(() => setIsScoring(false), 200); 
          }
        });
        pipes.current = pipes.current.filter(p => p.x > -PIPE_WIDTH);
        bubbles.current.forEach(b => { b.y -= b.speed; if (b.y < -20) b.y = canvas.height + 20; });
        particles.current.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; if(p.life <= 0) particles.current.splice(i, 1); });
      }

      ctx.fillStyle = "#0e4b75";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (imgs.current.bg1.complete) {
        ctx.drawImage(imgs.current.bg1, bgX1.current | 0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgs.current.bg1, (bgX1.current + canvas.width) | 0, 0, canvas.width, canvas.height);
      }
      if (imgs.current.bg2.complete) {
        ctx.drawImage(imgs.current.bg2, bgX2.current | 0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgs.current.bg2, (bgX2.current + canvas.width) | 0, 0, canvas.width, canvas.height);
      }

      bubbles.current.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x | 0, b.y | 0, b.size, 0, 6.28);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity})`; ctx.fill();
      });

      pipes.current.forEach((p) => {
        if (imgs.current.wave.complete) ctx.drawImage(imgs.current.wave, p.x | 0, (canvas.height - GROUND_HEIGHT - p.height) | 0, PIPE_WIDTH, p.height + 15);
      });

      ctx.save();
      ctx.translate((100 + FISH_SIZE / 2) | 0, (fishY.current + FISH_SIZE / 2) | 0);
      if (imgs.current.mascot.complete) ctx.drawImage(imgs.current.mascot, (-FISH_SIZE / 2) | 0, (-FISH_SIZE / 2) | 0, FISH_SIZE, FISH_SIZE);
      ctx.restore();

      frameId.current = requestAnimationFrame(loop);
    };
    frameId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId.current);
  }, [gameState, score]);

  useEffect(() => { if (score > highScore) setHighScore(score); }, [score]);

  return (
    <Page className="game-page-container p-0 overflow-hidden">
      <div className="scanline"></div>
      <Box className="logo-game-header absolute top-0 w-full">
        <Text className="logo-main-text-game">HITO</Text>
        <Text className="logo-main-text-game" style={{ lineHeight: "0.8" }}>ADVENTURE</Text>
        <Box className="logo-sub-pill-game">
          <Text className="logo-sub-text-game">by HTO Group</Text>
        </Box>
      </Box>

      <Box className="relative w-full h-full" onClick={jump}>
        <Box className="absolute top-40 w-full flex justify-center z-10 pointer-events-none">
          <div className={`score-container ${isScoring ? "score-pop" : ""}`}>
            <Text className="text-white text-6xl font-black italic drop-shadow-md">{score}</Text>
          </div>
        </Box>

        <canvas ref={canvasRef} className="block w-full h-full" />

        {gameState !== "PLAYING" && (
          <Box className="absolute inset-0 bg-[#0e4b75]/50 backdrop-blur-sm flex items-center justify-center z-20 p-6">
            <Box className="bg-white rounded-[50px] p-8 w-full max-w-xs text-center shadow-2xl border-[5px] border-[#3a9edb]">
              <Text className="text-[#0e4b75] font-black text-3xl uppercase italic mb-4 tracking-tighter">
                {gameState === "START" ? "SẴN SÀNG?" : "KẾT THÚC"}
              </Text>
              
              {gameState === "GAME_OVER" && (
                <Box className="mb-6 bg-blue-50 rounded-[30px] py-4 border-2 border-blue-100">
                  <Text className="text-[#3a9edb] text-6xl font-black italic">{score}</Text>
                  <Text className="text-gray-400 font-bold text-xs mt-1 uppercase">Kỷ lục: {highScore}</Text>
                </Box>
              )}

              {gameState === "START" && (
                <Box className="mb-6 text-center flex flex-col items-center">
                  <img src={mascot} className="w-24 mb-4" alt="Mascot" />
                  <Text className="text-gray-500 font-bold px-4 text-xs uppercase tracking-wider">Vượt sóng dữ - Tích điểm đổi quà!</Text>
                </Box>
              )}

              <Box className="space-y-4">
                {gameState === "START" && (
                  <Button className="btn-hito-primary" onClick={resetGame}>CHƠI NGAY</Button>
                )}
                {gameState === "GAME_OVER" && (
                  <>
                    <Button className="btn-hito-primary" onClick={resetGame}>THỬ LẠI</Button>
                    <Button className="btn-hito-secondary" onClick={handleContinue}>TIẾP TỤC</Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Page>
  );
};

export default GamePage;
