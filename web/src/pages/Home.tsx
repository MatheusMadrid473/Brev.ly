import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Copy, Trash, Download, Link as LinkIcon, CheckCircle } from '@phosphor-icons/react';

import { api } from '../lib/axios';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import Logo from '../assets/Logo.svg';

const shortCodeSchema = z
  .string()
  .min(1, 'informe uma url minúscula e sem espaço/caracter especial')
  .regex(/^[a-z0-9]+$/, 'informe uma url minúscula e sem espaço/caracter especial');

const shortenerSchema = z.object({
  url: z.string().url('informe uma url valida'),
  shortCode: shortCodeSchema,
});

type ShortenerData = z.infer<typeof shortenerSchema>;

interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  accessCount: number;
}

export function Home() {
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const copiedCodeTimeoutRef = useRef<number | null>(null);

  const { register, handleSubmit, reset, clearErrors, setError, formState: { errors } } = useForm<ShortenerData>({
    resolver: zodResolver(shortenerSchema),
  });

  const { data: links, isLoading: isLoadingLinks } = useQuery<LinkData[]>({
    queryKey: ['links'],
    queryFn: async () => {
      const response = await api.get('/links');
      return response.data;
    },
  });

  const { mutateAsync: createLink, isPending: isCreating } = useMutation({
    mutationFn: async (data: ShortenerData) => {
      const payload = {
        url: data.url,
        code: data.shortCode,
      };

      const response = await api.post('/links', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      clearErrors('shortCode');
      reset();
    },
  });

  const { mutateAsync: deleteLink, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });

  async function handleExport() {
    try {
      const response = await api.get('/links/export');
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error(error);
      alert("Erro ao exportar. Verifique se o Cloudflare R2 está configurado.");
    }
  }

  async function handleShorten(data: ShortenerData) {
    try {
      await createLink(data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError('shortCode', {
          type: 'server',
          message: error.response.data?.message ?? 'Este link encurtado já existe.',
        });
        return;
      }

      alert("Erro ao encurtar URL. Verifique se o servidor está online.");
    }
  }

  function showCopyMessage(message: string) {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    setCopyMessage(message);
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyMessage(null);
    }, 2200);
  }

  async function copyToClipboard(code: string) {
    const fullUrl = `${window.location.origin}/${code}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedCode(code);
      showCopyMessage('Link copiado com sucesso');

      if (copiedCodeTimeoutRef.current) {
        window.clearTimeout(copiedCodeTimeoutRef.current);
      }

      copiedCodeTimeoutRef.current = window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      alert('Não foi possível copiar o link.');
    }
  }

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      if (copiedCodeTimeoutRef.current) {
        window.clearTimeout(copiedCodeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-grayscale-200 flex flex-col items-center p-4 sm:p-10">
      
      {/* Cabeçalho com a marca. */}
      <header className="w-full max-w-[1000px] flex justify-center mb-10 sm:justify-start">
        <img src={Logo} alt="brev.ly" className="h-8" />
      </header>

      <main className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
        
        {/* Formulário de criação de link. */}
        <section className="bg-grayscale-white p-8 rounded-2xl shadow-sm border border-grayscale-100">
          <h2 className="text-xl font-bold text-grayscale-600 mb-8">Novo link</h2>
          
          <form onSubmit={handleSubmit(handleShorten)} className="flex flex-col gap-6">
            <Input 
              label="Link Original" 
              placeholder="https://www.exemplo.com.br"
              {...register('url')}
              error={errors.url?.message}
              disabled={isCreating}
            />

            <div className="flex flex-col gap-1.5 w-full text-left">
              <label className="text-[10px] font-bold uppercase text-grayscale-500 tracking-wider">
                Link Encurtado
              </label>
              <div className={`flex items-stretch rounded-lg border bg-grayscale-white text-sm text-grayscale-600 transition-all overflow-hidden ${errors.shortCode ? 'border-feedback-danger focus-within:ring-1 focus-within:ring-feedback-danger' : 'border-grayscale-200 focus-within:border-blue-base focus-within:ring-1 focus-within:ring-blue-base'}`}>
                <span className="inline-flex items-center px-4 bg-grayscale-100 text-grayscale-400 font-bold whitespace-nowrap select-none">
                  brev.ly/
                </span>
                <input
                  type="text"
                  placeholder="meu-link"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isCreating}
                  {...register('shortCode')}
                  className="w-full px-4 py-3 bg-transparent outline-none placeholder:text-grayscale-300"
                />
              </div>
              {errors.shortCode && (
                <span className="flex items-center gap-1 text-feedback-danger text-xs font-semibold mt-1">
                  {errors.shortCode.message}
                </span>
              )}
            </div>

            <Button type="submit" isLoading={isCreating} className="w-full mt-2">
              {isCreating ? 'Salvando...' : 'Salvar link'}
            </Button>
          </form>
        </section>

        {/* Lista de links cadastrados. */}
        <section className="bg-grayscale-white p-8 rounded-2xl shadow-sm border border-grayscale-100 min-h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-grayscale-100">
            <h2 className="text-xl font-bold text-grayscale-600">Meus links</h2>
            <Button 
              variant="secondary" 
              onClick={handleExport}
              className="gap-2 !px-4 !py-2 text-sm"
            >
              <Download size={18} weight="bold" />
              Baixar CSV
            </Button>
          </div>

          {copyMessage && (
            <div className="mb-4 rounded-lg border border-blue-base/20 bg-blue-base/10 px-4 py-3 text-sm font-semibold text-blue-dark">
              {copyMessage}
            </div>
          )}

          {isLoadingLinks ? (
            <div className="flex-1 flex items-center justify-center text-grayscale-400 text-sm">
              Carregando links...
            </div>
          ) : links?.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-grayscale-400 mb-4 opacity-50">
                <LinkIcon size={48} weight="thin" />
              </div>
              <p className="text-[10px] font-bold text-grayscale-500 uppercase tracking-widest">
                Ainda não existem links cadastrados
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-2">
              {links?.map((link) => (
                <div key={link.id} className="flex items-center justify-between py-4 border-b border-grayscale-100 last:border-0 group">
                  <div className="flex flex-col gap-1 overflow-hidden pr-4">
                    <a 
                      href={`${window.location.origin}/${link.shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-md font-bold text-blue-base hover:text-blue-dark transition-colors cursor-pointer"
                    >
                      {window.location.origin}/{link.shortCode}
                    </a>
                    <span className="text-sm text-grayscale-400 truncate max-w-[200px] sm:max-w-[300px]">
                      {link.originalUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className="hidden sm:block text-sm text-grayscale-400 whitespace-nowrap">
                      {link.accessCount} acessos
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        onClick={() => copyToClipboard(link.shortCode)}
                        title="Copiar link"
                      >
                        {copiedCode === link.shortCode ? (
                          <CheckCircle size={20} weight="bold" className="text-blue-base" />
                        ) : (
                          <Copy size={20} weight="bold" />
                        )}
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="icon"
                        onClick={() => {
                          if(confirm("Deseja realmente excluir este link?")) {
                            deleteLink(link.id)
                          }
                        }}
                        disabled={isDeleting}
                        title="Excluir link"
                      >
                        <Trash size={20} weight="bold" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}