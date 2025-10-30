# Guía de Pruebas de Integración

Este documento explica las herramientas y técnicas utilizadas en las pruebas de integración de este proyecto.

## Herramientas Utilizadas

### 1. Jest - Framework de Testing

**Configuración**: `package.json:57-73` y `test/jest-e2e.json`

Jest es el framework de testing integrado por defecto en NestJS. Proporciona:

- **Test runner**: Ejecuta las pruebas automáticamente
- **Assertions**: Funciones como `expect()`, `toBe()`, `toHaveLength()`
- **Mocking**: Capacidades para simular módulos y dependencias
- **Coverage**: Reportes de cobertura de código

**Ejemplo en el proyecto**:
```typescript
// test/integration.e2e-spec.ts:19
it('debe crear un usuario, publicar un post y agregar comentarios', async () => {
  const userResponse = await request(app.getHttpServer())
    .post('/users')
    .send({ name: 'Carlos', email: 'carlos@example.com', age: 30 })
    .expect(201);

  expect(userResponse.body.id).toBeDefined();
});
```

**Scripts disponibles**:
```bash
npm run test          # Pruebas unitarias
npm run test:e2e      # Pruebas de integración
npm run test:cov      # Cobertura de código
npm run test:watch    # Modo watch
```

---

### 2. TestingModule (NestJS Testing)

**Paquete**: `@nestjs/testing` (instalado en `package.json:37`)

TestingModule permite crear instancias de módulos de NestJS para pruebas, incluyendo todos sus controladores, servicios y dependencias.

**Ejemplo en el proyecto**:
```typescript
// test/integration.e2e-spec.ts:10-16
beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule], // Importa el módulo completo con todas sus dependencias
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
});
```

**Capacidades**:
- Crear módulos reales con todas las dependencias
- Sobrescribir providers para testing (mocking)
- Compilar módulos con configuración específica
- Acceder a servicios y repositorios directamente

**Ejemplo de override (si fuera necesario)**:
```typescript
const moduleFixture: TestingModule = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(UsersService)
  .useValue(mockUsersService) // Mock del servicio
  .compile();
```

---

### 3. Supertest - Testing de HTTP

**Paquete**: `supertest` (instalado en `package.json:49`)

Supertest permite realizar peticiones HTTP reales a la aplicación sin necesidad de levantar un servidor externo.

**Ejemplo en el proyecto**:
```typescript
// test/integration.e2e-spec.ts:20-25
const userResponse = await request(app.getHttpServer())
  .post('/users')                    // Método HTTP y ruta
  .send({ name: 'Carlos', ... })     // Body de la petición
  .expect(201);                      // Código HTTP esperado

expect(userResponse.body.id).toBeDefined(); // Validar respuesta
```

**Características utilizadas**:
- **Métodos HTTP**: `.get()`, `.post()`, `.patch()`, `.delete()`
- **Headers**: `.set('Authorization', 'Bearer token')`
- **Body**: `.send({ ... })`
- **Query params**: `.query({ authorId: 1 })` o en la URL directamente
- **Assertions**: `.expect(200)`, `.expect('Content-Type', /json/)`

**Ejemplos del proyecto**:

1. **GET con filtros**:
```typescript
// test/integration.e2e-spec.ts:193-198
const user1Posts = await request(app.getHttpServer())
  .get(`/posts?authorId=${user1Id}`)  // Query params
  .expect(200);

expect(user1Posts.body).toHaveLength(2);
```

2. **POST con validación**:
```typescript
// test/integration.e2e-spec.ts:26-28
const postResponse = await request(app.getHttpServer())
  .post('/posts')
  .send({
    title: 'Mi primer post',
    content: 'Contenido',
    authorId: userId,
  })
  .expect(201);
```

3. **DELETE sin contenido**:
```typescript
// test/integration.e2e-spec.ts:291
await request(app.getHttpServer())
  .delete(`/users/${userId}`)
  .expect(204);  // No content
```

---

### 4. SQLite en Memoria - Base de Datos para Testing

**Paquetes**: `sqlite3` y `typeorm` (instalados en `package.json:29-30`)

SQLite en memoria (`:memory:`) proporciona una base de datos real pero temporal que se crea y destruye en cada prueba.

**Configuración en el proyecto**:
```typescript
// src/app.module.ts:14-19
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',        // Base de datos en memoria
  entities: [User, Post, Comment],
  synchronize: true,           // Crea las tablas automáticamente
})
```

**Ventajas**:
- ✅ Base de datos real (no mock)
- ✅ Velocidad: Todo en RAM
- ✅ Aislamiento: Cada test tiene su propia BD
- ✅ Sin configuración externa
- ✅ Valida relaciones, constraints y queries reales

**Características probadas**:

1. **Relaciones reales**:
```typescript
// test/integration.e2e-spec.ts:58-62
const postWithComments = await request(app.getHttpServer())
  .get(`/posts/${postId}`)
  .expect(200);

expect(postWithComments.body.comments).toHaveLength(1);
expect(postWithComments.body.author.name).toBe('Carlos Mendes');
```

