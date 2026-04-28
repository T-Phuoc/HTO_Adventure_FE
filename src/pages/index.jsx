import React, { useState } from "react";
import { Box, Button, Icon, Page, Text, Modal } from "zmp-ui";
import { useNavigate } from "react-router-dom";
// TRỈNH: Import đầy đủ các API cần thiết của Zalo
import { followOA, authorize, getUserInfo, getPhoneNumber, getAccessToken } from "zmp-sdk/apis"; 

import "../css/home-style.css";
import bgMain from "../assets/bg_main.png";
import mascot from "../assets/mascot-CdQs06Pp.png";
import iconMockhoa from "../assets/icon_mockhoa.png";
import iconSach from "../assets/icon_sach.png";
import iconKhoahoc from "../assets/icon_khoahoc.png";

function HomePage() {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  // Logic xử lý khi nhấn nút Chơi Ngay
const handlePlayNow = async () => {
    try {
      await followOA({ id: "2112176407138597287" });
      await authorize({ scopes: ["scope.userInfo", "scope.userPhonenumber"] });
      const { userInfo } = await getUserInfo({});
      
      const phoneRes = await getPhoneNumber({});
      const accessToken = await getAccessToken({});
      
      // LOG KIỂM TRA ĐẦU VÀO
      console.log("---------- [FE DEBUG] ----------");
      console.log("Token SĐT:", phoneRes.token);
      console.log("AccessToken:", accessToken ? "Đã lấy được" : "Chưa có");

      let phoneNumber = "";

      // CHỈ FETCH KHI CÓ TOKEN (Tránh lỗi undefined gửi lên BE)
      if (phoneRes.token && accessToken) {
        //http://localhost:9000/get-phone-new
        const response = await fetch("https://api.hto.edu.vn/get-phone-new", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, code: phoneRes.token }),
        });

        const result = await response.json();
        
        // LOG DỮ LIỆU TRẢ VỀ TỪ BACKEND
        console.log("Dữ liệu nhận được từ BE:", result);

        if (result.success && result.phone) {
          phoneNumber = result.phone.replace(/\D/g, '').replace(/^84/, '0');
        } 
        else if (result.data && result.data.number) {
          phoneNumber = result.data.number.replace(/\D/g, '').replace(/^84/, '0');
        }
      } else {
        console.warn("⚠️ Không lấy được Token từ Zalo. Kiểm tra thiết bị test hoặc quyền App!");
      }

      console.log("SĐT cuối cùng lưu vào LocalStorage:", phoneNumber);

      localStorage.setItem("hito_zalo_data", JSON.stringify({
        name: userInfo?.name || "Khách hàng",
        phone: phoneNumber || ""
      }));

      navigate("/user-info");
    } catch (e) {
      console.error("🔥 Lỗi luồng xử lý:", e);
      navigate("/user-info");
    }
  };
  return (
    <Page className="home-page-container" style={{ backgroundImage: `url(${bgMain})` }}>
      <Box className="home-header">
        <Text className="logo-main-text">HITO</Text>
        <Text className="logo-main-text">ADVENTURE</Text>
        <Box className="logo-sub-pill">
          <Text className="logo-sub-text-white">by HTO Group</Text>
        </Box>
      </Box>

      <Box className="home-main-card">
        <Box className="mascot-container">
          <img src={mascot} alt="Hito Mascot" className="mascot-image" />
        </Box>

        <Box className="mt-6 text-center w-full">
          <Text className="text-[#0e4b75] font-black text-4xl uppercase tracking-tight mb-2 italic">Điểm đổi quà</Text>
          <Box className="h-1 w-16 bg-[#3a9edb] mx-auto rounded-full mb-3 opacity-40" />

          <Box flex justifyContent="space-around" className="mb-6 items-end px-2">
            <RewardItem img={iconMockhoa} name="MÓC KHÓA" pts="55" />
            <RewardItem img={iconSach} name="SÁCH HỌC" pts="75" />
            <RewardItem img={iconKhoahoc} name="KHOÁ HỌC" pts="100" />
          </Box>
        </Box>

        <Box className="w-full">
          <Button className="btn-play-now" onClick={handlePlayNow}>CHƠI NGAY</Button>
          <Button className="btn-lucky-spin" onClick={() => navigate("/lucky-spin")}>VÒNG QUAY MAY MẮN</Button>
        </Box>
      </Box>

      <Box className="home-bottom-nav">
        <TabItem icon="zi-info-circle-solid" label="CÁCH CHƠI" onClick={() => setShowGuide(true)} />
      </Box>

      <Modal visible={showGuide} title="HƯỚNG DẪN CHƠI" onClose={() => setShowGuide(false)} verticalActions>
        <Box className="p-4">
          <Box className="space-y-4">
            <GuideStep step="1" content="Nhấn 'CHƠI NGAY' để bắt đầu." />
            <GuideStep step="2" content="Vượt chướng ngại vật để tích điểm." />
            <GuideStep step="3" content="Dùng điểm đổi quà từ HTO Group." />
          </Box>
          <Button fullWidth className="mt-6 bg-[#3a9edb] rounded-full font-bold text-white h-12" onClick={() => setShowGuide(false)}>ĐÃ HIỂU!</Button>
        </Box>
      </Modal>
    </Page>
  );
}

const GuideStep = ({ step, content }) => (
  <Box flex alignItems="flex-start" className="mb-3">
    <Box className="bg-[#3a9edb] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">{step}</Box>
    <Text className="ml-3 text-[#0e4b75] font-medium">{content}</Text>
  </Box>
);

const RewardItem = ({ img, name, pts }) => (
  <Box flex flexDirection="column" alignItems="center" className="w-[31%]">
    <img src={img} alt={name} className="h-16 w-16 object-contain mb-2 drop-shadow-md" />
    <Text size="xxxxSmall" className="text-[#0e4b75] font-black uppercase text-center leading-tight h-8 flex items-center justify-center tracking-tight">{name}</Text>
    <Text bold size="small" className="text-[#3a9edb] mt-1 font-extrabold">{pts} điểm</Text>
  </Box>
);

const TabItem = ({ icon, label, onClick }) => (
  <Box flex flexDirection="column" alignItems="center" className="cursor-pointer" onClick={onClick}>
    <Box className="tab-guide-icon-wrapper"><Icon icon={icon} size={34} className="text-white" /></Box>
    <Text className="font-black text-[12px] mt-1.5 uppercase text-[#3a9edb] tracking-widest scale-110">{label}</Text>
  </Box>
);

export default HomePage;