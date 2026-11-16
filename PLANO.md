# Plano: rehand-play

Jogo de reabilitação motora das mãos, controlado por webcam, rodando 100% no navegador (sem backend, nenhum vídeo sai do computador).

> Ferramenta lúdica e de apoio. Não é um dispositivo médico e não substitui acompanhamento profissional.

## Minijogos

| Exercício real            | Minijogo    | Gesto              | Fase         |
| ------------------------- | ----------- | ------------------ | ------------ |
| Precisão e coordenação    | Vaga-lumes  | Ponta do indicador | MVP          |
| Flexão/extensão dos dedos | Flor        | Mão aberta ↔ punho | MVP          |
| Oposição do polegar       | Pérolas     | Pinça              | 5            |
| Alcance e amplitude       | Constelação | Trajetória do dedo | 5            |
| Ritmo e sequência         | Tambor      | Dedo a dedo        | 5 (opcional) |

## Fases

- [ ] **0. Fundação (~1 dia):** Vite + React + TS, lint, Prettier, Vitest, estrutura de pastas, deploy na Vercel. _Pronto:_ URL pública abre.
- [ ] **1. Visão computacional (~2–3 dias):** MediaPipe, `useHandTracking`, `InputSource`, suavização (One Euro), gestos, tela de debug.
- [ ] **2. Primeiros minijogos (~3–4 dias):** motor (rAF + Canvas), Vaga-lumes e Flor, menu, calibração, HUD, fallback de mouse.
- [ ] **3. Evolução (~2 dias):** métricas por sessão, histórico em localStorage, dificuldade adaptativa, relatório PDF.
- [ ] **4. Qualidade e performance (~3 dias):** painel FPS/latência, Web Worker (medir antes/depois), Playwright, GitHub Actions.
- [ ] **5. Mais jogos e polimento (~3–4 dias):** Pérolas, Constelação, duas mãos, acessibilidade, PT/EN, PWA.
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
