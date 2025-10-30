import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Integración Users ↔ Posts (e2e)', () => {
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

  describe('Relación User → Posts', () => {
    it('debe crear un post asociado a un usuario', async () => {
      // Crear usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Autor de Posts',
          email: 'autor@example.com',
          age: 28,
        })
        .expect(201);

      const userId = userResponse.body.id;

      // Crear post para ese usuario
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Mi Post',
          content: 'Contenido del post',
          published: true,
          authorId: userId,
        })
        .expect(201);

      expect(postResponse.body.authorId).toBe(userId);
      expect(postResponse.body.title).toBe('Mi Post');

      // Verificar que el post tiene la referencia al autor
      const post = await request(app.getHttpServer())
        .get(`/posts/${postResponse.body.id}`)
        .expect(200);

      expect(post.body.author).toBeDefined();
      expect(post.body.author.name).toBe('Autor de Posts');
      expect(post.body.author.email).toBe('autor@example.com');
    });

    it('debe obtener todos los posts de un usuario específico', async () => {
      // Crear dos usuarios
      const user1 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor 1', email: 'autor1@example.com', age: 30 });

      const user2 = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Autor 2', email: 'autor2@example.com', age: 35 });

      const user1Id = user1.body.id;
      const user2Id = user2.body.id;

      // Crear posts para el usuario 1
      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post 1 de Autor 1',
          content: 'Contenido',
          authorId: user1Id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post 2 de Autor 1',
          content: 'Contenido',
          authorId: user1Id,
        })
        .expect(201);

      // Crear post para el usuario 2
      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post de Autor 2',
          content: 'Contenido',
          authorId: user2Id,
        })
        .expect(201);

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
      expect(user2Posts.body[0].authorId).toBe(user2Id);
    });

    it('debe obtener un usuario con todos sus posts', async () => {
      // Crear usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Escritor',
          email: 'escritor@example.com',
          age: 32,
        })
        .expect(201);

      const userId = userResponse.body.id;

      // Crear múltiples posts
      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Primer Post',
          content: 'Contenido 1',
          published: true,
          authorId: userId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Segundo Post',
          content: 'Contenido 2',
          published: false,
          authorId: userId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Tercer Post',
          content: 'Contenido 3',
          published: true,
          authorId: userId,
        })
        .expect(201);

      // Obtener usuario con sus posts
      const userWithPosts = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(userWithPosts.body.posts).toBeDefined();
      expect(userWithPosts.body.posts).toHaveLength(3);
      expect(userWithPosts.body.posts[0].title).toBe('Primer Post');
      expect(userWithPosts.body.posts[1].published).toBe(false);
      expect(userWithPosts.body.posts[2].title).toBe('Tercer Post');
    });
  });

  describe('Consultas avanzadas', () => {
    it('debe manejar usuarios sin posts', async () => {
      // Crear usuario sin posts
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Usuario Sin Posts',
          email: 'sinposts@example.com',
          age: 25,
        })
        .expect(201);

      const userId = userResponse.body.id;

      // Obtener usuario (debería tener array vacío de posts)
      const user = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(user.body.posts).toBeDefined();
      expect(user.body.posts).toHaveLength(0);

      // Filtrar posts por ese usuario (debería retornar array vacío)
      const posts = await request(app.getHttpServer())
        .get(`/posts?authorId=${userId}`)
        .expect(200);

      expect(posts.body).toHaveLength(0);
    });

    it('debe distinguir entre posts publicados y no publicados', async () => {
      // Crear usuario
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Autor',
          email: 'autor@example.com',
          age: 30,
        })
        .expect(201);

      const userId = userResponse.body.id;

      // Crear post publicado
      const publishedPost = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post Publicado',
          content: 'Contenido público',
          published: true,
          authorId: userId,
        })
        .expect(201);

      // Crear post no publicado
      const draftPost = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Post en Borrador',
          content: 'Contenido privado',
          published: false,
          authorId: userId,
        })
        .expect(201);

      // Verificar estados
      const published = await request(app.getHttpServer())
        .get(`/posts/${publishedPost.body.id}`)
        .expect(200);

      const draft = await request(app.getHttpServer())
        .get(`/posts/${draftPost.body.id}`)
        .expect(200);

      expect(published.body.published).toBe(true);
      expect(draft.body.published).toBe(false);

      // Obtener todos los posts del usuario
      const allPosts = await request(app.getHttpServer())
        .get(`/posts?authorId=${userId}`)
        .expect(200);

      expect(allPosts.body).toHaveLength(2);
      expect(allPosts.body.filter((p) => p.published)).toHaveLength(1);
      expect(allPosts.body.filter((p) => !p.published)).toHaveLength(1);
    });
  });
});
