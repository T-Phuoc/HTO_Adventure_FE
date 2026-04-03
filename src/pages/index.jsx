import React, { useState } from "react";
import { Box, Button, Icon, Page, Text, Modal } from "zmp-ui";
import { useNavigate } from "react-router-dom";

import "../css/home-style.css";
import bgMain from "../assets/bg_main.png";
import mascot from "../assets/mascot-CdQs06Pp.png";
import iconMockhoa from "../assets/icon_mockhoa.png";
import iconSach from "../assets/icon_sach.png";
import iconKhoahoc from "../assets/icon_khoahoc.png";

function HomePage() {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <Page
      className="home-page-container"
      style={{ backgroundImage: `url(${bgMain})` }}
    >
      {/* 1. Header Logo - Hiệu ứng 3D & Pill */}
      <Box className="home-header">
        <Text className="logo-main-text">HITO</Text>
        <Text className="logo-main-text" style={{ lineHeight: "0.8" }}>ADVENTURE</Text>
        <Box className="logo-sub-pill">
          <Text className="logo-sub-text-white">by HTO Group</Text>
        </Box>
      </Box>

      {/* 2. Main Content Box */}
      <Box className="home-main-card">
        <Box className="mascot-container">
          <img src={mascot} alt="Hito Mascot" className="mascot-image" />
        </Box>

        <Box className="mt-6 text-center w-full">
          <Text className="text-[#0e4b75] font-black text-4xl uppercase tracking-tight mb-2 italic">
            Điểm đổi quà
          </Text>
          <Box className="h-1 w-16 bg-[#3a9edb] mx-auto rounded-full mb-3 opacity-40" />

          <Box flex justifyContent="space-around" className="mb-6 items-end px-2">
            <RewardItem img={iconMockhoa} name="MÓC KHÓA" pts="500" />
            <RewardItem img={iconSach} name="SÁCH HỌC" pts="1500" />
            <RewardItem img={iconKhoahoc} name="KHOÁ HỌC" pts="2500" />
          </Box>
        </Box>

        {/* Nút Chơi Ngay - Gradient 3D */}
        <Box className="w-full">
          <Button className="btn-play-now" onClick={() => navigate("/user-info")}>
            CHƠI NGAY
          </Button>
        </Box>
      </Box>

      {/* 3. Bottom Nav */}
      <Box className="home-bottom-nav">
        <TabItem
          icon="zi-info-circle-solid"
          label="CÁCH CHƠI"
          onClick={() => setShowGuide(true)}
        />
      </Box>

      {/* 4. Popup Hướng dẫn */}
      <Modal
        visible={showGuide}
        title="HƯỚNG DẪN CHƠI"
        onClose={() => setShowGuide(false)}
        verticalActions
      >
        <Box className="p-4">
          <Box className="space-y-4">
            <GuideStep step="1" content="Nhấn 'CHƠI NGAY' để bắt đầu." />
            <GuideStep step="2" content="Vượt chướng ngại vật để tích điểm." />
            <GuideStep step="3" content="Dùng điểm đổi quà từ HTO Group." />
          </Box>
          <Button 
            fullWidth 
            className="mt-6 bg-[#3a9edb] rounded-full font-bold text-white h-12"
            onClick={() => setShowGuide(false)}
          >
            ĐÃ HIỂU!
          </Button>
        </Box>
      </Modal>
    </Page>
  );
}

// Sub-components
const GuideStep = ({ step, content }) => (
  <Box flex alignItems="flex-start" className="mb-3">
    <Box className="bg-[#3a9edb] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
      {step}
    </Box>
    <Text className="ml-3 text-[#0e4b75] font-medium">{content}</Text>
  </Box>
);

const RewardItem = ({ img, name, pts }) => (
  <Box flex flexDirection="column" alignItems="center" className="w-[31%]">
    <img src={img} alt={name} className="h-16 w-16 object-contain mb-2 drop-shadow-md" />
    <Text size="xxxxSmall" className="text-[#0e4b75] font-black uppercase text-center leading-tight h-8 flex items-center justify-center tracking-tight">
      {name}
    </Text>
    <Text bold size="small" className="text-[#3a9edb] mt-1 font-extrabold">{pts} điểm</Text>
  </Box>
);

const TabItem = ({ icon, label, onClick }) => (
  <Box flex flexDirection="column" alignItems="center" className="cursor-pointer" onClick={onClick}>
    <Box className="tab-guide-icon-wrapper">
      <Icon icon={icon} size={34} className="text-white" />
    </Box>
    <Text className="font-black text-[12px] mt-1.5 uppercase text-[#3a9edb] tracking-widest scale-110">
      {label}
    </Text>
  </Box>
);

export default HomePage;