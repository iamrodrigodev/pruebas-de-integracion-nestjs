<div align="center">
<table>
    <thead>
        <tr>
            <th>
                <img src="https://github.com/RodrigoStranger/imagenes-la-salle/blob/main/logo_secundario_color.png?raw=true" width="150"/>
            </th>
            <th>
                <span style="font-weight:bold;">UNIVERSIDAD LA SALLE DE AREQUIPA</span><br />
                <span style="font-weight:bold;">FACULTAD DE INGENIERÍAS Y ARQUITECTURA</span><br />
                <span style="font-weight:bold;">DEPARTAMENTO ACADEMICO DE INGENIERÍA Y MATEMÁTICAS</span><br />
                <span style="font-weight:bold;">CARRERA PROFESIONAL DE INGENIERÍA DE SOFTWARE</span>
            </th>
        </tr>
    </thead>
</table>
</div>

<div align="center">
  <h2 style="font-weight:bold;">CALIDAD DE SOFTWARE</h2>
</div>

<div align="center">
<table>
    <thead>
        <tr>
            <th><strong>Semestre</strong></th>
            <th><strong>Profesora</strong></th>
            <th><strong>Créditos</strong></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td align="center">2025 II</td>
            <td align="center">Maribel Molina Barriga</td>
            <td align="center">3</td>
        </tr>
    </tbody>
</table>
</div>

---

# Ejemplo de Pruebas de Integración con NestJS

Este proyecto demuestra cómo implementar pruebas de integración en NestJS usando TypeORM con SQLite en memoria.

## Tecnologías Utilizadas

### Stack Principal

[![NestJS][NestJS]][nestjs-site]
[![TypeScript][TypeScript]][typescript-site]
[![Node.js][Nodejs]][nodejs-site]
[![TypeORM][TypeORM]][typeorm-site]
[![SQLite][SQLite]][sqlite-site]

### Tecnologías de Pruebas

[![Jest][Jest]][jest-site]
[![Supertest][Supertest]][supertest-site]
[![Testing Library][TestingLibrary]][testing-library-site]

---

## Descripción

Aplicación de ejemplo que implementa un sistema de blog con usuarios, posts y comentarios. Incluye pruebas de integración completas que demuestran la interacción entre módulos y el uso de base de datos en memoria para testing.

> **Para una guía completa sobre las herramientas y técnicas de testing utilizadas en este proyecto, consulta [TESTING_GUIDE.md](./TESTING_GUIDE.md)**

## Estructura del Proyecto

El proyecto incluye tres módulos interrelacionados:

### Entidades

1. **Users (Usuarios)**
   - Campos: id, name, email, age
   - Relaciones: Tiene muchos Posts y Comments

2. **Posts (Publicaciones)**
   - Campos: id, title, content, published, authorId
   - Relaciones: Pertenece a un User, tiene muchos Comments

3. **Comments (Comentarios)**
   - Campos: id, content, authorId, postId
   - Relaciones: Pertenece a un User y a un Post

## Características de las Pruebas

### Pruebas de Integración entre Módulos (`test/integration.e2e-spec.ts`)

- **Flujo completo de integración**: Crear usuario → Crear post → Agregar comentarios
- **Filtros y consultas relacionadas**: Filtrar posts por autor, comentarios por post, etc.
- **Eliminación en cascada**: Verificar integridad referencial
- **Actualización de entidades**: Actualizar sin afectar relaciones
- **Manejo de errores**: Validar constraints de base de datos

### Resultados de las Pruebas

```
Test Suites: 7 passed, 7 total
Tests:       61 passed, 61 total
```

## Instalación

```bash
npm install
```

## Ejecutar la Aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Ejecutar Pruebas

### Comandos Básicos

```bash
# Ejecutar todas las pruebas de integración
npm run test
npm run test:e2e

# Ver resultados en tiempo real mientras desarrollas
npm run test:watch
npm run test:e2e:watch

# Generar reporte de cobertura de código
npm run test:cov
npm run test:e2e:cov
```

### Comandos de Depuración

```bash
# Modo debug (conectar debugger de VS Code o Chrome DevTools)
npm run test:debug
npm run test:e2e:debug

# Modo verbose (muestra información detallada de cada test)
npm run test:e2e:verbose

# Modo silent (solo muestra errores)
npm run test:e2e:silent
```

### Comandos para CI/CD

