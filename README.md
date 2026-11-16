# Directory

SPA en React + TypeScript que consume [JSONPlaceholder](https://jsonplaceholder.typicode.com): lista de usuarios con búsqueda, publicaciones por usuario y creación de nuevas publicaciones con formulario validado.

> *Documentation in Spanish, as requested by the challenge. The UI and the code are in English.*

---

## Requisitos de la prueba

| Requisito | Dónde |
| --------- | ----- |
| Lista de usuarios con búsqueda por nombre | [Búsqueda](#búsqueda) · `users.test.tsx` |
| Ver publicaciones del usuario y crear una nueva con formulario validado, visible en la lista | [Crear publicaciones](#crear-publicaciones) · `createPost.test.tsx` |
| Estados de carga y de error visibles | Skeletons, errores con "Try again" y estados vacíos · [Errores](#errores) |
| Al menos 3 tests con Vitest y Testing Library | **26 tests** en 6 archivos · [Testing](#testing) |
| README: ejecución, decisiones, qué haría con más tiempo y uso de IA | Este documento |
| Commits progresivos | [Historial de commits](#historial-de-commits) |

**Además**: IDs únicos frente al `id: 101` repetido de la API, posts creados que se conservan al cambiar de usuario, cancelación de peticiones obsoletas (race conditions), reintento en los errores de carga, accesibilidad auditada (axe: 0 violaciones; Lighthouse: 100) y rendimiento medido (Lighthouse: 99 móvil, 100 escritorio).

---

## Índice

- [Cómo ejecutarlo](#cómo-ejecutarlo)
- [Stack](#stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Diseño](#diseño)
- [Decisiones técnicas](#decisiones-técnicas)
- [Rendimiento](#rendimiento)
- [Casos borde de la API](#casos-borde-de-la-api)
- [Testing](#testing)
- [Qué haría con más tiempo](#qué-haría-con-más-tiempo)
- [Historial de commits](#historial-de-commits)
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

**Despliegue**: `netlify.toml` define el build (`npm run build` → `dist/`) y fija Node 22, ya que Vite 8 no funciona con versiones anteriores a 20.19.

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
├─ api/                  # Acceso a red. No conoce React.
│  ├─ client.ts          #   fetchJson, HttpError, NetworkError, isAbortError
│  ├─ parse.ts           #   Validación runtime de payloads (unknown → tipo)
│  ├─ users.ts
│  └─ posts.ts
├─ types/                # User, Post, PostView y AsyncState<T>
├─ hooks/                # Estado y efectos. No conoce JSX.
│  ├─ useFetch.ts        #   Hook genérico: clave, cancelación, reintento
│  ├─ useUsers.ts
│  ├─ usePosts.ts        #   Posts del usuario seleccionado
│  └─ useCreatedPosts.ts #   Posts creados, en memoria por usuario
├─ components/           # Presentación. No conoce URLs.
│  ├─ UserDirectory/     #   Búsqueda + lista + estados del panel de usuarios
│  ├─ SearchInput/
│  ├─ UserList/          #   Lista y skeleton
│  ├─ UserDetail/        #   Cabecera, posts y estado "Select a user"
│  ├─ PostList/          #   Lista y skeleton
│  ├─ NewPostDialog/     #   Modal con formulario validado
│  └─ StatusMessage/     #   ErrorState, EmptyState, LiveRegion
├─ utils/                # Funciones puras: filtrado, validación, modelo de vista, mensajes de error
├─ test/                 # Setup, fixtures, mock de fetch y tests
└─ App.tsx               # Composición y estado compartido (selección, vista móvil, posts creados)
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

### `useFetch`: petición identificada por clave y estado de carga derivado
Un único hook genérico gestiona petición, cancelación y reintento para usuarios y publicaciones:

```ts
useFetch({ key: `posts:${userId}`, fetch: (signal) => getPostsByUser(userId, signal) })
```

- **Identidad por clave**: el efecto depende de `key` (un string), no de la función. Una función `fetch` escrita en línea no puede provocar peticiones en bucle; la versión más reciente se lee con `useEffectEvent` (React 19.2+).
- **Cancelación**: al cambiar la clave o desmontar, el cleanup llama a `controller.abort()`. Las cancelaciones (`isAbortError`) no se muestran como error.
- **Loading derivado**: el hook guarda el último resultado junto con la clave e intento que lo produjeron. Si no corresponde a la petición actual, el estado es `loading`. Así se cumple la regla `react-hooks/set-state-in-effect` (no hay `setState` síncrono en el efecto) y nunca se muestran datos de otra clave.
- **Reintento**: `retry()` incrementa un contador que forma parte de la identidad de la petición.
- En desarrollo se ve una petición `/users` cancelada al cargar: es `StrictMode` montando el efecto dos veces y el cleanup funcionando.

### Publicaciones del usuario
- `usePosts(userId)` reutiliza `useFetch` con la clave `posts:<userId>`. Al cambiar de usuario cambia la clave: el cleanup aborta la petición anterior y su resultado, si llegase, se descarta por pertenecer a otra clave.
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
- `NetworkError` cuando `fetch()` no obtiene respuesta (sin conexión, DNS…), `HttpError` (con `status`) para respuestas no 2xx y `ParseError` para payloads inválidos.
- `toUserMessage` traduce cada error a un texto accionable. Solo un `NetworkError` se presenta como problema de conexión: un error de programación (p. ej. un `TypeError` propio) muestra un mensaje genérico en lugar de culpar a la red.
- `createPost` no admite cancelación a propósito: abortar un POST en el cliente no garantiza que no se haya procesado en el servidor.

### Accesibilidad
- Input de búsqueda con `<label>` asociado (visualmente oculto) y botón de limpiar que devuelve el foco al input.
- Los dos botones que limpian la búsqueda (× y el del estado vacío) comparten el nombre "Clear search": misma acción, mismo nombre (WCAG 3.2.4, identificación consistente).
- Usuarios como `<button type="button">` nativos dentro de `<ul>`, con `aria-current` en el seleccionado.
- **Anuncios con live regions siempre montadas**: cada panel tiene una región `role="status"` oculta visualmente cuyo texto cambia ("Loading users…", "1 user found", "10 posts loaded"). Los lectores de pantalla anuncian cambios en regiones que ya existen; una región creada a la vez que su texto puede no anunciarse. Los skeletons son decorativos (`aria-hidden`) y los estados vacíos son contenido estático (`role="group"`).
- Errores con `role="alert"`, que está pensado para insertarse cuando aparece el error.
- Animaciones desactivadas con `prefers-reduced-motion`.
- **Auditoría con axe-core** (reglas WCAG 2.2 A/AA y buenas prácticas) en navegador real sobre cinco estados (inicial, búsqueda vacía, usuario seleccionado, modal con errores y detalle en móvil): **0 violaciones**.
- **Contraste**: todos los pares de color de texto cumplen WCAG AA (≥ 4.5:1); el más ajustado es el texto secundario sobre la fila seleccionada (4.97:1).

---

## Rendimiento

Lighthouse 12 sobre el **build de producción** (`npm run build && npm run preview`), mediana de 3 ejecuciones:

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| Móvil | 99 | 100 | 100 | 100 | 2.1 s | 0 |
| Escritorio | 100 | 100 | 100 | 100 | 0.3 s | 0 |

- **`preconnect` a la API**: el elemento LCP es la lista de usuarios, que depende de `GET /users`. El navegador abre la conexión (DNS + TLS) mientras descarga el JavaScript. Lleva `crossorigin` porque la petición es CORS sin credenciales; sin él, la conexión abierta no se reutilizaría. LCP móvil: de 2.5 s a 2.1 s.
- **`robots.txt`**: al ser una SPA, sin este archivo el servidor devolvía `index.html` en su lugar y Lighthouse lo marcaba como inválido.
- **CLS 0**: los skeletons reservan el espacio del contenido mientras carga.
- Medir con `npm run dev` da resultados mucho peores y no representativos: módulos sin empaquetar, React en modo desarrollo y efectos duplicados por `StrictMode`. Las extensiones del navegador también alteran la medición (conviene una ventana de incógnito).

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

**26 tests en 6 archivos.** Son tests de comportamiento: consultan la UI por rol y nombre accesible, como lo haría un usuario.

| Archivo | Cubre |
| ------- | ----- |
| `src/test/api.test.ts` | Parseo, `HttpError` en 404, `ParseError` con payload inválido, forma del POST, `NetworkError` solo para fallos de `fetch` (las cancelaciones pasan intactas), mensajes de error que no culpan a la red de un bug, detección de `AbortError` |
| `src/test/useFetch.test.ts` | **Una función `fetch` en línea no provoca peticiones repetidas**, nueva petición al cambiar la clave y al reintentar, estado `idle` sin petición |
| `src/test/users.test.tsx` | Carga anunciada y lista, filtrado sin mayúsculas/espacios/acentos con anuncio del número de resultados, limpieza rápida (×) devolviendo el foco, estado vacío y "Clear search", selección con `aria-current`, error 500 y recuperación con "Try again" |
| `src/test/createPost.test.tsx` | Validación de campos vacíos y con solo espacios **sin lanzar POST**, error accesible y foco, limpieza del error al escribir, formulario deshabilitado durante el envío, post nuevo primero con aviso de éxito, **dos posts con `id: 101` sin warning de keys** y persistencia al cambiar de usuario y volver, error del POST conservando lo escrito |
| `src/test/navigation.test.tsx` | Foco en móvil (al detalle y de vuelta al usuario), foco estable en escritorio, título de la pestaña |
| `src/test/posts.test.tsx` | Cabecera y posts tras el estado de carga, **race condition** (respuesta lenta de un usuario anterior ignorada y petición abortada), error y reintento, usuario sin posts, detalle abierto aunque la búsqueda oculte al usuario |

`fetch` se sustituye con un router mínimo (`src/test/mockFetch.ts`) que:
- devuelve objetos `Response` reales y rechaza cualquier ruta no declarada, para que ningún test toque la red;
- **imita la cancelación de `fetch`**: si la señal se aborta, la promesa se rechaza con `AbortError` aunque la respuesta siga pendiente;
- permite respuestas controladas manualmente (`createDeferred`) para probar estados de carga y respuestas lentas de forma determinista.

jsdom no implementa `<dialog>.showModal()`; `src/test/setup.ts` incluye un polyfill mínimo que solo abre y cierra el diálogo. La retención del foco y la inercia del fondo son del navegador y se verificaron manualmente.

Las fixtures de respuesta (`apiUsers`) reproducen el formato real de la API, no el tipo de dominio, para que los tests también ejerciten los parsers.

Para comprobar que los tests clave detectan su bug, se rompió el código a propósito y se verificó que fallaban: sin la cancelación, falla el test de race condition; con `key={post.id}`, falla el de IDs duplicados; sin el `trim()`, el de validación; y con el diseño anterior de `useFetch`, una función en línea provocaba 479 peticiones en lugar de 1.

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
- **Más tests de casos límite**: comprobar el cuerpo del POST, Esc durante el envío, doble envío, desaparición del aviso de éxito, directorio vacío y contratos de API rotos. La cobertura actual, medida con `@vitest/coverage-v8`, es del 94 % de líneas y 88.6 % de ramas; preferí no añadir umbrales porque empujan a escribir tests para subir el número en lugar de para probar comportamiento.

---

## Historial de commits

Cada commit compila, pasa lint y tests, y cuenta una decisión:

| Commit | Qué aporta |
| ------ | ---------- |
| `chore: scaffold vite react-ts…` | Tooling antes que funcionalidad: TypeScript estricto, ESLint con tipos, Vitest |
| `feat(api): add domain types and typed fetch client` | Contrato de datos y validación en la frontera de red |
| `docs: add readme…` | Documentar las decisiones desde el principio |
| `feat(users): …` | Primer flujo completo: búsqueda, carga, error y reintento |
| `feat(posts): show user detail…` | Posts por usuario con cancelación de peticiones obsoletas |
| `feat(posts): create posts…` | Formulario validado, IDs únicos y memoria por usuario |
| `feat(a11y): …` | Foco en móvil, título de pestaña y correcciones de la auditoría |
| `refactor: harden…` | Revisión crítica: cambios tras listar los puntos débiles de la propia solución |
| `perf: …` | Mejoras medidas con Lighthouse sobre producción |

---

## Uso de IA

Desarrollé el proyecto con **Claude Code** (modelo Claude Opus) como herramienta de *pair programming*, trabajando **a partir de una especificación mía** y dirigiendo cada fase. La IA generó la mayor parte de la implementación; las decisiones, la revisión y los commits fueron míos.

### 1. La especificación (mi prompt inicial)
No pedí "haz una app". El primer prompt definía **objetivo, requisitos y restricciones**:
- **Objetivo**: una entrega de nivel sobresaliente, sin sobre-ingeniería, que pudiera defender decisión a decisión en la entrevista.
- **Requisitos obligatorios** del enunciado y **requisitos extra propios**, agrupados en cuatro bloques:
  - **Resiliencia frente a la API**: IDs únicos ante el `id: 101` repetido, posts creados que se conservan al cambiar de usuario, y `AbortController` contra *race conditions*, ignorando `AbortError`.
  - **UX y validación**: búsqueda con `trim()` e insensible a mayúsculas, botón para limpiar y estado vacío; "Reintentar" en todos los errores de carga; validación estricta con errores accesibles (`aria-invalid`, `role="alert"`), botón deshabilitado durante el envío, reset del formulario y el post nuevo arriba con aviso de éxito; maestro-detalle responsive con CSS Modules.
  - **Tests concretos**: los cinco escenarios a cubrir (filtrado y estado vacío, error y reintento, carga de posts, validación sin POST, varios posts seguidos sin colisión de keys y persistencia al cambiar de usuario).
  - **Higiene técnica**: TypeScript `strict`, arquitectura `api/`, `hooks/`, `components/`, `types/`, 0 warnings de ESLint y build limpio.
- **Restricciones de proceso**: proponer primero la estructura, un plan de 7-8 commits en un orden concreto (tooling → tipos y API → usuarios → posts → formulario → UX/a11y → tests → README) y las decisiones de partida con pros, contras y cómo defenderlas, **sin escribir código hasta mi confirmación**.

### 2. Las reglas de trabajo (skill)
Para que ese proceso se cumpliera en todas las fases, creé una **skill** (instrucciones reutilizables para Claude Code), `tech-test-mentor`:
- Una fase por commit, sin generar la aplicación de golpe.
- Antes de cada fase: **opciones, recomendación y trade-offs**, y esperar mi confirmación.
- Sin `any`, ninguna dependencia sin justificar y accesibilidad básica obligatoria.
- **Avisar de los casos límite** en lugar de resolverlos en silencio, para decidir yo y documentarlos.
- Cerrar cada fase con pasos de prueba manual y un mensaje de commit sugerido. El commit lo hacía yo.

### 3. Cómo dirigí cada fase
Cada fase seguía el mismo ciclo: **la IA proponía opciones → yo elegía o pedía cambios según los requisitos → implementación → yo verificaba → commit**. Algunas de las decisiones y cambios que pedí:
- **Plan**: tests junto a cada funcionalidad en lugar de todos al final; mantener el detalle abierto si la búsqueda oculta al usuario seleccionado.
- **Búsqueda**: sin *debounce* (filtrado local de 10 elementos) y documentando el porqué; insensible a acentos.
- **Diseño**: decidí el idioma de la interfaz y pedí documentar el enfoque de estilos (CSS Modules y tokens).
- **Hook de datos**: ante la regla `react-hooks/set-state-in-effect` de React 19, pedí contrastar las alternativas con la documentación oficial (otro cliente HTTP, `use()` + Suspense o rediseñar el hook) antes de decidir. Se optó por derivar el estado de carga en lugar de desactivar la regla.
- **Documentación**: el README se actualiza en cada commit, explica *qué* se eligió y *por qué* de forma breve, y las comparativas con alternativas quedan fuera.
- **Revisión crítica**: antes de cerrar, pedí que enumerase los puntos débiles de su propia solución y elegí cuáles cambiar.
- **Rendimiento**: pedí auditar con Lighthouse y aplicar solo mejoras medidas sobre el build de producción.
- **Alcance**: rechacé ampliar los tests más allá de lo necesario (ver abajo).

### 4. Qué aportó la IA y acepté
- **Validar las respuestas en la frontera de red** (`unknown` + parsers) en lugar de hacer *casts*.
- El **estado de carga derivado** en `useFetch`, para cumplir `set-state-in-effect` sin desactivar la regla.
- **`<dialog>` nativo** para el modal, que delega en el navegador la retención del foco y la inercia del fondo.
- El modelo de vista **`PostView`**, que separa el `id` del servidor de la `key` del cliente.
- El **mock de `fetch` que respeta la cancelación**, sin el cual el test de *race condition* no probaría nada.

### 5. Qué corregí o rechacé
- **Afirmaciones demasiado absolutas.** La IA escribió que "Axios no aporta ventajas frente a `fetch`". Lo corregí: Axios tiene ventajas reales (interceptores, timeouts, progreso de subida) y la decisión es válida **para este caso**, no en general. También separamos dos problemas distintos: *hacer peticiones HTTP* y *gestionar el estado del servidor*.
- **Un hook que podía entrar en bucle.** De los ocho puntos débiles de la revisión, decidí cambiar cuatro. El principal: `useFetch` identificaba la petición por la identidad de la función, así que una función escrita en línea provocaba peticiones en bucle, y la única protección era un comentario. Lo cuestioné: un hook genérico no puede depender de que quien lo use memorice la función, y ese riesgo no se había presentado como *trade-off*. Lo rediseñamos con una clave y `useEffectEvent`. También cambié: errores de programación que se mostraban como "problema de conexión", un uso incoherente de las *live regions* y dos botones con nombres distintos para la misma acción. Los otros cuatro puntos quedan como mejoras conocidas.
- **Alcance de los tests.** Rechacé una fase extra para subir la cobertura: el enunciado pide al menos 3 tests y ya había 26 cubriendo lo importante.
- **Contenido del README.** Retiré una sección propuesta que no aportaba al lector.

### 6. Cómo verifiqué lo que generaba
- **En cada fase**: leía las opciones y trade-offs antes de aprobar, seguía los pasos de prueba manual en el navegador (sin conexión, red lenta, vista móvil…) y revisaba el diff antes de hacer el commit.
- `lint` (0 warnings), `typecheck`, `test` y `build` en verde antes de cada commit.
- **Que los tests detectan el bug**: rompiendo el código a propósito y comprobando que el test correspondiente fallaba.
- Comprobaciones contra la **API real**, auditoría de accesibilidad con **axe-core** y **Lighthouse sobre el build de producción** (3 ejecuciones, mediana).

Esta verificación detectó errores de la implementación generada antes de que llegaran a un commit:
- La plantilla de Vite no declaraba `strict: true` y traía TypeScript 7, incompatible con `typescript-eslint` → TS 6.0.
- **Tests en verde con el build roto** por un error de tipos: Vitest no comprueba tipos, de ahí ejecutar siempre `tsc`.
- Fixtures que no imitaban el formato real de la API, detectadas por el propio parser.
- Una comprobación de `matchMedia` que jsdom declara pero no implementa (13 tests fallando).
- Una violación de accesibilidad (`<h1>` oculto en móvil) detectada por axe-core.
