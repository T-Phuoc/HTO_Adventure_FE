import React, { useState, useEffect } from "react";
import { Box, Button, Checkbox, Input, Page, Text, DatePicker } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import "../css/info-style.css";
import bgMain from "../assets/bg_main.png";
import mascot from "../assets/mascot-CdQs06Pp.png";

function UserInfoPage() {
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);
  
  const [user, setUser] = useState({
    name: "",
    phone: "",
    email: "", 
    birthday: "01/01/2000",
  });
  const [targetPage, setTargetPage] = useState("/game");

  useEffect(() => {
    // 1. Xác định trang đích (Game chính hoặc Vòng quay)
    const savedTarget = localStorage.getItem("hito_target_page");
    if (savedTarget) {
      setTargetPage(savedTarget);
    }

    // 2. Lấy dữ liệu đã được HomePage quét sẵn (nếu có)
    const savedData = localStorage.getItem("hito_zalo_data");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setUser(prev => ({
        ...prev,
        name: parsed.name || prev.name,
        phone: parsed.phone || prev.phone
      }));
      // Xóa dữ liệu tạm sau khi đã đổ vào Form
      localStorage.removeItem("hito_zalo_data");
    }
  }, []);

  const handleNextStep = () => {
    if (!user.name || user.name.trim() === "") { alert("Vui lòng nhập Họ và Tên!"); return; }
    if (!user.phone) { alert("Vui lòng nhập Số điện thoại!"); return; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email || !emailRegex.test(user.email)) { alert("Email không đúng định dạng!"); return; }
    if (!agree) { alert("Bạn cần đồng ý với điều khoản của HTO Group!"); return; }

    // Lưu lại toàn bộ thông tin chuẩn bị gửi đi ở ResultPage
    localStorage.setItem("hito_player_data", JSON.stringify({
      full_name: user.name,
      phone: user.phone,
      email: user.email,
      birthday: user.birthday,
      form_type: targetPage === "/lucky-spin" ? "Lucky_Spin" : "Hito_Adventure",
      created_at: new Date().toISOString()
    }));

    // Xóa target sau khi đã sử dụng
    localStorage.removeItem("hito_target_page");
    navigate(targetPage);
  };

  return (
    <Page className="user-info-page" style={{ backgroundImage: `url(${bgMain})` }}>
      <Box className="user-info-header">
        <Text className="logo-text-large">HITO</Text>
        <Text className="logo-text-large" >ADVENTURE</Text>
        <Box className="bg-[#0e4b75] px-3 py-0.5 rounded-full mt-2">
          <Text className="text-white font-bold text-[10px] uppercase tracking-widest">By HTO Group</Text>
        </Box>
      </Box>

      <Box className="user-info-card">
        <Box className="mascot-wrapper">
          <img src={mascot} className="mascot-img-ui" alt="Mascot" />
        </Box>

        <Box className="mt-7 w-full">
          <Box>
            <Text className="text-[#0e4b75] text-center font-black text-2xl uppercase italic">Thông Tin Cá Nhân</Text>
            {/* <Box className="h-1 w-16 bg-[#3a9edb] mx-auto rounded-full mt-1" /> */}
          </Box>

          <Box className="w-full">
            <Text className="text-[#0e4b75] font-black ml-4 mb-1 text-[11px] uppercase opacity-70">Họ và Tên</Text>
            <Input 
              placeholder="Nhập tên..." 
              className="hito-input-custom" 
              value={user.name}
              onChange={(e) => setUser({...user, name: e.target.value})}
            />
          </Box>

          <Box className="w-full">
            <Text className="text-[#0e4b75] font-black ml-4 mb-1 text-[11px] uppercase opacity-70">Số điện thoại</Text>
            <Input 
              placeholder="Nhập số điện thoại..." 
              className="hito-input-custom" 
              value={user.phone}
              onChange={(e) => setUser({...user, phone: e.target.value})}
            />
          </Box>

          <Box className="w-full">
            <Text className="text-[#0e4b75] font-black ml-4 mb-1 text-[11px] uppercase opacity-70">Email</Text>
            <Input 
              type="text"
              placeholder="Nhập email của bạn..." 
              className="hito-input-custom" 
              value={user.email}
              onChange={(e) => setUser({...user, email: e.target.value})}
            />
          </Box>

          <Box className="w-full">
            <Text className="text-[#0e4b75] font-black ml-4 mb-1 text-[11px] uppercase opacity-70">Ngày Sinh</Text>
            <DatePicker
              mask maskClosable title="Chọn ngày sinh"
              defaultValue={new Date(2000, 0, 1)}
              onChange={(value) => {
                const d = new Date(value);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                setUser({...user, birthday: `${day}/${month}/${year}`});
              }}
              format="dd/mm/yyyy"
            >
              {(props) => (
                <div onClick={props.onClick} className="datepicker-trigger-wrapper">
                   <Input {...props} readOnly value={user.birthday} className="hito-input-custom" />
                </div>
              )}
            </DatePicker>
          </Box>
          
          <Box className="agree-box-custom">
            <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <Text size="large" className="ml-4 text-[#0e4b75] font-bold leading-tight opacity-90">
              Tôi đồng ý nhận ưu đãi và tư vấn từ <span className="text-[#3a9edb]">HTO Group</span>.
            </Text>
          </Box>
        </Box>
      </Box>

      <Box className="nav-buttons-container">
        <Button className="btn-3d-secondary" onClick={() => navigate("/")}>Quay lại</Button>
        <Button className="btn-3d-primary" style={{ opacity: agree ? 1 : 0.6 }} onClick={handleNextStep}>Tiếp tục</Button>  
      </Box>
    </Page>
  );
}

export default UserInfoPage;