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
  const [resultText, setResultText] = useState("");
  const canvasRef = useRef(null);
  const currentAngle = useRef(0); // Lưu trữ góc quay hiện tại để quay tiếp tục
  const frameId = useRef(null);
  const isTestMode = (import.meta?.env?.DEV ?? false) || localStorage.getItem("hito_skip_info") === "1";

  // Logic gửi dữ liệu về backend
  const handleClaimPrize = () => {
    const savedData = localStorage.getItem("hito_player_data");
    if (savedData && prize?.isPrize && !isTestMode) {
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
    if (!isTestMode) navigate("/", { replace: true });
  };

  // Danh sách phần thưởng và tỉ lệ (tổng tỉ lệ nên là 100)
  const rewards = [
    {
      id: 1,
      label: "Gối ôm cổ",
      color: "#3a9edb",
      weight: 10,
      isPrize: true,
      message: "Congrats! Bạn đã nhận GỐI ÔM CỔ – ready cho những chuyến bay ‘xịn sò’ phía trước"
    },
    {
      id: 2,
      label: "Lời chúc 1",
      color: "#ffffff",
      weight: 18,
      isPrize: false,
      message: "Chúc bạn sớm chạm tay đến giấc mơ du học và định cư mà bạn luôn ấp ủ 🌏"
    },
    {
      id: 3,
      label: "Lời chúc 2",
      color: "#f9d423",
      weight: 14,
      isPrize: false,
      message: "Một vòng quay nhỏ – một bước tiến lớn trên hành trình vươn ra thế giới ✈️"
    },
    {
      id: 4,
      label: "Lời chúc 3",
      color: "#ffffff",
      weight: 14,
      isPrize: false,
      message: "HTO chúc bạn luôn vững tin trên hành trình xây dựng tương lai tại nước ngoài 💼"
    },
    {
      id: 5,
      label: "Lời chúc 4",
      color: "#3a9edb",
      weight: 12,
      isPrize: false,
      message: "Cơ hội toàn cầu đang gọi tên bạn – sẵn sàng bứt phá chưa? 🚀"
    },
    {
      id: 6,
      label: "Lời chúc 5",
      color: "#ffffff",
      weight: 10,
      isPrize: false,
      message: "Hành trình vạn dặm bắt đầu từ một vòng quay – chúc bạn sớm đạt được mục tiêu lớn 🎯"
    },
    {
      id: 7,
      label: "Lời chúc 6",
      color: "#f9d423",
      weight: 22,
      isPrize: false,
      message: "Một ngày không xa, bạn sẽ tự hào về quyết định bắt đầu từ hôm nay 🏡"
    },
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
    const fontSize = Math.max(12, Math.floor(radius * 0.1));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rewards.forEach((reward, i) => {
      const angle = rotation + i * arcSize;
      const hue = (i * 360) / numRewards;
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
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
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

    // Vẽ tâm vòng quay
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
        const selectedReward = rewards[selectedIndex];
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
            {/* Kim chỉ phần thưởng - CHUYỂN LÊN TRÊN (12 GIỜ) */}
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
        </Box>
      </Box>

      <Modal
        visible={resultModal}
        title={prize?.isPrize ? "CHÚC MỪNG!" : "CHÚC BẠN MAY MẮN!"}
        onClose={() => setResultModal(false)}
        verticalActions
      >
        <Box className="p-6 text-center">
          <Text className="text-gray-500 font-bold uppercase text-xs mb-2">
            {prize?.isPrize ? "Bạn đã trúng" : "Bạn nhận được lời chúc"}
          </Text>
          <Text className={`text-3xl font-black italic mb-6 ${prize?.isPrize ? "text-[#3a9edb]" : "text-[#0e4b75]"}`}>
            {prize?.isPrize ? prize?.label : prize?.label}
          </Text>
          <Text className="text-gray-600 font-semibold text-sm mb-6">
            {resultText}
          </Text>
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
