# CATEP Audit Stream

Gestión CATEP 

Gestión CATEP es una aplicación móvil desarrollada como Producto Mínimo Viable (MVP) con el objetivo de digitalizar, optimizar y centralizar el proceso de auditoría y control diario de espacios y equipos en el Centro de Adiestramiento Técnico Empresas Polar (CATEP) - Turmero.

La aplicación busca reemplazar la gestión tradicional de reportes físicos en papel, ofreciendo una herramienta digital, trazable y en tiempo real para el coordinador del centro.

Descripción del proyecto

CATEP requiere un control constante sobre los recursos y espacios utilizados diariamente por los aprendices: activos de almacén, materiales de papelería, actividades de limpieza y la operatividad de los equipos en las aulas. Tradicionalmente, este seguimiento se realiza mediante formatos físicos en papel, lo que genera pérdida de información, falta de trazabilidad y demoras en la atención de eventualidades.

Gestión CATEP centraliza estos procesos en una sola aplicación, permitiendo:

Registrar y auditar el estado de los activos de forma ágil y estructurada.

Notificar de manera inmediata al coordinador ante cualquier eventualidad detectada.

Contar con un historial digital y trazable de cada inspección.

Funcionalidades principales

Seguimiento de activos de almacén: control de los activos utilizados por los aprendices.

Control de activos de papelería: gestión y seguimiento de materiales en coordinación.

Control de limpieza: seguimiento de las actividades de limpieza de espacios.

Inventario y operatividad de equipos: control del estado y funcionamiento de los equipos en las aulas.

Notificaciones al coordinador: alertas en tiempo real ante cualquier eventualidad reportada.

Formularios dinámicos e interactivos: captura de información estructurada y adaptable según el contexto de la inspección.

Autenticación segura: acceso protegido con encriptación nativa.

Trazabilidad en tiempo real: registro histórico de todas las inspecciones realizadas.

Tecnologías utilizadas

ComponenteTecnologíaFrontend / App móvilFlutterBackend / Base de datosSupabaseSeguridad de datosRow Level Security (RLS)AutenticaciónSupabase Auth con encriptación nativa

Arquitectura

La aplicación sigue una arquitectura cliente-servidor, donde:

Flutter actúa como cliente móvil multiplataforma, encargado de la interfaz de usuario y la lógica de presentación.

Supabase funciona como backend as a service (BaaS), proveyendo base de datos PostgreSQL, autenticación, almacenamiento y APIs en tiempo real.

Las políticas RLS garantizan que cada usuario solo pueda acceder y modificar la información que le corresponde según su rol (aprendiz, coordinador, etc.), sentando una base escalable para la gestión operativa empresarial.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://catep-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/597e50a3-d50b-4be9-81b2-1c814ff6e8b9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
