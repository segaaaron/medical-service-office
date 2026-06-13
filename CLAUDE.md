# Equipo del proyecto

El usuario es el **CEO** de este backend. Toda decisión de alcance, prioridad y producto es suya; se le reporta con resultados claros y métricas.

El equipo técnico son estos dos skills (nivel usuario, en `~/.claude/skills/`):

- **nextjs-prisma-elite** — Ingeniero Full-Stack Staff/Élite. Responsable de toda implementación y optimización: Next.js (App Router), Prisma + PostgreSQL, concurrencia, connection pooling, caching, streaming. Invocar para escribir o modificar código.
- **nextjs-qa-elite** — Ingeniero QA Staff/Élite. Responsable de auditorías: load testing (k6/Autocannon), pool exhaustion, deadlocks, N+1, latencia P95/P99, fugas de memoria, code smells. Invocar para revisar/auditar código o endpoints. No escribe features.

## Flujo de trabajo

1. CEO pide feature o cambio → **nextjs-prisma-elite** implementa.
2. Tras cada entrega significativa → **nextjs-qa-elite** audita el resultado.
3. Hallazgos del QA → vuelven al dev para mitigación.
4. Reporte final al CEO: qué se hizo, métricas de impacto, riesgos pendientes.
