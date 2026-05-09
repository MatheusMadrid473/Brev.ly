// src/server.ts
import fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db } from './db/index.js';
import { links } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const app = fastify();

app.register(cors, { 
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ?? "",
  },
});

// Rotas estáticas e utilitárias, registradas antes das rotas dinâmicas.

app.get('/favicon.ico', (req, reply) => reply.status(204).send());

// Lista de links cadastrados.
app.get('/links', async () => {
  return await db.select().from(links).orderBy(links.createdAt);
});

// Exportação da planilha em CSV e envio para o R2.
app.get('/links/export', async (request, reply) => {
  try {
    const allLinks = await db.select().from(links);
    const baseUrl = process.env.VITE_BACKEND_URL || "http://localhost:3333";

    const BOM = '\uFEFF';

    const header = "ID;url;short url;acess count;created at\n";

    const rows = allLinks.map(l => {
      const shortUrl = `${baseUrl}/${l.shortCode}`;
      const createdAt = l.createdAt.toISOString();

      return `${l.id};${l.originalUrl};${shortUrl};${l.accessCount};${createdAt}`;
    }).join("\n");

    const csv = BOM + header + rows;
    const fileName = `exports/links-${nanoid(5)}.csv`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET!, 
      Key: fileName,
      Body: csv,
      ContentType: "text/csv; charset=utf-8",
    }));

    const url = `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;
    return { url };
  } catch (error) {
    console.error("[Export Error]:", error);
    return reply.status(500).send({ message: "Falha na exportação" });
  }
});

// Validação do código usado no redirecionamento.
app.get('/links/validate/:code', async (request, reply) => {
  const { code } = z.object({ code: z.string() }).parse(request.params);
  
  const [link] = await db.select().from(links).where(eq(links.shortCode, code)).limit(1);

  if (!link) {
    return reply.status(404).send({ error: "Link não encontrado" });
  }

  return { ok: true };
});

// Rotas de criação, remoção e redirecionamento.

// Criação de link encurtado.
app.post('/links', async (request, reply) => {
  console.log("[CreateLink]", request.body);

  const createLinkSchema = z.object({
    url: z.string().url('informe uma url valida'),
    code: z
      .string()
      .min(1, 'informe uma url minúscula e sem espaço/caracter especial')
      .regex(/^[a-z0-9]+$/, 'informe uma url minúscula e sem espaço/caracter especial'),
  });
  
  const { url, code } = createLinkSchema.parse(request.body);

  if (code) {
    const [codeInUse] = await db.select().from(links).where(eq(links.shortCode, code)).limit(1);
    
    if (codeInUse) {
      return reply.status(409).send({ message: "Este código personalizado já está em uso." });
    }
  } else {
    const [existingLink] = await db.select().from(links).where(eq(links.originalUrl, url)).limit(1);

    if (existingLink) {
      return reply.status(200).send(existingLink);
    }
  }

  const shortCode = code ? code : nanoid(7);
  
  const [newLink] = await db.insert(links).values({ originalUrl: url, shortCode }).returning();
  return reply.status(201).send(newLink);
});

// Remoção de link.
app.delete('/links/:id', async (request, reply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  await db.delete(links).where(eq(links.id, id));
  return reply.status(204).send();
});

// Rotas dinâmicas gerais, registradas por último.

// Redirecionamento e contagem de acesso.
app.get('/:code', async (request, reply) => {
  const { code } = z.object({ code: z.string() }).parse(request.params);

  const result = await db.update(links)
    .set({ accessCount: sql`${links.accessCount} + 1` })
    .where(eq(links.shortCode, code))
    .returning();

  const updatedLink = result[0];

  if (!updatedLink) {
    return reply.status(404).send({ error: "Link não encontrado" });
  }

  return reply
    .status(302)
    .header('Location', updatedLink.originalUrl)
    .header('Cache-Control', 'no-store')
    .send();
});

// Inicialização do servidor HTTP.
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`[Server] HTTP Server running on port ${port}!`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();