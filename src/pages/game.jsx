import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Page, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import mascot from "../assets/game.png";
import gameBackground1 from "../assets/game-background-1.png";
import gameBackground2 from "../assets/game-background-2.png";
import gameKoi from "../assets/game-koi.png";
import gameShark from "../assets/game-shark.png";
import gameOceanWaves from "../assets/game-ocean-waves.png";
import bgMain from "../assets/bg_main.png";
import "../css/game-style.css";

const GamePage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("START"); // START, PLAYING, GAME_OVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game constants
  const GRAVITY = 0.4; // Trọng lực phong cách Dino
  const JUMP_STRENGTH = -12; // Lực nhảy
  const PIPE_WIDTH = 80; // Chiều rộng sóng biển
  const BASE_PIPE_SPEED = 4.5; // Tốc độ cơ bản
  const FISH_SIZE = 120; // Tăng kích thước nhân vật lên 120
  const PIPE_SPACING = 450; // Tăng khoảng cách vật cản để dễ hơn
  const HITBOX_PADDING = 25; // Vùng đệm va chạm cho nhân vật to
  const GROUND_HEIGHT = 60; // Độ cao mặt đất

  // Game state refs (for the game loop)
  const fishY = useRef(0);
  const fishVelocity = useRef(0);
  const fishRotation = useRef(0);
  const pipes = useRef([]);
  const decoFish = useRef([]); // Cá trang trí (Koi, Shark)
  const bgX1 = useRef(0); // Vị trí X của background lớp 1
  const bgX2 = useRef(0); // Vị trí X của background lớp 2
  const frameId = useRef(null);

  // Image refs
  const mascotImg = useRef(new Image());
  const backgroundImg1 = useRef(new Image());
  const backgroundImg2 = useRef(new Image());
  const koiImg = useRef(new Image());
  const sharkImg = useRef(new Image());
  const waveImg = useRef(new Image());

  useEffect(() => {
    mascotImg.current.src = mascot;
    backgroundImg1.current.src = gameBackground1;
    backgroundImg2.current.src = gameBackground2;
    koiImg.current.src = gameKoi;
    sharkImg.current.src = gameShark;
    waveImg.current.src = gameOceanWaves;
  }, []);

  const resetGame = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      fishY.current = canvas.height - GROUND_HEIGHT - FISH_SIZE + 10;
    }
    fishVelocity.current = 0;
    fishRotation.current = 0;
    pipes.current = [];
    decoFish.current = [];
    bgX1.current = 0;
    bgX2.current = 0;
    setScore(0);
    setGameState("PLAYING");
  };

  const jump = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const groundY = canvas.height - GROUND_HEIGHT - FISH_SIZE + 10;
    if (gameState === "PLAYING" && Math.abs(fishY.current - groundY) < 10) {
      fishVelocity.current = JUMP_STRENGTH;
    } else if (gameState === "START" || gameState === "GAME_OVER") {
      resetGame();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const update = () => {
      if (gameState !== "PLAYING") return;

      const groundY = canvas.height - GROUND_HEIGHT - FISH_SIZE + 10;

      // Update fish gravity and movement
      fishVelocity.current += GRAVITY;
      fishY.current += fishVelocity.current;

      if (fishY.current >= groundY) {
        fishY.current = groundY;
        fishVelocity.current = 0;
        fishRotation.current = 0;
      } else {
        // Xoay nhân vật: nhảy lên ngước đầu, rơi xuống chúi đầu
        fishRotation.current = (fishVelocity.current * Math.PI) / 60;
      }

      // Update pipes (ocean waves)
      if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < canvas.width - PIPE_SPACING) {
        const waveHeight = Math.random() * 40 + 70; // 70px to 110px
        pipes.current.push({ x: canvas.width, height: waveHeight, passed: false });
      }

      // Update decorative fish (Koi, Shark)
      if (Math.random() < 0.005 && decoFish.current.length < 3) {
        const type = Math.random() > 0.5 ? 'koi' : 'shark';
        const size = type === 'shark' ? 120 : 80;
        decoFish.current.push({
          x: canvas.width,
          y: Math.random() * (canvas.height - 300) + 50,
          speed: Math.random() * 2 + 1,
          type: type,
          size: size
        });
      }

      const currentSpeed = BASE_PIPE_SPEED + Math.floor(score / 5) * 0.5;

      // Update background scrolling positions
      bgX1.current -= currentSpeed * 0.3; // Lớp xa cuộn chậm
      bgX2.current -= currentSpeed * 0.6; // Lớp gần cuộn nhanh hơn
      
      // Reset positions to loop
      if (bgX1.current <= -canvas.width) bgX1.current = 0;
      if (bgX2.current <= -canvas.width) bgX2.current = 0;

      // Move deco fish
      decoFish.current.forEach(f => f.x -= currentSpeed * 0.7);
      decoFish.current = decoFish.current.filter(f => f.x > -200);

      pipes.current.forEach((pipe) => {
        pipe.x -= currentSpeed;

        // Collision detection
        const fishHitbox = {
          x: 100 + HITBOX_PADDING,
          y: fishY.current + HITBOX_PADDING,
          w: FISH_SIZE - HITBOX_PADDING * 2,
          h: FISH_SIZE - HITBOX_PADDING * 2
        };

        const pipeHitbox = {
          x: pipe.x + 10, // Giúp dễ hơn
          y: canvas.height - GROUND_HEIGHT - pipe.height + 15,
          w: PIPE_WIDTH - 20,
          h: pipe.height - 15
        };

        if (
          fishHitbox.x < pipeHitbox.x + pipeHitbox.w &&
          fishHitbox.x + fishHitbox.w > pipeHitbox.x &&
          fishHitbox.y < pipeHitbox.y + pipeHitbox.h &&
          fishHitbox.y + fishHitbox.h > pipeHitbox.y
        ) {
          setGameState("GAME_OVER");
        }

        if (!pipe.passed && pipe.x < 100) {
          pipe.passed = true;
          setScore((s) => s + 1);
        }
      });

      if (pipes.current[0] && pipes.current[0].x < -PIPE_WIDTH) {
        pipes.current.shift();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw scrolling backgrounds (parallax)
      // Lớp 1 (xa)
      if (backgroundImg1.current.complete) {
        ctx.drawImage(backgroundImg1.current, bgX1.current, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg1.current, bgX1.current + canvas.width, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Lớp 2 (gần)
      if (backgroundImg2.current.complete) {
        ctx.drawImage(backgroundImg2.current, bgX2.current, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg2.current, bgX2.current + canvas.width, 0, canvas.width, canvas.height);
      }

      // Draw decorative fish
      decoFish.current.forEach(f => {
        const img = f.type === 'koi' ? koiImg.current : sharkImg.current;
        if (img.complete) {
          ctx.globalAlpha = 0.6; // Làm mờ nhẹ để sinh động
          ctx.drawImage(img, f.x, f.y, f.size, f.size * 0.6);
          ctx.globalAlpha = 1.0;
        }
      });

      // Draw ground (Ocean surface/bottom)
      ctx.fillStyle = "rgba(58, 158, 219, 0.3)";
      ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

      // Draw obstacles (Ocean waves)
      pipes.current.forEach((pipe) => {
        const pipeY = canvas.height - GROUND_HEIGHT - pipe.height;
        if (waveImg.current.complete) {
          ctx.drawImage(waveImg.current, pipe.x, pipeY, PIPE_WIDTH, pipe.height + 10);
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(pipe.x, pipeY, PIPE_WIDTH, pipe.height);
        }
      });

      // Draw fish character with rotation
      ctx.save();
      const centerX = 100 + FISH_SIZE / 2;
      const centerY = fishY.current + FISH_SIZE / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(fishRotation.current);

      if (mascotImg.current.complete) {
        ctx.drawImage(mascotImg.current, -FISH_SIZE / 2, -FISH_SIZE / 2, FISH_SIZE, FISH_SIZE);
      } else {
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(-FISH_SIZE / 2, -FISH_SIZE / 2, FISH_SIZE, FISH_SIZE);
      }
      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      frameId.current = requestAnimationFrame(loop);
    };

    if (gameState === "PLAYING") {
      frameId.current = requestAnimationFrame(loop);
    } else {
      draw();
    }

    return () => cancelAnimationFrame(frameId.current);
  }, [gameState, score]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  return (
    <Page className="game-page-container p-0 overflow-hidden" style={{ backgroundImage: `url(${bgMain})`, backgroundSize: 'cover' }}>
      <Box className="relative w-full h-full flex flex-col items-center justify-center">
        <Box className="absolute top-10 left-0 w-full text-center z-10 pointer-events-none">
          <Text className="text-white text-4xl font-black italic drop-shadow-lg">
            {score}
          </Text>
        </Box>

        <Box className="w-full h-full bg-transparent" onClick={jump}>
          <canvas ref={canvasRef} className="block w-full h-full" />
        </Box>

        {gameState !== "PLAYING" && (
          <Box className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 p-6">
            <Box className="bg-white rounded-3xl p-8 w-full max-w-xs text-center shadow-2xl">
              <Text className="text-[#0e4b75] font-black text-3xl uppercase italic mb-4">
                {gameState === "START" ? "HITO OCEAN" : "GAME OVER"}
              </Text>
              
              {gameState === "GAME_OVER" && (
                <Box className="mb-6">
                  <Text className="text-gray-500 font-bold uppercase text-xs">Điểm số</Text>
                  <Text className="text-[#3a9edb] text-5xl font-black italic">{score}</Text>
                  <Text className="text-gray-400 font-bold text-sm mt-2">Kỷ lục: {highScore}</Text>
                </Box>
              )}

              {gameState === "START" && (
                <Text className="text-gray-600 font-medium mb-8">
                  Chạm để nhảy qua những con sóng dữ!
                </Text>
              )}

              <Box className="space-y-3">
                <Button fullWidth className="bg-[#3a9edb] rounded-full font-bold h-12 text-lg shadow-lg" onClick={resetGame}>
                  {gameState === "START" ? "BẮT ĐẦU" : "CHƠI LẠI"}
                </Button>
                <Button fullWidth variant="secondary" className="rounded-full font-bold h-12 text-gray-500" onClick={() => navigate("/")}>
                  VỀ TRANG CHỦ
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Page>
  );
};

export default GamePage;
