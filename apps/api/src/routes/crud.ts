import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z, type ZodTypeAny } from "zod";

/** Interface mínima de um delegate Prisma (findMany/create/update/delete). */
interface Delegate {
  findMany(args?: any): Promise<any[]>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
}

const idParam = z.object({ id: z.string().min(1) });

/**
 * Registra o CRUD REST padrão de uma entidade:
 *   GET    /{prefixo}          → lista
 *   POST   /{prefixo}          → cria (201)
 *   PUT    /{prefixo}/:id      → substitui
 *   DELETE /{prefixo}/:id      → remove (204)
 * O corpo é validado pelo `schema` Zod compartilhado; a saída passa pelo `toApi`.
 */
export function registrarCrud<S extends ZodTypeAny>(
  app: FastifyInstance,
  opts: {
    prefixo: string;
    schema: S;
    delegate: Delegate;
    toApi: (row: any) => unknown;
    ordenarPor?: Record<string, "asc" | "desc">;
  },
): void {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const { prefixo, schema, delegate, toApi, ordenarPor } = opts;

  r.get(prefixo, async () => {
    const rows = await delegate.findMany(ordenarPor ? { orderBy: ordenarPor } : undefined);
    return rows.map(toApi);
  });

  r.post(prefixo, { schema: { body: schema } }, async (req, reply) => {
    const row = await delegate.create({ data: req.body });
    return reply.code(201).send(toApi(row));
  });

  r.put(
    `${prefixo}/:id`,
    { schema: { params: idParam, body: schema } },
    async (req) => {
      const row = await delegate.update({ where: { id: req.params.id }, data: req.body });
      return toApi(row);
    },
  );

  r.delete(`${prefixo}/:id`, { schema: { params: idParam } }, async (req, reply) => {
    await delegate.delete({ where: { id: req.params.id } });
    return reply.code(204).send();
  });
}
