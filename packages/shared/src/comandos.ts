// Parser de comandos de texto (bot do WhatsApp) — função pura, sem I/O, mesmo espírito
// do motor de cálculo: fácil de testar, o webhook só chama e decide o que persistir.

export interface ComandoAporte {
  tipo: "aporte" | "resgate";
  valor: number;
  observacao?: string;
}

export interface ComandoGasto {
  tipo: "gasto";
  valor: number;
  categoria: string;
  descricao: string;
}

export type ComandoReconhecido = ComandoAporte | ComandoGasto;

export interface ResultadoParseComando {
  sucesso: boolean;
  comando?: ComandoReconhecido;
  /** Mensagem pronta para responder ao usuário quando `sucesso === false`. */
  erro?: string;
}

const PALAVRAS_APORTE = new Set(["aporte", "aportei", "aportar"]);
const PALAVRAS_RESGATE = new Set(["resgate", "resgatei", "resgatar"]);
const PALAVRAS_GASTO = new Set(["gasto", "gastei", "despesa"]);

const AJUDA =
  'Comando não reconhecido. Comandos disponíveis:\n' +
  '• "aporte 300" — aporte no CDB\n' +
  '• "resgate 200" — resgate do CDB\n' +
  '• "gasto 50 mercado" — despesa do dia (categoria, com descrição opcional depois)';

/**
 * Converte um token de valor digitado casualmente em number.
 * Aceita "300", "300,50", "300.50", "1.234,56" (formato BR completo) e prefixo "R$".
 * Retorna null se não for um número válido e positivo.
 */
function normalizarValor(bruto: string): number | null {
  const semPrefixo = bruto.replace(/^r\$\s*/i, "").trim();
  if (!/^\d+([.,]\d+)*$/.test(semPrefixo)) return null;

  let normalizado: string;
  if (semPrefixo.includes(".") && semPrefixo.includes(",")) {
    normalizado = semPrefixo.replace(/\./g, "").replace(",", "."); // 1.234,56 -> 1234.56
  } else if (semPrefixo.includes(",")) {
    normalizado = semPrefixo.replace(",", "."); // 300,50 -> 300.50
  } else {
    normalizado = semPrefixo; // "300" ou "300.50"
  }

  const valor = Number(normalizado);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

// `s` sempre vem de um token não vazio de `texto.split(" ")` (já sem espaços duplicados).
function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Interpreta uma mensagem de texto recebida do WhatsApp como um comando do app. */
export function parseComando(textoBruto: string): ResultadoParseComando {
  // Junta "R$ 300" -> "R$300" antes de tokenizar, para tolerar o espaço opcional
  // que as pessoas costumam digitar depois do "R$".
  const texto = textoBruto.trim().replace(/\s+/g, " ").replace(/r\$\s+/gi, "R$");
  if (!texto) return { sucesso: false, erro: AJUDA };

  const [primeira, ...resto] = texto.split(" ");
  const palavraChave = primeira.toLowerCase();

  if (PALAVRAS_APORTE.has(palavraChave) || PALAVRAS_RESGATE.has(palavraChave)) {
    const tipo: "aporte" | "resgate" = PALAVRAS_APORTE.has(palavraChave) ? "aporte" : "resgate";
    if (resto.length === 0) {
      return { sucesso: false, erro: `Faltou o valor. Ex.: "${tipo} 300".` };
    }
    const valor = normalizarValor(resto[0]);
    if (valor === null) {
      return {
        sucesso: false,
        erro: `Não entendi o valor "${resto[0]}". Ex.: "${tipo} 300" ou "${tipo} 300,50".`,
      };
    }
    const observacao = resto.slice(1).join(" ") || undefined;
    return { sucesso: true, comando: { tipo, valor, observacao } };
  }

  if (PALAVRAS_GASTO.has(palavraChave)) {
    if (resto.length === 0) {
      return { sucesso: false, erro: 'Faltou o valor e a categoria. Ex.: "gasto 50 mercado".' };
    }
    const valor = normalizarValor(resto[0]);
    if (valor === null) {
      return { sucesso: false, erro: `Não entendi o valor "${resto[0]}". Ex.: "gasto 50 mercado".` };
    }
    if (resto.length < 2) {
      return { sucesso: false, erro: 'Faltou a categoria. Ex.: "gasto 50 mercado".' };
    }
    const categoria = titleCase(resto[1]);
    const descricao = resto.slice(2).join(" ") || "Lançamento via WhatsApp";
    return { sucesso: true, comando: { tipo: "gasto", valor, categoria, descricao } };
  }

  return { sucesso: false, erro: AJUDA };
}
