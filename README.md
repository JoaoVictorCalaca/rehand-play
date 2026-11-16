# rehand-play

Minijogos de reabilitação motora das mãos, controlados pela webcam (ou pelo mouse), rodando inteiramente no navegador. Nenhum vídeo é enviado a servidor.

> Ferramenta lúdica e de apoio. Não é um dispositivo médico e não substitui o acompanhamento de um profissional de saúde.

**Status:** Fase 2 (jogo jogável). Veja o [PLANO.md](PLANO.md).

## O jogo: Guardião do Piquenique

Insetos avançam em direção a um bolo. Com a mão aberta, dê **tapas rápidos** para eliminá-los (extensão dos dedos e amplitude), **poupe as joaninhas** e, quando surgir uma **moeda**, aproxime a mão aberta e **feche-a** para pegar (flexão dos dedos). Dá para jogar com a câmera ou com o mouse.

## Stack

Vite, React, TypeScript, MediaPipe Tasks Vision, Canvas 2D, Vitest, Playwright, GitHub Actions, Vercel.

## Como rodar

```bash
npm install
npm run dev
```

## Scripts

| Comando             | O que faz                             |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento           |
| `npm run build`     | Checagem de tipos e build de produção |
| `npm run lint`      | Lint (oxlint)                         |
| `npm run typecheck` | Checagem de tipos                     |
| `npm test`          | Testes unitários (Vitest)             |
| `npm run format`    | Formata com Prettier                  |
