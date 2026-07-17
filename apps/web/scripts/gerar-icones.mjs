// Gera os ícones do PWA (PNG) sem depender de bibliotecas de imagem — só o zlib nativo
// do Node (Node 20+ tem zlib.crc32). Ícone: fundo verde-esmeralda + gráfico de barras
// branco, com margem de segurança para o modo "maskable" do Android.
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
const COR_FUNDO = [5, 150, 105]; // emerald-600
const COR_BARRA = [255, 255, 255];

function criarBuffer(tamanho) {
  const px = new Uint8Array(tamanho * tamanho * 4);
  for (let i = 0; i < tamanho * tamanho; i++) {
    px[i * 4] = COR_FUNDO[0];
    px[i * 4 + 1] = COR_FUNDO[1];
    px[i * 4 + 2] = COR_FUNDO[2];
    px[i * 4 + 3] = 255;
  }
  return px;
}

function preencherRetangulo(px, tamanho, x0, y0, x1, y1, cor) {
  for (let y = Math.max(0, y0); y < Math.min(tamanho, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(tamanho, x1); x++) {
      const i = (y * tamanho + x) * 4;
      px[i] = cor[0];
      px[i + 1] = cor[1];
      px[i + 2] = cor[2];
      px[i + 3] = 255;
    }
  }
}

/** Desenha 4 barras ascendentes (glifo de "gráfico"), com 20% de margem (zona segura maskable). */
function desenharBarras(px, tamanho) {
  const margem = tamanho * 0.24;
  const areaUtil = tamanho - margem * 2;
  const nBarras = 4;
  const gap = areaUtil * 0.08;
  const larguraBarra = (areaUtil - gap * (nBarras - 1)) / nBarras;
  const alturasRel = [0.35, 0.55, 0.75, 1.0];
  const baseY = tamanho - margem;

  for (let i = 0; i < nBarras; i++) {
    const x0 = Math.round(margem + i * (larguraBarra + gap));
    const x1 = Math.round(x0 + larguraBarra);
    const altura = areaUtil * alturasRel[i];
    const y0 = Math.round(baseY - altura);
    preencherRetangulo(px, tamanho, x0, y0, x1, Math.round(baseY), COR_BARRA);
  }
}

function chunk(tipo, dados) {
  const tipoBuf = Buffer.from(tipo, "ascii");
  const tamanhoBuf = Buffer.alloc(4);
  tamanhoBuf.writeUInt32BE(dados.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([tipoBuf, dados])) >>> 0, 0);
  return Buffer.concat([tamanhoBuf, tipoBuf, dados, crcBuf]);
}

function codificarPng(px, tamanho) {
  const assinatura = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Cada linha (scanline) precisa do byte de filtro (0 = None) antes dos pixels.
  const bruto = Buffer.alloc((tamanho * 4 + 1) * tamanho);
  for (let y = 0; y < tamanho; y++) {
    const offsetLinha = y * (tamanho * 4 + 1);
    bruto[offsetLinha] = 0;
    Buffer.from(px.buffer, y * tamanho * 4, tamanho * 4).copy(bruto, offsetLinha + 1);
  }
  const idat = deflateSync(bruto);

  return Buffer.concat([assinatura, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const tamanho of [512, 192, 180, 32]) {
  const px = criarBuffer(tamanho);
  desenharBarras(px, tamanho);
  const png = codificarPng(px, tamanho);
  const nome = tamanho === 180 ? "apple-touch-icon.png" : tamanho === 32 ? "favicon-32.png" : `icon-${tamanho}.png`;
  writeFileSync(path.join(OUT_DIR, nome), png);
  console.log(`gerado: ${nome} (${png.length} bytes)`);
}
