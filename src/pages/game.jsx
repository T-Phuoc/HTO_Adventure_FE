import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Page, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import mascot from "../assets/mascot-CdQs06Pp.png";
import bgMain from "../assets/bg_main.png";

const GamePage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("START"); // START, PLAYING, GAME_OVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game constants
  const GRAVITY = 0.2;
  const JUMP_STRENGTH = -5;
  const PIPE_WIDTH = 40;
  const PIPE_GAP = 120;
  const PIPE_SPEED = 2;
  const BIRD_SIZE = 40;

  // Game state refs (for the game loop)
  const birdY = useRef(200);
  const birdVelocity = useRef(0);
  const pipes = useRef([]);
  const frameId = useRef(null);

  const mascotImg = useRef(new Image());
  useEffect(() => {
    mascotImg.current.src = mascot;
  }, []);

  const resetGame = () => {
    birdY.current = 200;
    birdVelocity.current = 0;
    pipes.current = [];
    setScore(0);
    setGameState("PLAYING");
  };

  const jump = () => {
    if (gameState === "PLAYING") {
      birdVelocity.current = JUMP_STRENGTH;
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

      // Update bird
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      // Check floor/ceiling collision
      if (birdY.current + BIRD_SIZE > canvas.height || birdY.current < 0) {
        setGameState("GAME_OVER");
      }

      // Update pipes
      if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < canvas.width - 200) {
        const topHeight = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
        pipes.current.push({ x: canvas.width, topHeight, passed: false });
      }

      pipes.current.forEach((pipe, index) => {
        pipe.x -= PIPE_SPEED;

        // Collision detection
        if (
          100 < pipe.x + PIPE_WIDTH &&
          100 + BIRD_SIZE > pipe.x &&
          (birdY.current < pipe.topHeight || birdY.current + BIRD_SIZE > pipe.topHeight + PIPE_GAP)
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

      // Draw background (optional, could be a simple color or image)
      ctx.fillStyle = "#70c5ce";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw pipes
      ctx.fillStyle = "#2ecc71";
      pipes.current.forEach((pipe) => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height - (pipe.topHeight + PIPE_GAP));
      });

      // Draw bird (mascot)
      if (mascotImg.current.complete) {
        ctx.drawImage(mascotImg.current, 100, birdY.current, BIRD_SIZE, BIRD_SIZE);
      } else {
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(100, birdY.current, BIRD_SIZE, BIRD_SIZE);
      }
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
