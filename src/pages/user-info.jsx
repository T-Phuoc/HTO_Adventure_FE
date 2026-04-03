import React, { useState } from "react";
import { Box, Button, Checkbox, Input, Page, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import "../css/info-style.css";
import bgMain from "../assets/bg_main.png";
import mascot from "../assets/mascot-CdQs06Pp.png";

function UserInfoPage() {
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);

  return (
    <Page className="user-info-page" style={{ backgroundImage: `url(${bgMain})` }}>
      {/* 1. Logo Header */}
      <Box className="user-info-header">
        <Text className="logo-text-large">HITO</Text>
        <Text className="logo-text-large" style={{ lineHeight: "0.8" }}>ADVENTURE</Text>
        <Box className="bg-[#0e4b75] px-3 py-0.5 rounded-full mt-2">
          <Text className="text-white font-bold text-[10px] uppercase tracking-widest">
            By HTO Group
          </Text>
        </Box>
      </Box>

      {/* 2. Form Card */}
      <Box className="user-info-card">
        <Box className="mascot-wrapper">
          <img src={mascot} className="mascot-img-ui" alt="Mascot" />
        </Box>

        <Box className="mt-10 w-full space-y-4">
          <Box>
            <Text className="text-[#0e4b75] text-center font-black text-2xl uppercase italic">
              Thông Tin Cá Nhân
            </Text>
            <Box className="h-1 w-16 bg-[#3a9edb] mx-auto rounded-full mt-1" />
          </Box>

          <HitoInput label="Họ và Tên" placeholder="Nhập họ tên của bạn..." />
          <HitoInput label="Số điện thoại" placeholder="Nhập số điện thoại..." />
          <HitoInput label="Ngày Sinh" placeholder="Ngày/Tháng/Năm" />
          
          <Box className="agree-box-custom">
            <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <Text size="xxxxSmall" className="ml-2 text-[#0e4b75] font-bold leading-tight opacity-90">
              Tôi đồng ý nhận ưu đãi và tư vấn từ <span className="text-[#3a9edb]">HTO Group</span>.
            </Text>
          </Box>
        </Box>
      </Box>

      {/* 3. Bottom Buttons */}
      <Box className="nav-buttons-container">
        <Button className="btn-3d-secondary" onClick={() => navigate("/")}>
          Quay lại
        </Button>
        <Button
          className="btn-3d-primary"
          onClick={() => {
            if (!agree) alert("Vui lòng tích chọn đồng ý điều khoản!");
            else navigate("/game");
          }}
        >
          Tiếp tục
        </Button>
      </Box>
    </Page>
  );
}

const HitoInput = ({ label, placeholder }) => (
  <Box className="w-full">
    <Text className="text-[#0e4b75] font-black ml-4 mb-1 text-[11px] uppercase opacity-70">
      {label}
    </Text>
    <Input placeholder={placeholder} className="hito-input-custom" />
  </Box>
);

export default UserInfoPage;