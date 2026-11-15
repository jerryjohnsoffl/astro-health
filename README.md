# AstroHealth

## Anatomy annotations

Run the development server and append `anatomy-editor` to Vite's displayed local
URL to draw front/back region and structure polygons over the existing SVG
layers. The editor saves a draft
locally and exports a validated `anatomy-catalogue.json`. Review all anatomy
against a trusted reference before adding the exported polygons to the health
map. To make approved annotations available in the app, replace
`src/anatomy/catalogue.json` with the exported file and restart Vite. The
supplied artwork groups systems, but does not identify individual bones or
organs.

The point classifier and catalogue validation live in `src/anatomy/` and are
covered by `npm test`.


## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
