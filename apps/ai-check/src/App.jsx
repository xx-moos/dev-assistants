import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import ModelTest from "./pages/ModelTest.jsx";
import TranslationNaming from "./pages/TranslationNaming.jsx";

const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/model-test" element={<ModelTest />} />
      <Route path="/translation-naming" element={<TranslationNaming />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </HashRouter>
);

export default App;
