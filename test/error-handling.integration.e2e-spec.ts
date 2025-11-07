import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { QueryFailedExceptionFilter } from './../src/filters/query-failed-exception.filter';

describe('Manejo de Errores en Integración (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new QueryFailedExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Violaciones de Foreign Key', () => {
    it('debe retornar error al crear post con usuario inexistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post inválido',
          content: 'Contenido',
          authorId: 9999, // Usuario inexistente
        });

      // TypeORM lanzará un error de constraint
      expect([400, 500]).toContain(response.status);
    });

    it('debe retornar error al crear comentario con post inexistente', async () => {
      // Crear usuario válido
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 25 })
        .expect(201);

      const userId = user.body.id;

      const response = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario inválido',
          authorId: userId,
          postId: 9999, // Post inexistente
        });

      expect([400, 500]).toContain(response.status);
    });

    it('debe retornar error al crear comentario con usuario inexistente', async () => {
      // Crear usuario y post válidos
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor', email: 'autor@example.com', age: 30 })
        .expect(201);

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post válido',
          content: 'Contenido',
          authorId: user.body.id,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario inválido',
          authorId: 8888, // Usuario inexistente
          postId: post.body.id,
        });

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Recursos No Encontrados (404)', () => {
    it('debe retornar 404 al buscar usuario inexistente', async () => {
      await request(app.getHttpServer()).get('/users/9999').expect(404);
    });

    it('debe retornar 404 al buscar post inexistente', async () => {
      await request(app.getHttpServer()).get('/posts/9999').expect(404);
    });

    it('debe retornar 404 al buscar comentario inexistente', async () => {
      await request(app.getHttpServer()).get('/comments/9999').expect(404);
    });

    it('debe retornar 404 al intentar actualizar usuario inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/users/9999')
        .send({ name: 'Nuevo Nombre' })
        .expect(404);
    });

    it('debe retornar 404 al intentar actualizar post inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/posts/9999')
        .send({ title: 'Nuevo Título' })
        .expect(404);
    });

    it('debe retornar 404 al intentar actualizar comentario inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/comments/9999')
        .send({ content: 'Nuevo contenido' })
        .expect(404);
    });

    it('debe retornar 404 al intentar eliminar usuario inexistente', async () => {
      await request(app.getHttpServer()).delete('/users/9999').expect(404);
    });

    it('debe retornar 404 al intentar eliminar post inexistente', async () => {
      await request(app.getHttpServer()).delete('/posts/9999').expect(404);
    });

    it('debe retornar 404 al intentar eliminar comentario inexistente', async () => {
      await request(app.getHttpServer()).delete('/comments/9999').expect(404);
    });
  });

  describe('Consultas con filtros vacíos', () => {
    it('debe retornar array vacío al filtrar posts de usuario sin posts', async () => {
      // Crear usuario sin posts
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Sin Posts', email: 'sinposts@example.com', age: 25 })
        .expect(201);

      const posts = await request(app.getHttpServer())
        .get(`/posts?authorId=${user.body.id}`)
        .expect(200);

      expect(posts.body).toHaveLength(0);
    });

    it('debe retornar array vacío al filtrar comentarios de post sin comentarios', async () => {
      // Crear usuario y post sin comentarios
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 25 })
        .expect(201);

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post Sin Comentarios',
          content: 'Contenido',
          authorId: user.body.id,
        })
        .expect(201);

      const comments = await request(app.getHttpServer())
        .get(`/comments?postId=${post.body.id}`)
        .expect(200);

      expect(comments.body).toHaveLength(0);
    });

    it('debe retornar array vacío al filtrar comentarios de usuario sin comentarios', async () => {
      // Crear usuario sin comentarios
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Silencioso', email: 'silencioso@example.com', age: 28 })
        .expect(201);

      const comments = await request(app.getHttpServer())
        .get(`/comments?authorId=${user.body.id}`)
        .expect(200);

      expect(comments.body).toHaveLength(0);
    });

    it('debe retornar array vacío cuando no hay posts', async () => {
      const posts = await request(app.getHttpServer()).get('/posts').expect(200);

      expect(Array.isArray(posts.body)).toBe(true);
      expect(posts.body).toHaveLength(0);
    });

    it('debe retornar array vacío cuando no hay usuarios', async () => {
      const users = await request(app.getHttpServer()).get('/users').expect(200);

      expect(Array.isArray(users.body)).toBe(true);
      expect(users.body).toHaveLength(0);
    });

    it('debe retornar array vacío cuando no hay comentarios', async () => {
      const comments = await request(app.getHttpServer()).get('/comments').expect(200);

      expect(Array.isArray(comments.body)).toBe(true);
      expect(comments.body).toHaveLength(0);
    });
  });

  describe('Integridad de datos después de errores', () => {
    it('no debe crear post si falla la creación debido a foreign key', async () => {
      // Intentar crear post con usuario inexistente
      const response = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post Fallido',
          content: 'Este post no debería crearse',
          authorId: 7777,
        });

      expect([400, 500]).toContain(response.status);

      // Verificar que no se crearon posts
      const allPosts = await request(app.getHttpServer()).get('/posts').expect(200);

      expect(allPosts.body).toHaveLength(0);
    });

    it('no debe crear comentario si falla la creación', async () => {
      // Crear usuario válido
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 25 })
        .expect(201);

      // Intentar crear comentario con post inexistente
      const response = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario Fallido',
          authorId: user.body.id,
          postId: 6666,
        });

      expect([400, 500]).toContain(response.status);

      // Verificar que no se crearon comentarios
      const allComments = await request(app.getHttpServer()).get('/comments').expect(200);

      expect(allComments.body).toHaveLength(0);
    });

    it('debe mantener datos existentes si una actualización falla', async () => {
      // Crear usuario
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Original', email: 'original@example.com', age: 25 })
        .expect(201);

      const userId = user.body.id;

      // Intentar actualizar usuario inexistente
      await request(app.getHttpServer())
        .patch('/users/9999')
        .send({ name: 'No Debería Cambiar' })
        .expect(404);

      // Verificar que el usuario original no fue afectado
      const unchangedUser = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(unchangedUser.body.name).toBe('Usuario Original');
      expect(unchangedUser.body.email).toBe('original@example.com');
    });
  });

  describe('Casos límite', () => {
    it('debe manejar consultas con IDs de diferentes tipos', async () => {
      // IDs que no son números válidos deberían retornar error (404 o 500)
      const response1 = await request(app.getHttpServer()).get('/users/abc');
      expect([404, 500]).toContain(response1.status);

      const response2 = await request(app.getHttpServer()).get('/posts/xyz');
      expect([404, 500]).toContain(response2.status);

      const response3 = await request(app.getHttpServer()).get('/comments/invalid');
      expect([404, 500]).toContain(response3.status);
    });

    it('debe manejar eliminaciones múltiples del mismo recurso', async () => {
      // Crear y eliminar usuario
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Temporal', email: 'temp@example.com', age: 30 })
        .expect(201);

      const userId = user.body.id;

      // Primera eliminación (exitosa)
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(204);

      // Segunda eliminación (debería fallar con 404)
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(404);
    });
  });
});
