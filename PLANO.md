# Plano: rehand-play

Jogo de reabilitação motora das mãos, controlado por webcam, rodando 100% no navegador (sem backend, nenhum vídeo sai do computador).

> Ferramenta lúdica e de apoio. Não é um dispositivo médico e não substitui acompanhamento profissional.

## O jogo: Guardião do Piquenique

Um jogo só, com profundidade. Insetos avançam em direção a um bolo de piquenique; o jogador os elimina com as mãos.

| Ação no jogo              | Gesto                                | Exercício real                    |
| ------------------------- | ------------------------------------ | --------------------------------- |
| Tapa nos insetos          | Mão aberta passando rápido por cima  | Extensão dos dedos e amplitude    |
| Poupar a joaninha (amiga) | Controlar o movimento                | Precisão e controle               |
| Pegar moeda               | Mão aberta sobre ela e depois fechar | Flexão dos dedos (gesto de pegar) |

Regras: ondas infinitas, mosquito (1 tapa), besouro (2 tapas), chefão a cada 5 ondas, joaninha amiga (custa uma vida), combo com multiplicador até ×3, 5 moedas recuperam 1 vida. Fim de jogo quando as vidas acabam.

Ideias para a Fase 5: Ritmo de dedos (uma pista por dedo) como segundo modo.

## Fases

- [x] **0. Fundação (~1 dia):** Vite + React + TS, lint, Prettier, Vitest, estrutura de pastas, deploy na Vercel. _Pronto:_ URL pública abre.
- [x] **1. Visão computacional (~2–3 dias):** MediaPipe, `useInputSource`, `InputSource`, suavização (One Euro), gestos, tela de debug. Testado no celular.
- [x] **2. O jogo (~3–4 dias):** motor (rAF + Canvas), Guardião do Piquenique (tapas, moedas, ondas, combo, chefão), menu, calibração, HUD, resultado, fallback de mouse. Falta validar com a câmera real.
- [ ] **3. Evolução (~2 dias):** métricas por sessão, histórico em localStorage, dificuldade adaptativa, relatório PDF.
- [ ] **4. Qualidade e performance (~3 dias):** painel FPS/latência, Web Worker (medir antes/depois), Playwright, GitHub Actions.
- [ ] **5. Polimento (~3–4 dias):** mão dominante e duas mãos, sons, acessibilidade, PT/EN, PWA, modo extra (Ritmo de dedos).
- [ ] **6. Apresentação (~2 dias):** README com GIF e benchmark, case study, vídeo, post de lançamento.

## Arquitetura

```
src/
  vision/    MediaPipe, suavização, gestos, InputSource
  engine/    loop, colisões, pontuação, adaptação
  games/     um módulo por minijogo
  ui/        React: menu, calibração, HUD, resultados
  metrics/   sessões, histórico, PDF, métricas técnicas
  workers/   inferência em Web Worker
tests/       unit (Vitest) e e2e (Playwright)
```

Regra central: o motor do jogo não depende do React nem da câmera, só da interface `InputSource`.

## Decisões

- Gerenciador de pacotes: npm.
- Visual calmo e acolhedor; gráficos do histórico decididos na Fase 3.
- Sonnet 5.5 no dia a dia; Opus 5.5 para gestos/suavização, adaptação, Web Worker e bugs teimosos.
