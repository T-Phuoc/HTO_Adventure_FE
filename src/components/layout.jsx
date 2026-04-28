import React from "react";
import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";

// 1. Import trang HomePage và UserInfoPage
import HomePage from "../pages/index";
import UserInfoPage from "../pages/user-info";
import GamePage from "../pages/game"; // Thêm dòng này
import ResultPage from "../pages/result"; // Thêm dòng này
import LuckySpinPage from "../pages/lucky-spin";
import Spin777Page from "../pages/777spin";

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme}>
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            {/* Trang chủ */}
            <Route path="/" element={<HomePage />} />
            
            {/* 2. Thêm Route cho trang User Info */}
            <Route path="/user-info" element={<UserInfoPage />} />

            {/* 3. Thêm Route cho trang Game */}
            <Route path="/game" element={<GamePage />} />

            {/* 4. Thêm Route cho trang Result */}
            <Route path="/result" element={<ResultPage />} />
            
            <Route path="/lucky-spin" element={<LuckySpinPage />} />
            <Route path="/777spin" element={<Spin777Page />} />
          </AnimationRoutes>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};

export default Layout;