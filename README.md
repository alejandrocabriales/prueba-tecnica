# Usuarios y publicaciones

SPA en React + TypeScript que consume [JSONPlaceholder](https://jsonplaceholder.typicode.com): lista de usuarios con búsqueda, publicaciones por usuario y creación de nuevas publicaciones con formulario validado.

> 🚧 En desarrollo. Este README se actualiza en cada commit junto con la funcionalidad que documenta.

---

## Índice

- [Cómo ejecutarlo](#cómo-ejecutarlo)
- [Stack](#stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Decisiones técnicas](#decisiones-técnicas)
- [Casos borde de la API](#casos-borde-de-la-api)
- [Testing](#testing)
- [Qué haría con más tiempo](#qué-haría-con-más-tiempo)
- [Uso de IA](#uso-de-ia)

---

## Cómo ejecutarlo

**Requisitos:** Node.js `^20.19.0` o `>=22.12.0` (requisito de Vite 8).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script              | Qué hace                                              |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con HMR                        |
| `npm run build`     | Typecheck (`tsc -b`) + build de producción en `dist/` |
| `npm run preview`   | Sirve el build de producción                          |
| `npm run lint`      | ESLint con reglas type-aware y `--max-warnings 0`     |
| `npm run typecheck` | Solo comprobación de tipos                            |
| `npm test`          | Tests una vez (Vitest)                                |
| `npm run test:watch`| Tests en modo watch                                   |

---

## Stack

| Área     | Elección                                                   |
| -------- | ---------------------------------------------------------- |
| Build    | Vite 8                                                     |
| UI       | React 19                                                   |
| Lenguaje | TypeScript 6.0 (`strict`, `noUncheckedIndexedAccess`)      |
| Lint     | ESLint 10 + `typescript-eslint` (`strictTypeChecked`)      |
| Tests    | Vitest + Testing Library + `user-event` + `jest-dom`       |
| Datos    | `fetch` nativo + `AbortController`, sin librerías externas |
| Estilos  | CSS Modules + variables CSS                                |

Dependencias de runtime: solo `react` y `react-dom`.

---

## Estructura del proyecto

```
src/
├─ api/          # Acceso a red. No conoce React.
│  ├─ client.ts  #   fetchJson, HttpError, isAbortError
│  ├─ parse.ts   #   Validación runtime de payloads (unknown → tipo)
│  ├─ users.ts
│  └─ posts.ts
├─ types/        # Tipos de dominio y AsyncState<T>
├─ hooks/        # Estado y efectos. No conoce JSX.
├─ components/   # Presentación. No conoce URLs.
├─ utils/        # Funciones puras (validación, filtrado)
└─ test/         # Setup, fixtures y tests de comportamiento
```

Cada capa depende solo de las de abajo: `components → hooks → api → types`.

---

## Decisiones técnicas

### Vite en lugar de Next.js
La aplicación es una SPA sin necesidades de SEO ni SSR y la API es pública. Next.js añadiría servidor, Server Components y routing que aquí no aportan. Vite ofrece arranque instantáneo y Vitest reutiliza su configuración.

### ESLint en lugar de oxlint
La plantilla actual de `create-vite` incluye oxlint. Lo sustituí por ESLint + `typescript-eslint` con `strictTypeChecked` para tener reglas basadas en tipos (promesas sin manejar, `any` inseguro, aserciones innecesarias).

### TypeScript 6.0 en lugar de 7
`typescript-eslint` declara `typescript <6.1.0` como peer dependency. Fijé TS 6.0 para mantener el lint type-aware; actualizar será un cambio de una línea cuando haya soporte.

### `fetch` nativo en lugar de Axios o TanStack Query
- **Axios** no aporta ventajas frente a `fetch` + `AbortController`. La única diferencia relevante, que `fetch` no rechaza en 4xx/5xx, se resuelve en `fetchJson` comprobando `response.ok`.
- **TanStack Query** sería mi elección en producción (caché, deduplicación, reintentos, cancelación). Con este alcance preferí implementar lo mínimo de forma explícita. Ver [Qué haría con más tiempo](#qué-haría-con-más-tiempo).

### Validación en la frontera de red
`fetchJson` devuelve `unknown`, no `T`. Cada recurso tiene un parser (`parseUser`, `parsePost`) que estrecha el tipo o lanza `ParseError`. Así no hay `as` ni `any`, y un cambio de contrato falla en la capa API con un mensaje claro en lugar de romper un render. Con más endpoints usaría Zod para no duplicar tipo y validación.

### Estado asíncrono como unión discriminada
```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```
Evita combinaciones imposibles de booleanos (`isLoading && error`) y TypeScript solo permite acceder a `data` cuando `status === 'success'`.

### Errores
- `HttpError` (con `status`) para respuestas no 2xx.
- `ParseError` para payloads que no cumplen el contrato.
- `isAbortError` distingue las cancelaciones, que **no** se muestran como errores.
- `createPost` no admite cancelación a propósito: abortar un POST en el cliente no garantiza que no se haya procesado en el servidor.

---

## Casos borde de la API

Comprobados contra la API real:

| Caso | Comportamiento de la API | Tratamiento |
| ---- | ------------------------ | ----------- |
| `POST /posts` repetido | Devuelve siempre `id: 101` | La capa API lo acepta tal cual; la unicidad se garantiza en la capa de vista *(fase 5)* |
| `POST /posts` | No persiste | Los posts creados se guardan en memoria por usuario *(fase 5)* |
| `GET /posts?userId=999` | `200` con `[]`, no `404` | Estado vacío explícito *(fase 4)* |
| Respuestas `4xx/5xx` | `fetch` no rechaza | `fetchJson` lanza `HttpError` |
| Cambio rápido de usuario | Respuestas fuera de orden | `AbortController` *(fase 4)* |

---

## Testing

```bash
npm test
```

Los tests se escriben junto a cada funcionalidad. Hasta ahora:

- **Capa API** (`src/test/api.test.ts`): parseo y descarte de campos no usados, `HttpError` en 404, `ParseError` con payload inválido, forma de la petición POST, detección de `AbortError`.

`fetch` se sustituye con `vi.stubGlobal` y objetos `Response` reales, de modo que `ok`, `status` y `json()` se comportan como en el navegador.

---

## Qué haría con más tiempo

- **TanStack Query**: `queryKey: ['posts', userId]` para caché por usuario y `useMutation` + `setQueryData` para insertar los posts creados.
- **Zod**: schemas como única fuente de verdad (`z.infer`) en lugar de tipos y parsers separados.
- **MSW**: mocks a nivel de red, reutilizables en tests y en desarrollo.
- **Variable de entorno** para la URL base (`VITE_API_URL`).

---

## Uso de IA

*(Se completa al final del desarrollo.)*
