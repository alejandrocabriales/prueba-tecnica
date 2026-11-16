# Directory

SPA en React + TypeScript que consume [JSONPlaceholder](https://jsonplaceholder.typicode.com): lista de usuarios con búsqueda, publicaciones por usuario y creación de nuevas publicaciones con formulario validado.

> 🚧 En desarrollo. Este README se actualiza en cada commit junto con la funcionalidad que documenta.

---

## Índice

- [Cómo ejecutarlo](#cómo-ejecutarlo)
- [Stack](#stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Diseño](#diseño)
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

| Script               | Qué hace                                              |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo con HMR                        |
| `npm run build`      | Typecheck (`tsc -b`) + build de producción en `dist/` |
| `npm run preview`    | Sirve el build de producción                          |
| `npm run lint`       | ESLint con reglas type-aware y `--max-warnings 0`     |
| `npm run typecheck`  | Solo comprobación de tipos                            |
| `npm test`           | Tests una vez (Vitest)                                |
| `npm run test:watch` | Tests en modo watch                                   |

---

## Stack

| Área     | Elección                                                   |
| -------- | ---------------------------------------------------------- |
| Build    | Vite 8                                                     |
| UI       | React 19                                                   |
| Lenguaje | TypeScript 6.0 (`strict`, `noUncheckedIndexedAccess`)      |
| Lint     | ESLint 10 + `typescript-eslint` (`strictTypeChecked`)      |
| Tests    | Vitest + Testing Library + `user-event` + `jest-dom`       |
| Datos    | `fetch` nativo + `AbortController`                         |
| Estilos  | CSS Modules + variables CSS                                |

Dependencias de runtime: solo `react` y `react-dom`.

---

## Estructura del proyecto

```
src/
├─ api/            # Acceso a red. No conoce React.
│  ├─ client.ts    #   fetchJson, HttpError, isAbortError
│  ├─ parse.ts     #   Validación runtime de payloads (unknown → tipo)
│  ├─ users.ts
│  └─ posts.ts
├─ types/          # Tipos de dominio y AsyncState<T>
├─ hooks/          # Estado y efectos. No conoce JSX.
│  ├─ useFetch.ts  #   Hook genérico: abort + estado + reintento
│  └─ useUsers.ts
├─ components/     # Presentación. No conoce URLs.
├─ utils/          # Funciones puras (filtrado, mensajes de error, iniciales)
└─ test/           # Setup, fixtures, mock de fetch y tests
```

Cada capa depende solo de las de abajo: `components → hooks → api → types`.

---

## Diseño

Interfaz limpia y sobria, construida con **CSS Modules** y sin librerías de componentes.

- **Tokens de diseño** como variables CSS en `src/index.css` (colores, radios, foco, tipografía): un único sitio para ajustar el aspecto de toda la app.
- **Un `.module.css` por componente**: los estilos viven junto al componente que los usa y Vite genera nombres de clase únicos, sin colisiones globales.
- **Maestro-detalle**: directorio de usuarios en columna lateral y detalle en el panel principal a partir de 768 px; en móvil se muestra una sola vista.
- **Estados visibles**: skeletons durante la carga, mensajes de error con reintento y estados vacíos con una acción clara.
- **Accesibilidad visual**: foco siempre visible (`:focus-visible`) y animaciones desactivadas con `prefers-reduced-motion`.
- Un helper `cx()` de tres líneas compone clases condicionales.

Los textos de la interfaz están en inglés.

---

## Decisiones técnicas

### Vite
SPA sin necesidades de SEO ni SSR, consumiendo una API pública desde el cliente. Vite da arranque instantáneo y Vitest reutiliza su configuración.

### ESLint con reglas type-aware
`typescript-eslint` con `strictTypeChecked` detecta promesas sin manejar, `any` inseguro y aserciones innecesarias. La plantilla de `create-vite` traía oxlint; lo sustituí por este motivo.

### TypeScript 6.0
`typescript-eslint` requiere `typescript <6.1.0`. Se actualizará cuando haya soporte para TS 7.

### `fetch` nativo en lugar de Axios o TanStack Query
El alcance (una API pública, sin autenticación ni subida de ficheros) solo necesita peticiones JSON cancelables, que `fetch` + `AbortController` resuelven sin dependencias. Como `fetch` no rechaza en 4xx/5xx, `fetchJson` comprueba `response.ok` y lanza `HttpError`.

### Validación en la frontera de red
`fetchJson` devuelve `unknown`. Cada recurso tiene un parser que estrecha el tipo o lanza `ParseError`, de modo que no hay `as` ni `any` y un cambio de contrato falla en la capa API con un mensaje claro.

### Estado asíncrono como unión discriminada
```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```
Los estados imposibles (`loading` y `error` a la vez) no se pueden representar, y `data` solo es accesible cuando `status === 'success'`.

### `useFetch`: estado de carga derivado
Un único hook genérico gestiona petición, cancelación y reintento para usuarios y publicaciones.

- **Cancelación**: el cleanup del efecto llama a `controller.abort()`. Las cancelaciones (`isAbortError`) no se muestran como error.
- **Loading derivado**: el hook guarda el último resultado junto con la petición que lo produjo. Si no corresponde a la petición actual, el estado es `loading`. Así se cumple la regla `react-hooks/set-state-in-effect` (no hay `setState` síncrono en el efecto) y una respuesta antigua nunca puede sobrescribir a la actual.
- **Reintento**: `retry()` incrementa un contador que forma parte de la identidad de la petición.
- En desarrollo se ve una petición `/users` cancelada al cargar: es `StrictMode` montando el efecto dos veces y el cleanup funcionando.

### Búsqueda
- Filtrado local en cada pulsación, **sin debounce**: son 10 usuarios ya cargados y filtrarlos no tiene coste apreciable. El debounce se justificaría si cada pulsación lanzase una petición.
- Ignora mayúsculas, espacios al inicio y final, y **acentos** (`"jose"` encuentra `"José"`) mediante `normalize('NFD')`.
- Solo por nombre, como pide el enunciado.
- Dos estados vacíos distintos: directorio vacío y búsqueda sin resultados (con acción para limpiarla).

### Errores
- `HttpError` (con `status`) para respuestas no 2xx y `ParseError` para payloads inválidos.
- `toUserMessage` traduce cada error técnico a un texto accionable para el usuario.
- `createPost` no admite cancelación a propósito: abortar un POST en el cliente no garantiza que no se haya procesado en el servidor.

### Accesibilidad
- Input de búsqueda con `<label>` asociado (visualmente oculto) y botón de limpiar con nombre accesible que devuelve el foco al input.
- Usuarios como `<button type="button">` nativos dentro de `<ul>`, con `aria-current` en el seleccionado.
- Carga con `role="status"`, errores con `role="alert"`.
- Animaciones desactivadas con `prefers-reduced-motion`.

---

## Casos borde de la API

Comprobados contra la API real:

| Caso | Comportamiento de la API | Tratamiento |
| ---- | ------------------------ | ----------- |
| `POST /posts` repetido | Devuelve siempre `id: 101` | La unicidad se garantiza en la capa de vista *(fase 5)* |
| `POST /posts` | No persiste | Los posts creados se guardan en memoria por usuario *(fase 5)* |
| `GET /posts?userId=999` | `200` con `[]`, no `404` | Estado vacío explícito *(fase 4)* |
| Respuestas `4xx/5xx` | `fetch` no rechaza | `fetchJson` lanza `HttpError` |
| Cambio rápido de selección | Respuestas fuera de orden | `AbortController` + resultado ligado a su petición |

---

## Testing

```bash
npm test
```

Tests de comportamiento: consultan la UI por rol y nombre accesible, como lo haría un usuario.

| Archivo | Cubre |
| ------- | ----- |
| `src/test/api.test.ts` | Parseo, `HttpError` en 404, `ParseError` con payload inválido, forma del POST, detección de `AbortError` |
| `src/test/users.test.tsx` | Carga (skeleton → lista), filtrado sin mayúsculas/espacios/acentos, estado vacío y "Clear search", selección con `aria-current`, error 500 y recuperación con "Try again" |

`fetch` se sustituye con un router mínimo (`src/test/mockFetch.ts`) que devuelve objetos `Response` reales y rechaza cualquier ruta no declarada, para que ningún test toque la red.

---

## Qué haría con más tiempo

- **TanStack Query** para caché por usuario, deduplicación y mutaciones.
- **`use()` + Suspense** de React 19 para leer datos sin efectos.
- **Zod** como única fuente de verdad para tipos y validación.
- **MSW** para mocks a nivel de red reutilizables en tests y desarrollo.
- **Variable de entorno** para la URL base (`VITE_API_URL`).

---

## Uso de IA

*(Se completa al final del desarrollo.)*