2. **Foreign key constraints**:
```typescript
// test/integration.e2e-spec.ts:406-415
const response = await request(app.getHttpServer())
  .post('/posts')
  .send({
    title: 'Post inválido',
    content: 'Contenido',
    authorId: 9999,  // Usuario inexistente
  });

expect([400, 500]).toContain(response.status); // Error de constraint
```

3. **Eliminación en cascada**:
```typescript
// test/integration.e2e-spec.ts:287-299
await request(app.getHttpServer())
  .delete(`/users/${userId}`)
  .expect(204);

// Verificar que el post y comentarios también se eliminaron
await request(app.getHttpServer()).get(`/posts/${postId}`).expect(404);
await request(app.getHttpServer()).get(`/comments/${commentId}`).expect(404);
```

---

## Comparación: SQLite vs MongoMemoryServer

Este proyecto usa **SQLite**, pero también existe **MongoMemoryServer** para MongoDB:

| Característica | SQLite (usado aquí) | MongoMemoryServer |
|----------------|---------------------|-------------------|
| Tipo de BD | SQL relacional | NoSQL documentos |
| Instalación | `sqlite3` | `mongodb-memory-server` |
| Relaciones | Sí (foreign keys) | No nativas |
| Configuración | Muy simple | Un poco más compleja |
| Velocidad | Muy rápido | Rápido |
| Caso de uso | Apps con TypeORM/SQL | Apps con Mongoose/MongoDB |

**Configuración con MongoMemoryServer** (alternativa):
```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  const moduleFixture = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(uri),
      AppModule,
    ],
  }).compile();
});

afterAll(async () => {
  await mongod.stop();
});
```

---

## Estructura de una Prueba de Integración

### Patrón AAA (Arrange-Act-Assert)

```typescript
it('debe crear un usuario, post y comentario', async () => {
  // ARRANGE - Preparar datos y contexto
  const userData = {
    name: 'Juan',
    email: 'juan@example.com',
    age: 25
  };

  // ACT - Ejecutar la acción
  const userResponse = await request(app.getHttpServer())
    .post('/users')
    .send(userData)
    .expect(201);

  // ASSERT - Verificar resultados
  expect(userResponse.body.id).toBeDefined();
  expect(userResponse.body.name).toBe(userData.name);
});
```

### Hooks de ciclo de vida

```typescript
// Se ejecuta una vez antes de todas las pruebas
beforeAll(async () => {
  // Configuración global
});

// Se ejecuta antes de cada prueba
beforeEach(async () => {
  // Crear nueva instancia de la app
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
});

// Se ejecuta después de cada prueba
afterEach(async () => {
  await app.close(); // Limpiar recursos
});

// Se ejecuta una vez después de todas las pruebas
afterAll(async () => {
  // Limpieza final
});
```

---

## Tipos de Pruebas en el Proyecto

### 1. Pruebas CRUD individuales
**Archivo**: `test/users.e2e-spec.ts`

Prueban operaciones básicas de un módulo:
- Crear entidades
- Leer todas y por ID
- Actualizar entidades
- Eliminar entidades

### 2. Pruebas de integración entre módulos
**Archivo**: `test/integration.e2e-spec.ts`

Prueban interacciones complejas:
- Flujos completos (usuario → post → comentario)
- Relaciones entre entidades
- Filtros y queries complejas
- Eliminación en cascada
- Integridad referencial

### 3. Pruebas de casos de error
```typescript
// test/integration.e2e-spec.ts:406-415
it('debe retornar error al crear post con usuario inexistente', async () => {
  const response = await request(app.getHttpServer())
    .post('/posts')
    .send({
      title: 'Post inválido',
      content: 'Contenido',
      authorId: 9999,
    });

  expect([400, 500]).toContain(response.status);
});
```

---

## Mejores Prácticas Implementadas

### 1. Aislamiento de pruebas
Cada prueba crea su propia instancia de la aplicación en `beforeEach`:
```typescript
beforeEach(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
});
```

### 2. Limpieza de recursos
```typescript
afterEach(async () => {
  await app.close();
});
```

### 3. Descriptores claros
```typescript
describe('Integración entre módulos (e2e)', () => {
  describe('Flujo completo: Usuario → Post → Comentarios', () => {
    it('debe crear un usuario, publicar un post y agregar comentarios', async () => {
      // ...
    });
  });
});
```

### 4. Assertions específicas
```typescript
// Mal ❌
expect(response.status).toBe(200);

// Bien ✅
await request(app.getHttpServer())
  .get('/users')
  .expect(200)
  .expect((res) => {
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBeDefined();
  });
```

---

## Ejecutar las Pruebas

```bash
# Todas las pruebas e2e
npm run test:e2e

# Con coverage
npm run test:cov

# Modo watch (re-ejecuta al guardar)
npm run test:watch

# Debug
npm run test:debug
```

## Resultado Esperado

```
Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        2.908 s
```

---

## Recursos Adicionales

- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/example-with-express)
