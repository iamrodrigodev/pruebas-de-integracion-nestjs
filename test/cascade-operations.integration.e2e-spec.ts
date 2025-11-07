import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { QueryFailedExceptionFilter } from './../src/filters/query-failed-exception.filter';

describe('Operaciones en Cascada (e2e)', () => {
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

  describe('Eliminación en cascada: User → Posts → Comments', () => {
    it('debe eliminar posts y comentarios cuando se elimina un usuario', async () => {
      // Crear usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Temporal', email: 'temp@example.com', age: 30 })
        .expect(201);

      const userId = userResponse.body.id;

      // Crear post
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post temporal',
          content: 'Contenido',
          authorId: userId,
        })
        .expect(201);

      const postId = postResponse.body.id;

      // Crear comentario
      const commentResponse = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario temporal',
          authorId: userId,
          postId: postId,
        })
        .expect(201);

      const commentId = commentResponse.body.id;

      // Verificar que todos existen antes de eliminar
      await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);
      await request(app.getHttpServer()).get(`/posts/${postId}`).expect(200);
      await request(app.getHttpServer()).get(`/comments/${commentId}`).expect(200);

      // Eliminar el usuario
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(204);

      // Verificar que el usuario fue eliminado
      await request(app.getHttpServer()).get(`/users/${userId}`).expect(404);

      // Verificar que el post también se eliminó (cascada)
      await request(app.getHttpServer()).get(`/posts/${postId}`).expect(404);

      // Verificar que el comentario también se eliminó (cascada)
      await request(app.getHttpServer())
        .get(`/comments/${commentId}`)
        .expect(404);
    });

    it('debe eliminar múltiples posts y sus comentarios al eliminar un usuario', async () => {
      // Crear usuario
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Prolífico', email: 'prolifico@example.com', age: 35 })
        .expect(201);

      const userId = user.body.id;

      // Crear 3 posts
      const post1 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post 1', content: 'Contenido 1', authorId: userId })
        .expect(201);

      const post2 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post 2', content: 'Contenido 2', authorId: userId })
        .expect(201);

      const post3 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post 3', content: 'Contenido 3', authorId: userId })
        .expect(201);

      // Crear 2 comentarios en cada post
      const comment1 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 1.1', authorId: userId, postId: post1.body.id })
        .expect(201);

      const comment2 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 1.2', authorId: userId, postId: post1.body.id })
        .expect(201);

      const comment3 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 2.1', authorId: userId, postId: post2.body.id })
        .expect(201);

      const comment4 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 2.2', authorId: userId, postId: post2.body.id })
        .expect(201);

      const comment5 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 3.1', authorId: userId, postId: post3.body.id })
        .expect(201);

      const comment6 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 3.2', authorId: userId, postId: post3.body.id })
        .expect(201);

      // Eliminar el usuario
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(204);

      // Verificar que todos los posts fueron eliminados
      await request(app.getHttpServer()).get(`/posts/${post1.body.id}`).expect(404);
      await request(app.getHttpServer()).get(`/posts/${post2.body.id}`).expect(404);
      await request(app.getHttpServer()).get(`/posts/${post3.body.id}`).expect(404);

      // Verificar que todos los comentarios fueron eliminados
      await request(app.getHttpServer()).get(`/comments/${comment1.body.id}`).expect(404);
      await request(app.getHttpServer()).get(`/comments/${comment2.body.id}`).expect(404);
      await request(app.getHttpServer()).get(`/comments/${comment3.body.id}`).expect(404);
      await request(app.getHttpServer()).get(`/comments/${comment4.body.id}`).expect(404);
      await request(app.getHttpServer()).get(`/comments/${comment5.body.id}`).expect(404);
      await request(app.getHttpServer()).get(`/comments/${comment6.body.id}`).expect(404);
    });
  });

  describe('Eliminación en cascada: Post → Comments', () => {
    it('debe eliminar comentarios cuando se elimina un post', async () => {
      // Crear usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 25 })
        .expect(201);

      const userId = userResponse.body.id;

      // Crear post
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post', content: 'Contenido', authorId: userId })
        .expect(201);

      const postId = postResponse.body.id;

      // Crear comentarios
      const comment1 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 1', authorId: userId, postId })
        .expect(201);

      const comment2 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 2', authorId: userId, postId })
        .expect(201);

      const comment1Id = comment1.body.id;
      const comment2Id = comment2.body.id;

      // Eliminar el post
      await request(app.getHttpServer()).delete(`/posts/${postId}`).expect(204);

      // Verificar que el post fue eliminado
      await request(app.getHttpServer()).get(`/posts/${postId}`).expect(404);

      // Verificar que los comentarios se eliminaron
      await request(app.getHttpServer())
        .get(`/comments/${comment1Id}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/comments/${comment2Id}`)
        .expect(404);

      // Verificar que el usuario sigue existiendo
      await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);
    });

    it('debe eliminar solo los comentarios del post eliminado', async () => {
      // Crear usuario
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor', email: 'autor@example.com', age: 30 })
        .expect(201);

      const userId = user.body.id;

      // Crear dos posts
      const post1 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post 1', content: 'Contenido 1', authorId: userId })
        .expect(201);

      const post2 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post 2', content: 'Contenido 2', authorId: userId })
        .expect(201);

      const post1Id = post1.body.id;
      const post2Id = post2.body.id;

      // Crear comentarios en ambos posts
      const comment1InPost1 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario en Post 1', authorId: userId, postId: post1Id })
        .expect(201);

      const comment2InPost1 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Otro comentario en Post 1', authorId: userId, postId: post1Id })
        .expect(201);

      const commentInPost2 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario en Post 2', authorId: userId, postId: post2Id })
        .expect(201);

      // Eliminar solo el Post 1
      await request(app.getHttpServer()).delete(`/posts/${post1Id}`).expect(204);

      // Verificar que Post 1 fue eliminado
      await request(app.getHttpServer()).get(`/posts/${post1Id}`).expect(404);

      // Verificar que los comentarios del Post 1 fueron eliminados
      await request(app.getHttpServer())
        .get(`/comments/${comment1InPost1.body.id}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/comments/${comment2InPost1.body.id}`)
        .expect(404);

      // Verificar que Post 2 y su comentario siguen existiendo
      await request(app.getHttpServer()).get(`/posts/${post2Id}`).expect(200);

      await request(app.getHttpServer())
        .get(`/comments/${commentInPost2.body.id}`)
        .expect(200);
    });
  });

  describe('Preservación de entidades relacionadas', () => {
    it('no debe eliminar posts de otros usuarios al eliminar un usuario', async () => {
      // Crear dos usuarios
      const user1 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario 1', email: 'user1@example.com', age: 25 })
        .expect(201);

      const user2 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario 2', email: 'user2@example.com', age: 28 })
        .expect(201);

      const user1Id = user1.body.id;
      const user2Id = user2.body.id;

      // Cada usuario crea un post
      const post1 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post de Usuario 1', content: 'Contenido', authorId: user1Id })
        .expect(201);

      const post2 = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post de Usuario 2', content: 'Contenido', authorId: user2Id })
        .expect(201);

      // Eliminar Usuario 1
      await request(app.getHttpServer()).delete(`/users/${user1Id}`).expect(204);

      // Verificar que el post de Usuario 1 fue eliminado
      await request(app.getHttpServer()).get(`/posts/${post1.body.id}`).expect(404);

      // Verificar que Usuario 2 y su post siguen existiendo
      await request(app.getHttpServer()).get(`/users/${user2Id}`).expect(200);
      await request(app.getHttpServer()).get(`/posts/${post2.body.id}`).expect(200);
    });

    it('no debe eliminar comentarios de otros usuarios en posts compartidos', async () => {
      // Crear dos usuarios
      const user1 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor', email: 'autor@example.com', age: 30 })
        .expect(201);

      const user2 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Comentarista', email: 'comentarista@example.com', age: 26 })
        .expect(201);

      const user1Id = user1.body.id;
      const user2Id = user2.body.id;

      // Usuario 1 crea un post
      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post Compartido', content: 'Contenido', authorId: user1Id })
        .expect(201);

      const postId = post.body.id;

      // Ambos usuarios comentan en el post
      const commentUser1 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario del autor', authorId: user1Id, postId })
        .expect(201);

      const commentUser2 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario del visitante', authorId: user2Id, postId })
        .expect(201);

      // Eliminar Usuario 2
      await request(app.getHttpServer()).delete(`/users/${user2Id}`).expect(204);

      // Verificar que Usuario 1, el post y su comentario siguen existiendo
      await request(app.getHttpServer()).get(`/users/${user1Id}`).expect(200);
      await request(app.getHttpServer()).get(`/posts/${postId}`).expect(200);
      await request(app.getHttpServer())
        .get(`/comments/${commentUser1.body.id}`)
        .expect(200);

      // Verificar que el comentario de Usuario 2 fue eliminado
      await request(app.getHttpServer())
        .get(`/comments/${commentUser2.body.id}`)
        .expect(404);
    });
  });
});
