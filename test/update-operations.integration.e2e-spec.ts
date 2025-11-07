import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { QueryFailedExceptionFilter } from './../src/filters/query-failed-exception.filter';

describe('Operaciones de Actualización (e2e)', () => {
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

  describe('Actualización de Posts', () => {
    it('debe actualizar un post sin afectar sus comentarios', async () => {
      // Crear usuario y post
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor', email: 'autor@example.com', age: 30 })
        .expect(201);

      const userId = user.body.id;

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Título original',
          content: 'Contenido original',
          published: false,
          authorId: userId,
        })
        .expect(201);

      const postId = post.body.id;

      // Crear comentario
      const comment = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario original',
          authorId: userId,
          postId: postId,
        })
        .expect(201);

      const commentId = comment.body.id;

      // Actualizar el post
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({
          title: 'Título actualizado',
          published: true,
        })
        .expect(200);

      // Verificar que el post se actualizó
      const updatedPost = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(updatedPost.body.title).toBe('Título actualizado');
      expect(updatedPost.body.published).toBe(true);
      expect(updatedPost.body.content).toBe('Contenido original'); // No cambió

      // Verificar que el comentario no cambió
      const unchangedComment = await request(app.getHttpServer())
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(unchangedComment.body.content).toBe('Comentario original');

      // Verificar que la relación sigue intacta
      const postWithComments = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postWithComments.body.comments).toHaveLength(1);
      expect(postWithComments.body.comments[0].id).toBe(commentId);
    });

    it('debe actualizar contenido del post manteniendo las relaciones', async () => {
      // Crear usuario
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Editor', email: 'editor@example.com', age: 28 })
        .expect(201);

      const userId = user.body.id;

      // Crear post
      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Guía de Testing',
          content: 'Contenido inicial',
          published: true,
          authorId: userId,
        })
        .expect(201);

      const postId = post.body.id;

      // Crear varios comentarios
      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 1', authorId: userId, postId })
        .expect(201);

      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 2', authorId: userId, postId })
        .expect(201);

      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 3', authorId: userId, postId })
        .expect(201);

      // Actualizar el contenido del post
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({
          content: 'Contenido completamente actualizado con nueva información',
          title: 'Guía Completa de Testing',
        })
        .expect(200);

      // Verificar cambios
      const updatedPost = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(updatedPost.body.title).toBe('Guía Completa de Testing');
      expect(updatedPost.body.content).toBe(
        'Contenido completamente actualizado con nueva información',
      );
      expect(updatedPost.body.comments).toHaveLength(3);
      expect(updatedPost.body.author.id).toBe(userId);
    });

    it('debe poder publicar y despublicar un post', async () => {
      // Crear usuario y post borrador
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Blogger', email: 'blogger@example.com', age: 26 })
        .expect(201);

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post en Borrador',
          content: 'Contenido del borrador',
          published: false,
          authorId: user.body.id,
        })
        .expect(201);

      const postId = post.body.id;

      // Verificar estado inicial
      let postData = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postData.body.published).toBe(false);

      // Publicar el post
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({ published: true })
        .expect(200);

      postData = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postData.body.published).toBe(true);

      // Despublicar el post
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({ published: false })
        .expect(200);

      postData = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postData.body.published).toBe(false);
    });
  });

  describe('Actualización de Comentarios', () => {
    it('debe actualizar un comentario sin afectar el post', async () => {
      // Crear usuario, post y comentario
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 24 })
        .expect(201);

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post Fijo',
          content: 'Contenido que no cambiará',
          authorId: user.body.id,
        })
        .expect(201);

      const comment = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario original con typo',
          authorId: user.body.id,
          postId: post.body.id,
        })
        .expect(201);

      const commentId = comment.body.id;

      // Actualizar el comentario
      await request(app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .send({
          content: 'Comentario corregido sin typo',
        })
        .expect(200);

      // Verificar que el comentario se actualizó
      const updatedComment = await request(app.getHttpServer())
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(updatedComment.body.content).toBe('Comentario corregido sin typo');

      // Verificar que el post no cambió
      const unchangedPost = await request(app.getHttpServer())
        .get(`/posts/${post.body.id}`)
        .expect(200);

      expect(unchangedPost.body.title).toBe('Post Fijo');
      expect(unchangedPost.body.content).toBe('Contenido que no cambiará');
      expect(unchangedPost.body.comments).toHaveLength(1);
      expect(unchangedPost.body.comments[0].content).toBe('Comentario corregido sin typo');
    });
  });

  describe('Actualización de Usuarios', () => {
    it('debe actualizar un usuario sin afectar sus posts y comentarios', async () => {
      // Crear usuario
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Juan Pérez', email: 'juan@example.com', age: 25 })
        .expect(201);

      const userId = user.body.id;

      // Crear post y comentario
      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Mi Post',
          content: 'Contenido',
          authorId: userId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Mi comentario',
          authorId: userId,
          postId: post.body.id,
        })
        .expect(201);

      // Actualizar usuario
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({
          name: 'Juan Pérez García',
          age: 26,
        })
        .expect(200);

      // Verificar actualización del usuario
      const updatedUser = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(updatedUser.body.name).toBe('Juan Pérez García');
      expect(updatedUser.body.age).toBe(26);
      expect(updatedUser.body.email).toBe('juan@example.com'); // No cambió

      // Verificar que las relaciones se mantienen
      expect(updatedUser.body.posts).toHaveLength(1);
      expect(updatedUser.body.comments).toHaveLength(1);

      // Verificar que el nombre actualizado se refleja en las relaciones
      const postWithAuthor = await request(app.getHttpServer())
        .get(`/posts/${post.body.id}`)
        .expect(200);

      expect(postWithAuthor.body.author.name).toBe('Juan Pérez García');
    });
  });

  describe('Actualizaciones parciales', () => {
    it('debe permitir actualizar solo un campo de un post', async () => {
      // Crear usuario y post
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor', email: 'autor@example.com', age: 30 })
        .expect(201);

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Título Original',
          content: 'Contenido Original',
          published: false,
          authorId: user.body.id,
        })
        .expect(201);

      const postId = post.body.id;

      // Actualizar solo el título
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({ title: 'Nuevo Título' })
        .expect(200);

      const postData = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postData.body.title).toBe('Nuevo Título');
      expect(postData.body.content).toBe('Contenido Original');
      expect(postData.body.published).toBe(false);
    });

    it('debe permitir actualizar múltiples campos simultáneamente', async () => {
      // Crear usuario y post
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 22 })
        .expect(201);

      const userId = user.body.id;

      // Actualizar múltiples campos del usuario
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({
          name: 'Usuario Actualizado',
          age: 23,
          email: 'nuevo@example.com',
        })
        .expect(200);

      const userData = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(userData.body.name).toBe('Usuario Actualizado');
      expect(userData.body.age).toBe(23);
      expect(userData.body.email).toBe('nuevo@example.com');
    });
  });
});
