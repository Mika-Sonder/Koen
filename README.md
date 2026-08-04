# KOEN

<p align="center">
  <img src="./public/koen-brand.jpg" alt="Logo de KOEN" width="180" />
</p>

KOEN es un tracker de anime, manga y novelas ligeras desarrollado con Next.js y Supabase. Permite explorar catálogos, consultar fichas detalladas y organizar una colección personal desde una interfaz adaptable, rápida y enfocada en contenido japonés.

**Desarrollador:** Mika-Sonder

## Funcionalidades

- Catálogos independientes de anime, manga y novelas ligeras.
- Explorador unificado con búsqueda, filtros y paginación real.
- Fichas de anime y manga con sinopsis traducida automáticamente al español, personajes, recomendaciones y enlaces externos.
- Fichas de novelas con estado de publicación, créditos, volúmenes y sinopsis traducida.
- Interfaz individual para cada volumen con fecha, formato, páginas, editorial, créditos y enlaces oficiales disponibles.
- Horario semanal de los animes en emisión, organizado según la zona horaria de Lima.
- Autenticación con correo y contraseña mediante Supabase Auth.
- Acceso con Google opcional.
- Confirmación y reenvío de correo electrónico.
- Lista personal separada en Anime, Manga y Novelas.
- Edición de estado, progreso, puntuación y notas desde la lista.
- Favoritos, estadísticas, actividad reciente y notificaciones.
- Perfil editable con nombre de usuario, biografía y foto de perfil.
- Cambio de correo y contraseña desde Configuración.
- Importación desde AniList y MyAnimeList.
- Exportación de la colección en CSV o JSON.
- Tema claro, oscuro o automático.
- Manifest web y diseño adaptable a escritorio y dispositivos móviles.
- Integración opcional con Plausible y Sentry.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Framework | Next.js 14, App Router y React 18 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | PostgreSQL mediante Supabase |
| Autenticación | Supabase Auth y `@supabase/ssr` |
| Archivos | Supabase Storage |
| Formularios | React Hook Form y Zod |
| Componentes | Radix UI y Lucide React |
| Observabilidad | Sentry y Plausible, opcionales |
| Despliegue | Vercel |

## Fuentes de datos

- **AniList GraphQL API:** anime, manga, temporadas, horarios, personajes y recomendaciones.
- **RanobeDB API:** series de novelas ligeras, volúmenes, ediciones y créditos.
- **MyMemory:** traducción automática de sinopsis al español.

KOEN no aloja episodios, capítulos, libros ni material de lectura. Los enlaces externos se muestran únicamente cuando la fuente consultada los proporciona.

## Rutas principales

| Ruta | Contenido |
| --- | --- |
| `/inicio` | Inicio y recomendaciones destacadas |
| `/explorar` | Catálogo unificado de anime, manga y novelas |
| `/anime` | Catálogo independiente de anime |
| `/manga` | Catálogo independiente de manga |
| `/novelas` | Catálogo independiente de novelas ligeras |
| `/horario` | Horario semanal de anime en emisión |
| `/mi-lista` | Colección personal del usuario |
| `/favoritos` | Títulos favoritos |
| `/estadisticas` | Resumen de actividad y puntuaciones |
| `/perfil` | Perfil y actividad reciente |
| `/configuracion` | Cuenta, privacidad y preferencias |
| `/acceso` | Registro e inicio de sesión |

## Requisitos

- Node.js 22 LTS recomendado.
- pnpm 11.
- Un proyecto de Supabase para las funciones personales.

La exploración pública puede funcionar sin Supabase. El acceso, perfil, avatares, favoritos, lista personal, estadísticas y notificaciones requieren una configuración válida.

## Instalación local

1. Instala las dependencias:

   ```bash
   pnpm install
   ```

2. Crea el archivo de entorno a partir del ejemplo:

   ```bash
   cp .env.example .env.local
   ```

   En PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Completa como mínimo las variables públicas de Supabase.

4. Aplica la migración incluida en `supabase/migrations` sobre tu proyecto de Supabase.

5. Inicia el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

6. Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Para cuentas | URL pública del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Para cuentas | Clave publicable del proyecto Supabase |
| `NEXT_PUBLIC_SITE_URL` | Producción | URL pública de KOEN, usada en redirecciones de Auth |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | No | Dominio configurado en Plausible |
| `NEXT_PUBLIC_SENTRY_DSN` | No | DSN público de Sentry |
| `SENTRY_AUTH_TOKEN` | No | Token usado durante la subida de sourcemaps |
| `SENTRY_ORG` | No | Organización de Sentry |
| `SENTRY_PROJECT` | No | Proyecto de Sentry |
| `MYMEMORY_CONTACT_EMAIL` | No | Correo de contacto enviado a MyMemory |

La aplicación también admite `NEXT_PUBLIC_SUPABASE_ANON_KEY` como compatibilidad, aunque se recomienda usar la clave publicable. Nunca expongas una clave `service_role` o una secret key mediante variables `NEXT_PUBLIC_*`.

## Configuración de Supabase

### 1. Base de datos

Ejecuta el archivo:

```text
supabase/migrations/20260802041813_create_koen_schema.sql
```

Puedes copiar su contenido en el SQL Editor de Supabase. La migración crea:

- Perfiles y preferencias de usuario.
- Listas personales, favoritos, actividad y notificaciones.
- Tipos e índices necesarios.
- Trigger para crear automáticamente el perfil de cada usuario.
- Políticas Row Level Security limitadas al propietario de cada registro.
- Bucket público `avatars`, con escritura limitada a la carpeta del usuario autenticado.
- Publicación Realtime para notificaciones.

No elimines las políticas RLS ni sustituyas la clave pública por una clave administrativa en el cliente.

### 2. Redirecciones de autenticación

En **Authentication → URL Configuration**, configura:

- **Site URL local:** `http://localhost:3000`
- **Redirect URL local:** `http://localhost:3000/auth/callback`
- **Site URL de producción:** la URL pública de tu despliegue.
- **Redirect URL de producción:** `https://tu-dominio.com/auth/callback`

`NEXT_PUBLIC_SITE_URL` debe coincidir con la URL pública del entorno correspondiente. Google OAuth es opcional y se activa desde **Authentication → Providers**.

### 3. Correo electrónico

Si la confirmación de correo está habilitada, el usuario debe completar el enlace recibido antes de iniciar sesión. Para un entorno de producción se recomienda configurar un proveedor SMTP propio en Supabase.

## Comandos disponibles

```bash
pnpm dev        # Servidor de desarrollo
pnpm build      # Compilación de producción
pnpm start      # Ejecuta la compilación de producción
pnpm typecheck  # Validación de TypeScript
pnpm lint       # Validación de ESLint
```

Antes de desplegar cambios, ejecuta:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Estructura del proyecto

```text
.
├── public/                  # Logo y recursos públicos
├── src/
│   ├── app/                 # Rutas, layouts y endpoints del App Router
│   ├── components/          # Componentes de interfaz y formularios
│   ├── hooks/               # Hooks reutilizables
│   ├── lib/                 # Configuración, utilidades y clientes Supabase
│   ├── services/            # AniList, RanobeDB y traducción
│   └── types/               # Tipos de base de datos y medios
├── supabase/
│   └── migrations/          # Esquema PostgreSQL y políticas RLS
├── .env.example             # Plantilla de variables de entorno
├── next.config.mjs          # Configuración de Next.js
└── vercel.json              # Región y cabeceras de despliegue
```

## Despliegue en Vercel

1. Importa el repositorio como proyecto de Next.js.
2. Añade las variables de `.env.example` en la configuración del proyecto.
3. Establece `NEXT_PUBLIC_SITE_URL` con el dominio definitivo.
4. Añade el callback de producción a las Redirect URLs de Supabase.
5. Ejecuta una compilación y comprueba registro, acceso, actualización de perfil y escritura en la lista.

El archivo `vercel.json` configura la región `gru1` y cabeceras básicas de seguridad.

## Seguridad

- Todas las tablas públicas con datos personales usan RLS.
- Las consultas de usuario están restringidas mediante `auth.uid()`.
- Los avatares aceptan JPEG, PNG y WebP, con un límite de 2 MB.
- Las claves administrativas no deben utilizarse en el navegador.
- Los datos de autorización no dependen de metadatos editables por el usuario.

## Autor

Desarrollado por **Mika-Sonder**.
