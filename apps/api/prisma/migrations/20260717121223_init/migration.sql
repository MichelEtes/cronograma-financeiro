-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "saldoInicialConta" DECIMAL(65,30) NOT NULL,
    "dataInicial" TEXT NOT NULL,
    "diaVencimentoFatura" INTEGER NOT NULL,
    "reservaSeguranca" DECIMAL(65,30) NOT NULL,
    "saldoInicialCDB" DECIMAL(65,30) NOT NULL,
    "taxaCdbAnual" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrcamentoCategoria" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "orcamentoMensal" DECIMAL(65,30) NOT NULL,
    "configId" TEXT NOT NULL DEFAULT 'singleton',

    CONSTRAINT "OrcamentoCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceitaFixaMensal" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "diaRecebimento" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceitaFixaMensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaidaFixa" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaidaFixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraCartao" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL,
    "numParcelas" INTEGER NOT NULL,
    "dataPrimeiraParcela" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompraCartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntradaExtra" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntradaExtra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CenarioSimulado" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "incluir" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CenarioSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoDiario" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorGasto" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LancamentoDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AporteCDB" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AporteCDB_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrcamentoCategoria_categoria_key" ON "OrcamentoCategoria"("categoria");

-- CreateIndex
CREATE INDEX "EntradaExtra_data_idx" ON "EntradaExtra"("data");

-- CreateIndex
CREATE INDEX "CenarioSimulado_data_idx" ON "CenarioSimulado"("data");

-- CreateIndex
CREATE INDEX "LancamentoDiario_data_idx" ON "LancamentoDiario"("data");

-- CreateIndex
CREATE INDEX "AporteCDB_data_idx" ON "AporteCDB"("data");

-- AddForeignKey
ALTER TABLE "OrcamentoCategoria" ADD CONSTRAINT "OrcamentoCategoria_configId_fkey" FOREIGN KEY ("configId") REFERENCES "Config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
