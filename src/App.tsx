/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Vault } from "./pages/Vault";
import { AdminRewards } from "./pages/AdminRewards";
import { Reveal } from "./pages/Reveal";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/vault" element={<Vault />} />
        </Route>
        <Route path="/admin-rewards" element={<AdminRewards />} />
        <Route path="/reveal" element={<Reveal />} />
      </Routes>
    </BrowserRouter>
  );
}
