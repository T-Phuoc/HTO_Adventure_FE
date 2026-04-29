import React, { useState, useRef, useEffect } from "react";
import { Box, Button, Page, Text, Modal } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bgMain from "../assets/bg_main.png";

const LuckySpinPage = () => {
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [prize, setPrize] = useState(null);
  const canvasRef = useRef(null);
  const currentAngle = useRef(0); // Lưu trữ góc quay hiện tại để quay tiếp tục
  const frameId = useRef(null);

  // Logic gửi dữ liệu về backend
  const handleClaimPrize = () => {
    const savedData = localStorage.getItem("hito_player_data");
    if (savedData && prize) {
      const userData = JSON.parse(savedData);
      const payload = {
        ...userData,
        score: 0,
        gift_name: prize.label,
        submitted_at: new Date().toLocaleString("vi-VN"),
      };

      const BACKEND_URL = "https://api.hto.edu.vn/api/hito/submit";
      axios
        .post(BACKEND_URL, payload)
        .then(() => {
          console.log("✅ [Hito] Đã gửi data trúng thưởng Lucky Spin thành công.");
          localStorage.removeItem("hito_player_data");
        })
        .catch((err) => {
          console.error("❌ [Hito] Lỗi gửi data trúng thưởng:", err.message);
        });
    }
    setResultModal(false);
    navigate("/", { replace: true });
  };

  // Danh sách phần thưởng và tỉ lệ (tổng tỉ lệ nên là 100)
  const rewards = [
    { id: 1, label: "Phần thưởng 1", color: "#3a9edb", weight: 30 }, // Tỉ lệ 30%
    { id: 2, label: "Phần thưởng 2", color: "#ffffff", weight: 20 }, 
    { id: 3, label: "Phần thưởng 3", color: "#f9d423", weight: 10 }, 
    { id: 4, label: "Phần thưởng 4", color: "#ffffff", weight: 15 }, 
    { id: 5, label: "Phần thưởng 5", color: "#3a9edb", weight: 15 }, 
    { id: 6, label: "Phần thưởng 6", color: "#ffffff", weight: 10 }, 
  ];

  const numRewards = rewards.length;
  const arcSize = (2 * Math.PI) / numRewards;

  useEffect(() => {
    drawWheel();
  }, []);

  const drawWheel = (rotation = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rewards.forEach((reward, i) => {
      const angle = rotation + i * arcSize;
      
      // Vẽ rẻ quạt
      ctx.beginPath();
      ctx.fillStyle = reward.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.strokeStyle = "#0e4b75";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vẽ chữ
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = reward.color === "#ffffff" ? "#0e4b75" : "white";
      ctx.font = "bold 14px Arial";
      ctx.fillText(reward.label, radius - 20, 5);
      ctx.restore();
    });

    // Vẽ tâm vòng quay
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#0e4b75";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    
    // 1. Chọn phần thưởng theo tỉ lệ
    const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let i = 0; i < rewards.length; i++) {
      if (random < rewards[i].weight) {
        selectedIndex = i;
        break;
      }
      random -= rewards[i].weight;
    }

    // 2. Tính toán góc quay
    // Mũi tên ở vị trí 12 giờ (Góc -PI/2 trong Canvas)
    // Để selectedIndex nằm ở -PI/2, ta cần: rotation + (selectedIndex + 0.5) * arcSize = 1.5 * PI
    
    const extraSpins = 5; // Số vòng quay tối thiểu
    const startRotation = currentAngle.current;
    
    const targetRotation = startRotation + 
                           (extraSpins * 2 * Math.PI) + 
                           (2 * Math.PI - (startRotation % (2 * Math.PI))) + 
                           (1.5 * Math.PI) - 
                           ((selectedIndex + 0.5) * arcSize);

    const duration = 5000; // Quay trong 5 giây
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      
      const nowRotation = startRotation + (targetRotation - startRotation) * easeOut(progress);
      currentAngle.current = nowRotation;
      drawWheel(nowRotation);

      if (progress < 1) {
        frameId.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setPrize(rewards[selectedIndex]);
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
            {/* Kim chỉ phần thưởng - CHUYỂN LÊN TRÊN (12 GIỜ) */}
            <Box className="absolute -top-4 left-1/2 -translate-x-1/2 z-20" style={{
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderTop: '30px solid #ff4757',
              filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))'
            }} />
            
            <Box className="rounded-full p-2 bg-[#0e4b75] shadow-xl border-4 border-white w-full max-w-[300px]">
              <canvas 
                ref={canvasRef} 
                width={300} 
                height={300}
                style={{ width: "100%", height: "auto", maxWidth: "280px" }}
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

          {/* Trang trí góc - Lối vào bí mật game 777 */}
          <Box 
            className="absolute -top-4 -left-4 w-16 h-16 bg-[#f9d423] rounded-full border-4 border-white flex items-center justify-center shadow-lg transform -rotate-12 cursor-pointer active:scale-90 transition-transform"
            onClick={() => navigate("/777spin")}
          >
            <Text className="text-[#0e4b75] font-black text-2xl">★</Text>
          </Box>
        </Box>
      </Box>

      <Modal
        visible={resultModal}
        title="CHÚC MỪNG!"
        onClose={() => setResultModal(false)}
        verticalActions
      >
        <Box className="p-6 text-center">
          <Text className="text-gray-500 font-bold uppercase text-xs mb-2">Bạn đã trúng</Text>
          <Text className="text-[#3a9edb] text-3xl font-black italic mb-6">
            {prize?.label}
          </Text>
          <Box className="w-24 h-24 bg-[#f0f9ff] rounded-full mx-auto flex items-center justify-center mb-6 border-4 border-[#3a9edb] animate-bounce">
            <Text className="text-4xl">🎁</Text>
          </Box>
          <Button 
            fullWidth 
            className="bg-[#3a9edb] rounded-full font-bold h-12 text-white shadow-lg"
            onClick={handleClaimPrize}
          >
            TUYỆT VỜI!
          </Button>
        </Box>
      </Modal>
    </Page>
  );
};

export default LuckySpinPage;
