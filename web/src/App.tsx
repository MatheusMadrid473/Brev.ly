// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Redirect } from './pages/Redirect';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Rota fixa para a página de erro. */}
      <Route path="/404" element={<NotFound />} />

      {/* Rota dinâmica do código encurtado. */}
      <Route path="/:code" element={<Redirect />} />

      {/* Fallback para URLs fora do padrão esperado. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}