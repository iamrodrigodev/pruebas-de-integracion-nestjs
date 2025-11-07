import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { QueryFailedExceptionFilter } from './../src/filters/query-failed-exception.filter';

describe('Flujo completo de integración: Usuario → Post → Comentarios (e2e)', () => {
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

  describe('Flujo básico con un usuario', () => {
    it('debe crear usuario, post y comentario, verificando todas las relaciones', async () => {
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
      expect(userResponse.body.name).toBe('Carlos Mendes');
      expect(userResponse.body.email).toBe('carlos@example.com');

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
      expect(postResponse.body.title).toBe('Mi primer post');

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
      expect(commentResponse.body.content).toBe('Excelente post!');

      // 4. Verificar que el post incluye el comentario y el autor
      const postWithRelations = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postWithRelations.body.comments).toHaveLength(1);
      expect(postWithRelations.body.comments[0].content).toBe('Excelente post!');
      expect(postWithRelations.body.author.name).toBe('Carlos Mendes');
      expect(postWithRelations.body.author.email).toBe('carlos@example.com');

      // 5. Verificar que el usuario tiene el post y el comentario
      const userWithRelations = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(userWithRelations.body.posts).toHaveLength(1);
      expect(userWithRelations.body.posts[0].title).toBe('Mi primer post');
      expect(userWithRelations.body.comments).toHaveLength(1);
      expect(userWithRelations.body.comments[0].content).toBe('Excelente post!');
    });
  });

  describe('Flujo con múltiples usuarios interactuando', () => {
    it('debe manejar múltiples usuarios creando posts y comentando', async () => {
      // Crear Usuario 1
      const user1Response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Usuario 1',
          email: 'user1@example.com',
          age: 25,
        })
        .expect(201);

      const user1Id = user1Response.body.id;

      // Crear Usuario 2
      const user2Response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Usuario 2',
          email: 'user2@example.com',
          age: 28,
        })
        .expect(201);

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

      // Verificar el post con todos los comentarios y sus autores
      const postWithComments = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(postWithComments.body.comments).toHaveLength(2);
      expect(postWithComments.body.comments[0].author.name).toBeDefined();
      expect(postWithComments.body.comments[1].author.name).toBeDefined();

      // Verificar que ambos usuarios tienen sus comentarios
      const user1WithData = await request(app.getHttpServer())
        .get(`/users/${user1Id}`)
        .expect(200);

      const user2WithData = await request(app.getHttpServer())
        .get(`/users/${user2Id}`)
        .expect(200);

      expect(user1WithData.body.posts).toHaveLength(1);
      expect(user1WithData.body.comments).toHaveLength(1);
      expect(user2WithData.body.posts).toHaveLength(0);
      expect(user2WithData.body.comments).toHaveLength(1);
    });

    it('debe permitir un usuario crear múltiples posts con múltiples comentarios', async () => {
      // Crear usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Autor Prolífico',
          email: 'autor@example.com',
          age: 35,
        })
        .expect(201);

      const userId = userResponse.body.id;

      // Crear 3 posts
      const post1 = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Primer Post',
          content: 'Contenido del primer post',
          authorId: userId,
        })
        .expect(201);

      const post2 = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Segundo Post',
          content: 'Contenido del segundo post',
          authorId: userId,
        })
        .expect(201);

      const post3 = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Tercer Post',
          content: 'Contenido del tercer post',
          authorId: userId,
        })
        .expect(201);

      // Agregar 2 comentarios a cada post
      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario 1 en Post 1',
          authorId: userId,
          postId: post1.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario 2 en Post 1',
          authorId: userId,
          postId: post1.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario 1 en Post 2',
          authorId: userId,
          postId: post2.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario 2 en Post 2',
          authorId: userId,
          postId: post2.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario 1 en Post 3',
          authorId: userId,
          postId: post3.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Comentario 2 en Post 3',
          authorId: userId,
          postId: post3.body.id,
        })
        .expect(201);

      // Verificar que el usuario tiene todos sus posts y comentarios
      const userWithAllData = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(userWithAllData.body.posts).toHaveLength(3);
      expect(userWithAllData.body.comments).toHaveLength(6);
    });
  });
});
