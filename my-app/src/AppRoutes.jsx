import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Hero from "./components/Hero";
import Home from './pages/Home';
import OpenAccount from './pages/OpenAccount';
import TrackStatus from './pages/TrackStatus';
import Dashboard from './pages/Dashboard';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/open-account" element={<OpenAccount />} />
      <Route path="/track-status" element={<TrackStatus />} />
    </Routes>
  );
}

export default AppRoutes; 