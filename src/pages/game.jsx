import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Page, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import mascot from "../assets/game.png";
import bgMain from "../assets/bg_main.png";
import "../css/game-style.css";

const GamePage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("START"); // START, PLAYING, GAME_OVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game constants
  const GRAVITY = 0.4; // Trọng lực mạnh hơn cho phong cách Dino
  const JUMP_STRENGTH = -12; // Lực nhảy mạnh hơn
  const PIPE_WIDTH = 50; // Chiều rộng vật cản
  const BASE_PIPE_SPEED = 4.5; // Tốc độ cơ bản nhanh hơn
  const FISH_SIZE = 100; // Tăng kích thước nhân vật lên 100
  const PIPE_SPACING = 400; // Khoảng cách giữa các vật cản
  const HITBOX_PADDING = 20; // Vùng đệm va chạm
  const GROUND_HEIGHT = 80; // Độ cao của mặt đất từ đáy canvas

  // Game state refs (for the game loop)
  const fishY = useRef(0);
  const fishVelocity = useRef(0);
  const fishRotation = useRef(0);
  const pipes = useRef([]);
  const frameId = useRef(null);

  const mascotImg = useRef(new Image());
  useEffect(() => {
    mascotImg.current.src = mascot;
  }, []);

  const resetGame = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      fishY.current = canvas.height - GROUND_HEIGHT - FISH_SIZE;
    }
    fishVelocity.current = 0;
    fishRotation.current = 0;
    pipes.current = [];
    setScore(0);
    setGameState("PLAYING");
  };

  const jump = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const groundY = canvas.height - GROUND_HEIGHT - FISH_SIZE;
    // Chỉ cho phép nhảy khi đang ở trên mặt đất (phong cách Dino)
    if (gameState === "PLAYING" && Math.abs(fishY.current - groundY) < 5) {
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
    
    // Initial size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const update = () => {
      if (gameState !== "PLAYING") return;

      const groundY = canvas.height - GROUND_HEIGHT - FISH_SIZE;

      // Update fish gravity and movement
      fishVelocity.current += GRAVITY;
      fishY.current += fishVelocity.current;

      // Giới hạn mặt đất
      if (fishY.current >= groundY) {
        fishY.current = groundY;
        fishVelocity.current = 0;
        fishRotation.current = 0; // Khi chạm đất thì không xoay
      } else {
        // Xoay nhân vật dựa trên vận tốc khi nhảy/rơi
        fishRotation.current = (fishVelocity.current * Math.PI) / 90; // Xoay tối đa ~45 độ
      }

      // Update pipes (obstacles on ground)
      if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < canvas.width - PIPE_SPACING) {
        // Chiều cao vật cản ngẫu nhiên
        const obstacleHeight = Math.random() * 50 + 60; // 60px to 110px
        pipes.current.push({ x: canvas.width, height: obstacleHeight, passed: false });
      }

      // Tính toán tốc độ hiện tại dựa trên điểm số (tăng tốc mỗi 5 điểm)
      const currentSpeed = BASE_PIPE_SPEED + Math.floor(score / 5) * 0.5;

      pipes.current.forEach((pipe, index) => {
        pipe.x -= currentSpeed;

        // Collision detection
        const fishHitbox = {
          x: 100 + HITBOX_PADDING,
          y: fishY.current + HITBOX_PADDING,
          w: FISH_SIZE - HITBOX_PADDING * 2,
          h: FISH_SIZE - HITBOX_PADDING * 2
        };

        const pipeHitbox = {
          x: pipe.x,
          y: canvas.height - GROUND_HEIGHT - pipe.height,
          w: PIPE_WIDTH,
          h: pipe.height
        };

        if (
          fishHitbox.x < pipeHitbox.x + pipeHitbox.w &&
          fishHitbox.x + fishHitbox.w > pipeHitbox.x &&
          fishHitbox.y < pipeHitbox.y + pipeHitbox.h &&
          fishHitbox.y + fishHitbox.h > pipeHitbox.y
        ) {
          setGameState("GAME_OVER");
        }

        // Score update
        if (!pipe.passed && pipe.x < 100) {
          pipe.passed = true;
          setScore((s) => s + 1);
        }
      });

      // Remove off-screen pipes
      if (pipes.current[0] && pipes.current[0].x < -PIPE_WIDTH) {
        pipes.current.shift();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = "#70c5ce";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      ctx.fillStyle = "#3a9edb";
      ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 2);

      // Draw pipes (icebergs on ground)
      pipes.current.forEach((pipe) => {
        const pipeY = canvas.height - GROUND_HEIGHT - pipe.height;
        const gradient = ctx.createLinearGradient(pipe.x, pipeY, pipe.x + PIPE_WIDTH, pipeY);
        gradient.addColorStop(0, "#ADD8E6"); // Light blue
        gradient.addColorStop(0.5, "#FFFFFF"); // White
        gradient.addColorStop(1, "#ADD8E6"); // Light blue
        ctx.fillStyle = gradient;

        // Draw iceberg triangle/trapezoid
        ctx.beginPath();
        ctx.moveTo(pipe.x, canvas.height - GROUND_HEIGHT);
        ctx.lineTo(pipe.x + PIPE_WIDTH / 2, pipeY);
        ctx.lineTo(pipe.x + PIPE_WIDTH, canvas.height - GROUND_HEIGHT);
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = "#87CEEB";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw fish (mascot) with rotation
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
      draw(); // Draw static frame
    }

    return () => cancelAnimationFrame(frameId.current);
  }, [gameState]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  return (
    <Page className="game-page-container p-0 overflow-hidden" style={{ backgroundImage: `url(${bgMain})`, backgroundSize: 'cover' }}>
      <Box className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Score Display */}
        <Box className="absolute top-10 left-0 w-full text-center z-10 pointer-events-none">
          <Text className="text-white text-4xl font-black italic drop-shadow-lg">
            {score}
          </Text>
        </Box>

        {/* Canvas Area */}
        <Box 
          className="w-full h-full bg-transparent"
          onClick={jump}
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
          />
        </Box>

        {/* Overlay for Start/Game Over */}
        {gameState !== "PLAYING" && (
          <Box className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 p-6">
            <Box className="bg-white rounded-3xl p-8 w-full max-w-xs text-center shadow-2xl">
              <Text className="text-[#0e4b75] font-black text-3xl uppercase italic mb-4">
                {gameState === "START" ? "HITO ADVENTURE" : "GAME OVER"}
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
                  Chạm vào màn hình để nhảy và vượt qua các chướng ngại vật!
                </Text>
              )}

              <Box className="space-y-3">
                <Button 
                  fullWidth 
                  className="bg-[#3a9edb] rounded-full font-bold h-12 text-lg shadow-lg"
                  onClick={resetGame}
                >
                  {gameState === "START" ? "BẮT ĐẦU" : "CHƠI LẠI"}
                </Button>
                <Button 
                  fullWidth 
                  variant="secondary"
                  className="rounded-full font-bold h-12 text-gray-500"
                  onClick={() => navigate("/")}
                >
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
