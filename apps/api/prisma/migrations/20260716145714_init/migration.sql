-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "saldoInicialConta" DECIMAL NOT NULL,
    "dataInicial" TEXT NOT NULL,
    "diaVencimentoFatura" INTEGER NOT NULL,
    "reservaSeguranca" DECIMAL NOT NULL,
    "saldoInicialCDB" DECIMAL NOT NULL,
    "taxaCdbAnual" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrcamentoCategoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoria" TEXT NOT NULL,
    "orcamentoMensal" DECIMAL NOT NULL,
    "configId" TEXT NOT NULL DEFAULT 'singleton',
    CONSTRAINT "OrcamentoCategoria_configId_fkey" FOREIGN KEY ("configId") REFERENCES "Config" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReceitaFixaMensal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "diaRecebimento" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SaidaFixa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompraCartao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "valorTotal" DECIMAL NOT NULL,
    "numParcelas" INTEGER NOT NULL,
    "dataPrimeiraParcela" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EntradaExtra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CenarioSimulado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "incluir" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LancamentoDiario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorGasto" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AporteCDB" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
