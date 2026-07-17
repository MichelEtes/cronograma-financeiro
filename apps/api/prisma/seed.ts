import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hojeEmSaoPaulo } from "@cf/shared";

const prisma = new PrismaClient();

async function main() {
  // data-base = hoje (Seção 9). No E2E, SEED_DATA_INICIAL fixa a data para tornar as
  // projeções determinísticas.
  const hoje = process.env.SEED_DATA_INICIAL ?? hojeEmSaoPaulo();

  // Reset idempotente (apaga tudo antes de recriar).
  await prisma.orcamentoCategoria.deleteMany();
  await prisma.receitaFixaMensal.deleteMany();
  await prisma.saidaFixa.deleteMany();
  await prisma.compraCartao.deleteMany();
  await prisma.entradaExtra.deleteMany();
  await prisma.cenarioSimulado.deleteMany();
  await prisma.lancamentoDiario.deleteMany();
  await prisma.aporteCDB.deleteMany();
  await prisma.config.deleteMany();

  // Config (singleton) + orçamentos por categoria
  await prisma.config.create({
    data: {
      id: "singleton",
      saldoInicialConta: 3500,
      dataInicial: hoje,
      diaVencimentoFatura: 10,
      reservaSeguranca: 500,
      saldoInicialCDB: 5000,
      taxaCdbAnual: 12,
      orcamentos: {
        create: [
          { categoria: "Alimentação", orcamentoMensal: 900 },
          { categoria: "Lazer", orcamentoMensal: 300 },
          { categoria: "Transporte", orcamentoMensal: 400 },
          { categoria: "Saúde", orcamentoMensal: 200 },
          { categoria: "Outros", orcamentoMensal: 200 },
        ],
      },
    },
  });

  // Receitas fixas — salário em duas parcelas (dia 1 e dia 15)
  await prisma.receitaFixaMensal.createMany({
    data: [
      { descricao: "Salário (1ª parcela)", valor: 500, diaRecebimento: 1, ativa: true },
      { descricao: "Salário (2ª parcela)", valor: 500, diaRecebimento: 15, ativa: true },
    ],
  });

  // Saídas fixas
  await prisma.saidaFixa.createMany({
    data: [
      { descricao: "Aluguel", valor: 1200, diaVencimento: 5, categoria: "Moradia", ativa: true },
      { descricao: "Internet", valor: 100, diaVencimento: 8, categoria: "Utilidades", ativa: true },
      { descricao: "Streaming", valor: 60, diaVencimento: 15, categoria: "Assinaturas", ativa: true },
    ],
  });

  // Cartão — notebook R$3.000 em 10x, 1ª parcela hoje
  await prisma.compraCartao.create({
    data: {
      descricao: "Notebook novo",
      valorTotal: 3000,
      numParcelas: 10,
      dataPrimeiraParcela: hoje,
    },
  });

  // Entrada extra confirmada — freela já entregue
  await prisma.entradaExtra.create({
    data: { data: hoje, descricao: "Freela já entregue", valor: 800, confirmada: true },
  });

  // Aporte CDB de exemplo — R$300 hoje
  await prisma.aporteCDB.create({
    data: { data: hoje, tipo: "aporte", valor: 300, observacao: "Aporte inicial de exemplo" },
  });

  // Resumo do que foi inserido
  const [config, orcamentos, receitas, saidas, compras, entradas, aportes] = await Promise.all([
    prisma.config.findUnique({ where: { id: "singleton" } }),
    prisma.orcamentoCategoria.count(),
    prisma.receitaFixaMensal.count(),
    prisma.saidaFixa.count(),
    prisma.compraCartao.count(),
    prisma.entradaExtra.count(),
    prisma.aporteCDB.count(),
  ]);

  console.log(`\n✅ Seed concluído — data-base (hoje em São Paulo): ${hoje}\n`);
  console.table({
    "saldoInicialConta (R$)": Number(config?.saldoInicialConta),
    "reservaSeguranca (R$)": Number(config?.reservaSeguranca),
    "diaVencimentoFatura": config?.diaVencimentoFatura,
    "saldoInicialCDB (R$)": Number(config?.saldoInicialCDB),
    "taxaCdbAnual (%)": Number(config?.taxaCdbAnual),
    "Orçamentos (categorias)": orcamentos,
    "Receitas fixas": receitas,
    "Saídas fixas": saidas,
    "Compras no cartão": compras,
    "Entradas extras": entradas,
    "Aportes CDB": aportes,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
