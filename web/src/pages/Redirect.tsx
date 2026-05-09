// src/pages/Redirect.tsx
import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import LogoIcon from '../assets/Logo_Icon.svg';

export function Redirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    async function handleRedirection() {
      if (redirected.current || !code || code === '404') return;

      redirected.current = true;

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333';

        await api.get(`/links/validate/${code}`);

        window.location.href = `${backendUrl}/${code}`;

      } catch (error) {
        console.error('[Redirect Error]', error);
        navigate('/404', { replace: true });
      }
    }

    handleRedirection();
  }, [code, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-grayscale-100 p-4">
      <div className="bg-grayscale-white p-12 rounded-2xl shadow-sm border border-grayscale-200 flex flex-col items-center max-w-md w-full text-center">
        <img src={LogoIcon} alt="Logo" className="h-16 mb-8 animate-pulse" />
        
        <h1 className="text-xl font-bold text-grayscale-600 mb-4 tracking-tight">
          Redirecionando...
        </h1>
        
        <p className="text-sm text-grayscale-400 leading-relaxed">
          O link será aberto automaticamente em alguns instantes. <br />
          Não foi redirecionado?{' '}
          <a 
            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333'}/${code}`} 
            className="text-blue-base underline font-bold hover:text-blue-dark"
          >
            Acesse aqui
          </a>
        </p>
      </div>
    </main>
  );
}