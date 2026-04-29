import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Page, Text, Modal } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import bgMain from "../assets/bg_main.png";

const SYMBOLS = ["7️⃣", "🍒", "🍋", "🔔", "💎", "🍇"];

const SlotMachinePage = () => {
  const navigate = useNavigate();
  const [reels, setReels] = useState(["7️⃣", "7️⃣", "7️⃣"]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winMessage, setWinMessage] = useState("");

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWinMessage("");

    // Giả lập quay trong 2 giây
    const spinDuration = 2000;
    const interval = 100; // Cập nhật hình ảnh mỗi 100ms
    
    let elapsed = 0;
    const timer = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      elapsed += interval;
      
      if (elapsed >= spinDuration) {
        clearInterval(timer);
        
        // Kết quả cuối cùng
        const finalReels = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];
        
        // Demo: Tăng tỉ lệ trúng 777 cho vui
        if (Math.random() < 0.2) {
            finalReels[0] = finalReels[1] = finalReels[2] = "7️⃣";
        }

        setReels(finalReels);
        setIsSpinning(false);
        checkWin(finalReels);
      }
    }, interval);
  };

  const checkWin = (result) => {
    if (result[0] === result[1] && result[1] === result[2]) {
      setWinMessage(`CHÚC MỪNG! BẠN TRÚNG 3 HÌNH ${result[0]}`);
      setShowWinModal(true);
    }
  };

  return (
    <Page className="flex flex-col h-full overflow-hidden" style={{ backgroundImage: `url(${bgMain})`, backgroundSize: 'cover' }}>
      <Box className="flex-1 flex flex-col items-center justify-center p-4">
        <Box className="bg-[#1a1a1a] rounded-[2rem] p-6 w-full max-w-sm text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#f9d423] relative">
          
          {/* Header */}
          <Box className="mb-8">
            <Text className="text-[#f9d423] font-black text-4xl uppercase italic tracking-widest drop-shadow-[0_2px_4px_rgba(249,212,35,0.5)]">
              SLOT 777
            </Text>
            <Box className="flex justify-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Box key={i} className="w-2 h-2 rounded-full bg-[#f9d423] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </Box>
          </Box>

          {/* Reels Container */}
          <Box className="bg-[#000] rounded-xl p-4 flex justify-between gap-2 mb-8 border-2 border-[#333] inner-shadow">
            {reels.map((symbol, idx) => (
              <Box 
                key={idx} 
                className={`flex-1 h-32 bg-white rounded-lg flex items-center justify-center text-5xl shadow-inner transition-all duration-75 ${isSpinning ? 'opacity-80 scale-95' : ''}`}
                style={{
                   background: 'linear-gradient(180deg, #eee 0%, #fff 50%, #eee 100%)',
                   border: '2px solid #ccc'
                }}
              >
                {symbol}
              </Box>
            ))}
          </Box>

          {/* Controls */}
          <Box className="space-y-4">
            <Button 
              fullWidth 
              className={`rounded-full font-black h-16 text-2xl shadow-[0_8px_0_#c58f1f] transition-all border-2 border-[#fce27a] ${
                isSpinning ? 'bg-gray-600 border-gray-700 opacity-50 shadow-none translate-y-2' : 'bg-gradient-to-b from-[#fce27a] to-[#f9d423] text-[#0e4b75]'
              }`}
              onClick={spin}
              disabled={isSpinning}
            >
              {isSpinning ? "QUAY..." : "SPIN!"}
            </Button>
            
            <Button 
              fullWidth 
              variant="secondary" 
              className="rounded-full font-bold h-12 text-gray-400 bg-transparent border-none" 
              onClick={() => navigate("/")}
              disabled={isSpinning}
            >
              THOÁT GAME
            </Button>
          </Box>

          {/* Decorative lights */}
          <Box className="absolute top-1/2 -left-3 -translate-y-1/2 flex flex-col gap-4">
            {[1, 2, 3].map(i => <Box key={i} className="w-3 h-3 rounded-full bg-[#f9d423] shadow-[0_0_10px_#f9d423]" />)}
          </Box>
          <Box className="absolute top-1/2 -right-3 -translate-y-1/2 flex flex-col gap-4">
            {[1, 2, 3].map(i => <Box key={i} className="w-3 h-3 rounded-full bg-[#f9d423] shadow-[0_0_10px_#f9d423]" />)}
          </Box>
        </Box>
      </Box>

      {/* Win Modal */}
      <Modal
        visible={showWinModal}
        title="JACKPOT! 🎉"
        onClose={() => setShowWinModal(false)}
      >
        <Box className="p-6 text-center">
          <Text className="text-[#3a9edb] text-2xl font-black italic mb-6">
            {winMessage}
          </Text>
          <Box className="text-6xl mb-6 animate-bounce">💰</Box>
          <Button 
            fullWidth 
            className="bg-[#f9d423] text-[#0e4b75] rounded-full font-black h-12 shadow-lg"
            onClick={() => setShowWinModal(false)}
          >
            NHẬN THƯỞNG
          </Button>
        </Box>
      </Modal>
    </Page>
  );
};

export default SlotMachinePage;
