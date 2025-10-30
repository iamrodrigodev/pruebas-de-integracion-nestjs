import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Integración Posts ↔ Comments (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Relación Post → Comments', () => {
    it('debe crear un comentario asociado a un post', async () => {
      // Crear usuario y post
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 25 })
        .expect(201);

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post con Comentarios',
          content: 'Contenido',
          authorId: user.body.id,
        })
        .expect(201);

      // Crear comentario
      const comment = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Excelente artículo!',
          authorId: user.body.id,
          postId: post.body.id,
        })
        .expect(201);

      expect(comment.body.postId).toBe(post.body.id);
      expect(comment.body.content).toBe('Excelente artículo!');

      // Verificar que el comentario tiene referencia al post
      const commentData = await request(app.getHttpServer())
        .get(`/comments/${comment.body.id}`)
        .expect(200);

      expect(commentData.body.post).toBeDefined();
      expect(commentData.body.post.title).toBe('Post con Comentarios');
    });

    it('debe obtener todos los comentarios de un post', async () => {
      // Crear usuario y post
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Test', email: 'test@example.com', age: 25 });

      const userId = user.body.id;

      const post1 = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post 1',
          content: 'Contenido 1',
          authorId: userId,
        });

      const post2 = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post 2',
          content: 'Contenido 2',
          authorId: userId,
        });

      const post1Id = post1.body.id;
      const post2Id = post2.body.id;

      // Crear comentarios en el Post 1
      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 1 en Post 1', authorId: userId, postId: post1Id });

      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 2 en Post 1', authorId: userId, postId: post1Id });

      // Crear comentario en el Post 2
      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario en Post 2', authorId: userId, postId: post2Id });

      // Filtrar comentarios del Post 1
      const post1Comments = await request(app.getHttpServer())
        .get(`/comments?postId=${post1Id}`)
        .expect(200);

      expect(post1Comments.body).toHaveLength(2);
      expect(post1Comments.body.every((c) => c.postId === post1Id)).toBe(true);

      // Filtrar comentarios del Post 2
      const post2Comments = await request(app.getHttpServer())
        .get(`/comments?postId=${post2Id}`)
        .expect(200);

      expect(post2Comments.body).toHaveLength(1);
      expect(post2Comments.body[0].postId).toBe(post2Id);
    });

    it('debe obtener un post con todos sus comentarios', async () => {
      // Crear usuario y post
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor', email: 'autor@example.com', age: 30 });

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post Popular',
          content: 'Contenido interesante',
          authorId: user.body.id,
        });

      const postId = post.body.id;
      const userId = user.body.id;

      // Crear múltiples comentarios
      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Primer comentario',
          authorId: userId,
          postId: postId,
        });

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Segundo comentario',
          authorId: userId,
          postId: postId,
        });

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Tercer comentario',
          authorId: userId,
          postId: postId,
        });

      // Obtener post con sus comentarios
      const postWithComments = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postWithComments.body.comments).toBeDefined();
      expect(postWithComments.body.comments).toHaveLength(3);
      expect(postWithComments.body.comments[0].content).toBe('Primer comentario');
      expect(postWithComments.body.comments[1].content).toBe('Segundo comentario');
      expect(postWithComments.body.comments[2].content).toBe('Tercer comentario');
    });
  });

  describe('Comentarios de múltiples usuarios', () => {
    it('debe permitir múltiples usuarios comentar en el mismo post', async () => {
      // Crear dos usuarios
      const user1 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Comentarista 1', email: 'com1@example.com', age: 22 });

      const user2 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Comentarista 2', email: 'com2@example.com', age: 24 });

      const user1Id = user1.body.id;
      const user2Id = user2.body.id;

      // Crear un post del usuario 1
      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post', content: 'Contenido', authorId: user1Id });

      const postId = post.body.id;

      // Ambos usuarios comentan
      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario de usuario 1', authorId: user1Id, postId });

      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario de usuario 2', authorId: user2Id, postId });

      // Obtener post con comentarios
      const postWithComments = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postWithComments.body.comments).toHaveLength(2);
      expect(postWithComments.body.comments[0].author.name).toBe('Comentarista 1');
      expect(postWithComments.body.comments[1].author.name).toBe('Comentarista 2');

      // Filtrar comentarios del usuario 1
      const user1Comments = await request(app.getHttpServer())
        .get(`/comments?authorId=${user1Id}`)
        .expect(200);

      expect(user1Comments.body).toHaveLength(1);
      expect(user1Comments.body[0].authorId).toBe(user1Id);

      // Filtrar comentarios del usuario 2
      const user2Comments = await request(app.getHttpServer())
        .get(`/comments?authorId=${user2Id}`)
        .expect(200);

      expect(user2Comments.body).toHaveLength(1);
      expect(user2Comments.body[0].authorId).toBe(user2Id);
    });

    it('debe mantener la integridad de comentarios al filtrar por autor', async () => {
      // Crear usuarios
      const user1 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Activo', email: 'activo@example.com', age: 28 });

      const user2 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Ocasional', email: 'ocasional@example.com', age: 26 });

      const user1Id = user1.body.id;
      const user2Id = user2.body.id;

      // Crear posts
      const post1 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post A', content: 'Contenido A', authorId: user1Id });

      const post2 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post B', content: 'Contenido B', authorId: user2Id });

      // Usuario 1 comenta en ambos posts
      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Usuario 1 comenta en Post A',
          authorId: user1Id,
          postId: post1.body.id,
        });

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Usuario 1 comenta en Post B',
          authorId: user1Id,
          postId: post2.body.id,
        });

      // Usuario 2 solo comenta en su post
      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Usuario 2 comenta en Post B',
          authorId: user2Id,
          postId: post2.body.id,
        });

      // Verificar comentarios del usuario 1 (debería tener 2)
      const user1Comments = await request(app.getHttpServer())
        .get(`/comments?authorId=${user1Id}`)
        .expect(200);

      expect(user1Comments.body).toHaveLength(2);

      // Verificar comentarios del usuario 2 (debería tener 1)
      const user2Comments = await request(app.getHttpServer())
        .get(`/comments?authorId=${user2Id}`)
        .expect(200);

      expect(user2Comments.body).toHaveLength(1);

      // Verificar comentarios en Post B (debería tener 2)
      const postBComments = await request(app.getHttpServer())
        .get(`/comments?postId=${post2.body.id}`)
        .expect(200);

      expect(postBComments.body).toHaveLength(2);
    });
  });

  describe('Posts sin comentarios', () => {
    it('debe manejar posts sin comentarios correctamente', async () => {
      // Crear usuario y post
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 25 });

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post Sin Comentarios',
          content: 'Nadie ha comentado aún',
          authorId: user.body.id,
        });

      // Obtener post (debería tener array vacío de comentarios)
      const postData = await request(app.getHttpServer())
        .get(`/posts/${post.body.id}`)
        .expect(200);

      expect(postData.body.comments).toBeDefined();
      expect(postData.body.comments).toHaveLength(0);

      // Filtrar comentarios por ese post (debería retornar array vacío)
      const comments = await request(app.getHttpServer())
        .get(`/comments?postId=${post.body.id}`)
        .expect(200);

      expect(comments.body).toHaveLength(0);
    });
  });
});
