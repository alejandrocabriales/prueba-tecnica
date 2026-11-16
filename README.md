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
│  ├─ useUsers.ts
│  ├─ usePosts.ts  #   Posts del usuario seleccionado
│  └─ useCreatedPosts.ts # Posts creados, en memoria por usuario
├─ components/     # Presentación. No conoce URLs.
├─ utils/          # Funciones puras (filtrado, validación, modelo de vista, errores)
└─ test/           # Setup, fixtures, mock de fetch y tests
```

Cada capa depende solo de las de abajo: `components → hooks → api → types`.

---

## Diseño

Interfaz limpia y sobria, construida con **CSS Modules** y sin librerías de componentes.

- **Tokens de diseño** como variables CSS en `src/index.css` (colores, radios, foco, tipografía): un único sitio para ajustar el aspecto de toda la app.
- **Un `.module.css` por componente**: los estilos viven junto al componente que los usa y Vite genera nombres de clase únicos, sin colisiones globales.
- **Maestro-detalle**: directorio de usuarios en columna lateral (fija al hacer scroll) y detalle en el panel principal a partir de 768 px; en móvil, una vista cada vez con botón para volver.
- **Responsive revisado** de 320 px a 1920 px, sin scroll horizontal; en pantallas estrechas los botones del modal ocupan todo el ancho y la cabecera del usuario se reorganiza en varias líneas.
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

### Publicaciones del usuario
- `usePosts(userId)` reutiliza `useFetch` con un fetcher memoizado por `userId`. Al cambiar de usuario cambia la identidad del fetcher: el cleanup aborta la petición anterior y su resultado, si llegase, se descarta por pertenecer a otra petición.
- Sin usuario seleccionado no se lanza ninguna petición (`idle`).
- Los posts remotos no se cachean: al volver a un usuario se vuelven a pedir.

### Crear publicaciones
- **Modal con `<dialog>` nativo** y `showModal()`: el navegador vuelve inerte el resto de la página, retiene el foco, cierra con Esc y devuelve el foco al botón que lo abrió. El diálogo se monta solo mientras está abierto, así que el formulario se reinicia en cada apertura.
- **Validación** con una función pura (`validatePost`): título y contenido obligatorios, y el texto formado solo por espacios cuenta como vacío. Se valida al enviar; escribir en un campo limpia solo su error. El formulario usa `noValidate` para que los mensajes sean siempre los de la app.
- **Errores accesibles**: `aria-invalid`, `aria-describedby` apuntando al mensaje, mensaje con `role="alert"` y foco en el primer campo inválido.
- **Envío**: botones deshabilitados y "Publishing…" mientras dura la petición; Esc y "Cancel" no cierran a mitad de envío. Si el POST falla, se muestra el error dentro del modal y se conserva lo escrito.
- **Éxito**: se cierra el modal, el post aparece el primero y resaltado, y un aviso "Post published" (`role="status"`) desaparece a los 4 segundos.
- No hay actualización optimista: el post se añade cuando el servidor confirma.

### IDs únicos frente a `id: 101`
JSONPlaceholder responde `id: 101` a todos los posts creados. La UI no usa `id` como `key`: renderiza un modelo de vista `PostView` con un campo `key` propio del cliente (`remote-<id>` para los de la API, `local-<uuid>` con `crypto.randomUUID()` para los creados). El `id` del servidor se conserva sin modificar.

### Posts creados en memoria por usuario
`useCreatedPosts` guarda los posts creados en un diccionario `userId → PostView[]` que vive en `App`, por lo que sobrevive al cambio de usuario. Al renderizar se combinan con los remotos (`mergePosts`): primero los creados, del más reciente al más antiguo, y después los de la API. Se pierden al recargar la página, ya que la API no los persiste. Si la carga remota falla, se muestra el error con reintento.

`UserDetail` se renderiza con `key={user.id}`: al cambiar de usuario se reinicia su estado local (modal abierto, aviso de éxito) y nada se arrastra de un usuario a otro.

### Usuario seleccionado derivado
`App` guarda solo `selectedUserId`; el usuario se calcula en cada render buscándolo en la lista completa. Por eso, si la búsqueda oculta al usuario seleccionado, su detalle sigue abierto.

### Vista móvil y gestión del foco
Por debajo de 768 px lista y detalle son vistas separadas. Un estado `mobileView` (`'list' | 'detail'`) decide cuál se muestra mediante CSS; "Back to users" vuelve a la lista **sin perder la selección**. En escritorio ambos paneles están siempre visibles.

- **En móvil el foco acompaña al cambio de vista**: al abrir el detalle va al nombre del usuario (`h2` con `tabIndex={-1}`) y al volver, al botón del usuario seleccionado. Así los usuarios de teclado y de lector de pantalla llegan al contenido nuevo.
- **En escritorio el foco no se mueve**: la lista y el detalle están a la vista y el usuario puede seguir recorriendo la lista con el teclado.
- El tamaño se consulta con `matchMedia`; en entornos sin `matchMedia` (jsdom) se asume escritorio.

### Título de la pestaña
El título refleja el usuario seleccionado ("Leanne Graham · Directory") usando `<title>` dentro del componente, que React 19 lleva automáticamente al `<head>`.

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
- **Auditoría con axe-core** (reglas WCAG 2.2 A/AA y buenas prácticas) en navegador real sobre cinco estados (inicial, búsqueda vacía, usuario seleccionado, modal con errores y detalle en móvil): **0 violaciones**.
- **Contraste**: todos los pares de color de texto cumplen WCAG AA (≥ 4.5:1); el más ajustado es el texto secundario sobre la fila seleccionada (4.97:1).

---

## Casos borde de la API

Comprobados contra la API real:

| Caso | Comportamiento de la API | Tratamiento |
| ---- | ------------------------ | ----------- |
| `POST /posts` repetido | Devuelve siempre `id: 101` | `key` única generada en el cliente (cubierto por test) |
| `POST /posts` | No persiste | Los posts creados se guardan en memoria por usuario durante la sesión |
| Usuario sin posts | `200` con `[]`, no `404` | Estado vacío "No posts yet" |
| Respuestas `4xx/5xx` | `fetch` no rechaza | `fetchJson` lanza `HttpError` |
| Cambio rápido de usuario | Respuestas fuera de orden | `AbortController` + resultado ligado a su petición (cubierto por test) |
| Formato de usuario | `company` es un objeto anidado | El parser lo valida y lo aplana a `companyName` |

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
| `src/test/createPost.test.tsx` | Validación de campos vacíos y con solo espacios **sin lanzar POST**, error accesible y foco, limpieza del error al escribir, formulario deshabilitado durante el envío, post nuevo primero con aviso de éxito, **dos posts con `id: 101` sin warning de keys** y persistencia al cambiar de usuario y volver, error del POST conservando lo escrito |
| `src/test/navigation.test.tsx` | Foco en móvil (al detalle y de vuelta al usuario), foco estable en escritorio, título de la pestaña |
| `src/test/posts.test.tsx` | Cabecera y posts tras el skeleton, **race condition** (respuesta lenta de un usuario anterior ignorada y petición abortada), error y reintento, usuario sin posts, detalle abierto aunque la búsqueda oculte al usuario |

`fetch` se sustituye con un router mínimo (`src/test/mockFetch.ts`) que:
- devuelve objetos `Response` reales y rechaza cualquier ruta no declarada, para que ningún test toque la red;
- **imita la cancelación de `fetch`**: si la señal se aborta, la promesa se rechaza con `AbortError` aunque la respuesta siga pendiente;
- permite respuestas controladas manualmente (`createDeferred`) para probar estados de carga y respuestas lentas de forma determinista.

jsdom no implementa `<dialog>.showModal()`; `src/test/setup.ts` incluye un polyfill mínimo que solo abre y cierra el diálogo. La retención del foco y la inercia del fondo son del navegador y se verificaron manualmente.

Las fixtures de respuesta (`apiUsers`) reproducen el formato real de la API, no el tipo de dominio, para que los tests también ejerciten los parsers.

---

## Qué haría con más tiempo

- **TanStack Query** para caché por usuario (volver a un usuario sería instantáneo), deduplicación y mutaciones.
- **`use()` + Suspense** de React 19 para leer datos sin efectos.
- **Actualización optimista** con `useOptimistic` y reversión si el POST falla.
- **Persistencia** de los posts creados en `sessionStorage` para sobrevivir a una recarga.
- **Límites de longitud** en título y contenido.
- **Error Boundary** para errores de render inesperados (los errores de red ya tienen su propio estado).
- **Tests E2E con Playwright** para cubrir en navegador real el foco del modal y las vistas móviles.
- **Selección en la URL** (`?user=3`) para compartir enlaces y que el botón "atrás" del navegador funcione.
- **Zod** como única fuente de verdad para tipos y validación.
- **MSW** para mocks a nivel de red reutilizables en tests y desarrollo.
- **Variable de entorno** para la URL base (`VITE_API_URL`).

---

## Uso de IA

*(Se completa al final del desarrollo.)*
