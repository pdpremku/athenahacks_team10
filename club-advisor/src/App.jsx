import { BrowserRouter, Routes, Route } from "react-router-dom";
import TitlePage from "./TitlePage";
import ClubAdvisor from "./ClubAdvisor";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitlePage />} />
        <Route path="/get-started" element={<ClubAdvisor />} />
      </Routes>
    </BrowserRouter>
  );
}