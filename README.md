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

## Descripción

Aplicación de ejemplo que implementa un sistema de blog con usuarios, posts y comentarios. Incluye pruebas de integración completas que demuestran la interacción entre módulos y el uso de base de datos en memoria para testing.

> **📖 Para una guía completa sobre las herramientas y técnicas de testing utilizadas en este proyecto, consulta [TESTING_GUIDE.md](./TESTING_GUIDE.md)**

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
Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
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

```bash
# Pruebas e2e
npm run test:e2e

# Pruebas unitarias
npm run test

# Cobertura
npm run test:cov
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

## Tecnologías Utilizadas

- **NestJS**: Framework para aplicaciones del lado del servidor
- **TypeORM**: ORM para TypeScript
- **SQLite**: Base de datos en memoria para pruebas
- **Jest**: Framework de testing
- **Supertest**: Librería para probar endpoints HTTP

> **ℹ️ Más detalles sobre cada herramienta en [TESTING_GUIDE.md](./TESTING_GUIDE.md)**

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
├── app.e2e-spec.ts          # Pruebas básicas
├── users.e2e-spec.ts        # Pruebas de usuarios
└── integration.e2e-spec.ts  # Pruebas de integración
```

## Documentación Adicional

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**: Guía completa de testing que explica:
  - Jest y configuración de testing
  - TestingModule de NestJS
  - Supertest para pruebas HTTP
  - SQLite en memoria vs MongoMemoryServer
  - Patrones de testing (AAA, hooks)
  - Mejores prácticas implementadas