```bash
# Detener en el primer test fallido (útil para encontrar errores rápidamente)
npm run test:e2e:bail

# Optimizado para entornos de integración continua
npm run test:e2e:ci
```

## Endpoints Disponibles

### Users
- `POST /users` - Crear usuario
- `GET /users` - Obtener todos los usuarios
- `GET /users/:id` - Obtener usuario por ID
- `PATCH /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

### Posts
- `POST /posts` - Crear post
- `GET /posts` - Obtener todos los posts
- `GET /posts?authorId=:id` - Filtrar posts por autor
- `GET /posts/:id` - Obtener post por ID
- `PATCH /posts/:id` - Actualizar post
- `DELETE /posts/:id` - Eliminar post

### Comments
- `POST /comments` - Crear comentario
- `GET /comments` - Obtener todos los comentarios
- `GET /comments?postId=:id` - Filtrar comentarios por post
- `GET /comments?authorId=:id` - Filtrar comentarios por autor
- `GET /comments/:id` - Obtener comentario por ID
- `PATCH /comments/:id` - Actualizar comentario
- `DELETE /comments/:id` - Eliminar comentario

## Ejemplo de Uso

```bash
# 1. Crear un usuario
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@example.com","age":25}'

# 2. Crear un post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi Post","content":"Contenido","authorId":1}'

# 3. Crear un comentario
curl -X POST http://localhost:3000/comments \
  -H "Content-Type: application/json" \
  -d '{"content":"Gran post!","authorId":1,"postId":1}'

# 4. Obtener post con relaciones
curl http://localhost:3000/posts/1
```

## Aprendizajes Clave

1. **Base de datos en memoria**: SQLite en memoria permite pruebas rápidas y aisladas
2. **Relaciones TypeORM**: OneToMany y ManyToOne con cascada
3. **Pruebas de integración**: Verificar la interacción entre múltiples módulos
4. **Aislamiento de pruebas**: Cada test tiene su propia instancia de la aplicación
5. **Integridad referencial**: Las foreign keys garantizan la consistencia de datos

## Estructura de Archivos

```
src/
├── users/          # Módulo de usuarios
├── posts/          # Módulo de posts
├── comments/       # Módulo de comentarios
└── app.module.ts   # Módulo principal

test/
├── users.e2e-spec.ts                           # Pruebas CRUD de usuarios
├── full-flow.integration.e2e-spec.ts           # Flujo completo User→Post→Comment
├── users-posts.integration.e2e-spec.ts         # Integración Users ↔ Posts
├── posts-comments.integration.e2e-spec.ts      # Integración Posts ↔ Comments
├── cascade-operations.integration.e2e-spec.ts  # Eliminación en cascada
├── update-operations.integration.e2e-spec.ts   # Actualización de entidades
└── error-handling.integration.e2e-spec.ts      # Manejo de errores
```

## Documentación Adicional

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**: Guía completa de testing que explica:
  - Jest y configuración de testing
  - TestingModule de NestJS
  - Supertest para pruebas HTTP
  - SQLite en memoria vs MongoMemoryServer
  - Patrones de testing (AAA, hooks)
  - Mejores prácticas implementadas

- **[SONAR_SETUP.md](./SONAR_SETUP.md)**: Configuración y uso de SonarQube:
  - Prerequisitos y configuración del servidor
  - Ejecución de tests con cobertura
  - Generación de reportes para SonarQube
  - Estructura de directorios de cobertura
  - Troubleshooting y solución de problemas comunes

---

<!-- Referencias de badges -->
[NestJS]: https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white
[nestjs-site]: https://nestjs.com/

[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[typescript-site]: https://www.typescriptlang.org/

[Nodejs]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[nodejs-site]: https://nodejs.org/

[TypeORM]: https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white
[typeorm-site]: https://typeorm.io/

[SQLite]: https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white
[sqlite-site]: https://www.sqlite.org/

[Jest]: https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white
[jest-site]: https://jestjs.io/

[Supertest]: https://img.shields.io/badge/Supertest-07C160?style=for-the-badge&logo=node.js&logoColor=white
[supertest-site]: https://github.com/visionmedia/supertest

[TestingLibrary]: https://img.shields.io/badge/Testing_Library-E33332?style=for-the-badge&logo=testing-library&logoColor=white
[testing-library-site]: https://testing-library.com/
