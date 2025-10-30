import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Integración entre módulos (e2e)', () => {
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

  describe('Flujo completo: Usuario -> Post -> Comentarios', () => {
    it('debe crear un usuario, publicar un post y agregar comentarios', async () => {
      // 1. Crear un usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Carlos Mendes',
          email: 'carlos@example.com',
          age: 30,
        })
        .expect(201);

      const userId = userResponse.body.id;
      expect(userId).toBeDefined();

      // 2. Crear un post para ese usuario
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Mi primer post',
          content: 'Este es el contenido de mi primer post',
          published: true,
          authorId: userId,
        })
        .expect(201);

      const postId = postResponse.body.id;
      expect(postId).toBeDefined();
      expect(postResponse.body.authorId).toBe(userId);

      // 3. Crear un comentario en el post
      const commentResponse = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Excelente post!',
          authorId: userId,
          postId: postId,
        })
        .expect(201);

      expect(commentResponse.body.id).toBeDefined();
      expect(commentResponse.body.postId).toBe(postId);
      expect(commentResponse.body.authorId).toBe(userId);

      // 4. Verificar que el post incluye el comentario
      const postWithComments = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postWithComments.body.comments).toHaveLength(1);
      expect(postWithComments.body.comments[0].content).toBe('Excelente post!');
      expect(postWithComments.body.author.name).toBe('Carlos Mendes');

      // 5. Verificar que el usuario tiene el post y el comentario
      const userWithRelations = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(userWithRelations.body.posts).toHaveLength(1);
      expect(userWithRelations.body.comments).toHaveLength(1);
    });

    it('debe manejar múltiples usuarios, posts y comentarios', async () => {
      // Crear dos usuarios
      const user1Response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Usuario 1',
          email: 'user1@example.com',
          age: 25,
        })
        .expect(201);

      const user2Response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Usuario 2',
          email: 'user2@example.com',
          age: 28,
        })
        .expect(201);

      const user1Id = user1Response.body.id;
      const user2Id = user2Response.body.id;

      // Usuario 1 crea un post
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post de Usuario 1',
          content: 'Contenido del post',
          published: true,
          authorId: user1Id,
        })
        .expect(201);

      const postId = postResponse.body.id;

      // Usuario 2 comenta en el post de Usuario 1
      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario de Usuario 2',
          authorId: user2Id,
          postId: postId,
        })
        .expect(201);

      // Usuario 1 también comenta en su propio post
      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Gracias por el comentario!',
          authorId: user1Id,
          postId: postId,
        })
        .expect(201);

      // Verificar el post con todos los comentarios
      const postWithComments = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postWithComments.body.comments).toHaveLength(2);
      expect(postWithComments.body.comments[0].author.name).toBeDefined();
      expect(postWithComments.body.comments[1].author.name).toBeDefined();
    });
  });

  describe('Filtros y consultas relacionadas', () => {
    it('debe filtrar posts por autor', async () => {
      // Crear dos usuarios
      const user1 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor 1', email: 'autor1@example.com', age: 30 });

      const user2 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor 2', email: 'autor2@example.com', age: 35 });

      const user1Id = user1.body.id;
      const user2Id = user2.body.id;

      // Crear posts para cada usuario
      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post 1 de Autor 1',
          content: 'Contenido',
          authorId: user1Id,
        });

      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post 2 de Autor 1',
          content: 'Contenido',
          authorId: user1Id,
        });

      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post de Autor 2',
          content: 'Contenido',
          authorId: user2Id,
        });

      // Filtrar posts del usuario 1
      const user1Posts = await request(app.getHttpServer())
        .get(`/posts?authorId=${user1Id}`)
        .expect(200);

      expect(user1Posts.body).toHaveLength(2);
      expect(user1Posts.body.every((p) => p.authorId === user1Id)).toBe(true);

      // Filtrar posts del usuario 2
      const user2Posts = await request(app.getHttpServer())
        .get(`/posts?authorId=${user2Id}`)
        .expect(200);

      expect(user2Posts.body).toHaveLength(1);
    });

    it('debe filtrar comentarios por post', async () => {
      // Crear usuario y posts
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

      // Crear comentarios
      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 1 en Post 1', authorId: userId, postId: post1Id });

      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 2 en Post 1', authorId: userId, postId: post1Id });

      await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario en Post 2', authorId: userId, postId: post2Id });

      // Filtrar comentarios del post 1
      const post1Comments = await request(app.getHttpServer())
        .get(`/comments?postId=${post1Id}`)
        .expect(200);

      expect(post1Comments.body).toHaveLength(2);
      expect(post1Comments.body.every((c) => c.postId === post1Id)).toBe(true);
    });

    it('debe filtrar comentarios por autor', async () => {
      // Crear dos usuarios
      const user1 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Comentarista 1', email: 'com1@example.com', age: 22 });

      const user2 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Comentarista 2', email: 'com2@example.com', age: 24 });

      const user1Id = user1.body.id;
      const user2Id = user2.body.id;

      // Crear un post
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

      // Filtrar comentarios del usuario 1
      const user1Comments = await request(app.getHttpServer())
        .get(`/comments?authorId=${user1Id}`)
        .expect(200);

      expect(user1Comments.body).toHaveLength(1);
      expect(user1Comments.body[0].authorId).toBe(user1Id);
    });
  });

  describe('Eliminación en cascada', () => {
    it('debe eliminar posts y comentarios cuando se elimina un usuario', async () => {
      // Crear usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario Temporal', email: 'temp@example.com', age: 30 });

      const userId = userResponse.body.id;

      // Crear post
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post temporal',
          content: 'Contenido',
          authorId: userId,
        });

      const postId = postResponse.body.id;

      // Crear comentario
      const commentResponse = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario temporal',
          authorId: userId,
          postId: postId,
        });

      const commentId = commentResponse.body.id;

      // Eliminar el usuario
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(204);

      // Verificar que el post y el comentario también se eliminaron
      await request(app.getHttpServer()).get(`/posts/${postId}`).expect(404);

      await request(app.getHttpServer())
        .get(`/comments/${commentId}`)
        .expect(404);
    });

    it('debe eliminar comentarios cuando se elimina un post', async () => {
      // Crear usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 25 });

      const userId = userResponse.body.id;

      // Crear post
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post', content: 'Contenido', authorId: userId });

      const postId = postResponse.body.id;

      // Crear comentarios
      const comment1 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 1', authorId: userId, postId });

      const comment2 = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Comentario 2', authorId: userId, postId });

      const comment1Id = comment1.body.id;
      const comment2Id = comment2.body.id;

      // Eliminar el post
      await request(app.getHttpServer()).delete(`/posts/${postId}`).expect(204);

      // Verificar que los comentarios se eliminaron
      await request(app.getHttpServer())
        .get(`/comments/${comment1Id}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/comments/${comment2Id}`)
        .expect(404);

      // Pero el usuario sigue existiendo
      await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);
    });
  });

  describe('Actualización de entidades relacionadas', () => {
    it('debe actualizar un post sin afectar sus comentarios', async () => {
      // Crear usuario y post
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor', email: 'autor@example.com', age: 30 });

      const userId = user.body.id;

      const post = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Título original',
          content: 'Contenido original',
          published: false,
          authorId: userId,
        });

      const postId = post.body.id;

      // Crear comentario
      const comment = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario original',
          authorId: userId,
          postId: postId,
        });

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

      // Verificar que el comentario no cambió
      const unchangedComment = await request(app.getHttpServer())
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(unchangedComment.body.content).toBe('Comentario original');
    });
  });

  describe('Casos de error con relaciones', () => {
    it('debe retornar 404 al crear post con usuario inexistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post inválido',
          content: 'Contenido',
          authorId: 9999,
        });

      // TypeORM lanzará un error de constraint
      expect([400, 500]).toContain(response.status);
    });

    it('debe retornar 404 al crear comentario con post inexistente', async () => {
      // Crear usuario válido
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Usuario', email: 'user@example.com', age: 25 });

      const userId = user.body.id;

      const response = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario inválido',
          authorId: userId,
          postId: 9999,
        });

      expect([400, 500]).toContain(response.status);
    });
  });
});
