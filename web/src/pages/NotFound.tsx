// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import NotFoundImg from '../assets/404.svg';

export function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-grayscale-100 p-4">
      <div className="bg-grayscale-white p-12 rounded-2xl shadow-sm border border-grayscale-200 flex flex-col items-center max-w-[450px] w-full text-center">
        
        <img 
          src={NotFoundImg} 
          alt="Erro 404" 
          className="h-20 mb-8" 
        />
        
        <h1 className="text-xl font-bold text-grayscale-600 mb-4 tracking-tight">
          Link não encontrado
        </h1>
        
        <p className="text-sm text-grayscale-400 leading-relaxed mb-8">
          O link que você está tentando acessar não existe, foi removido ou é uma URL inválida.
        </p>
        
        <p className="text-xs font-bold text-grayscale-500 uppercase tracking-widest">
          Saiba mais em{' '}
          <Link 
            to="/" 
            className="text-blue-base lowercase hover:text-blue-dark transition-colors"
          >
            brev.ly
          </Link>.
        </p>
        
      </div>
    </main>
  );
}