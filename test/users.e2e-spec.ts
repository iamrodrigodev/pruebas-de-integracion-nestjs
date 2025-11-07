import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { QueryFailedExceptionFilter } from './../src/filters/query-failed-exception.filter';

describe('UsersController (e2e)', () => {
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

  describe('POST /users', () => {
    it('should create a new user', () => {
      const createUserDto = {
        name: 'Juan Perez',
        email: 'juan@example.com',
        age: 25,
      };

      const checkCreateUserResponse = (res: request.Response) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(createUserDto.name);
        expect(res.body.email).toBe(createUserDto.email);
        expect(res.body.age).toBe(createUserDto.age);
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201)
        .expect(checkCreateUserResponse);
    });

    it('should create multiple users with different IDs', async () => {
      const user1 = {
        name: 'Usuario 1',
        email: 'user1@example.com',
        age: 20,
      };

      const user2 = {
        name: 'Usuario 2',
        email: 'user2@example.com',
        age: 30,
      };

      const response1 = await request(app.getHttpServer())
        .post('/users')
        .send(user1)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/users')
        .send(user2)
        .expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });

  describe('GET /users', () => {
    it('should return an empty array when no users exist', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect([]);
    });

    it('should return all users', async () => {
      const user1 = {
        name: 'Maria Lopez',
        email: 'maria@example.com',
        age: 28,
      };

      const user2 = {
        name: 'Carlos Gomez',
        email: 'carlos@example.com',
        age: 35,
      };

      await request(app.getHttpServer()).post('/users').send(user1);
      await request(app.getHttpServer()).post('/users').send(user2);

      const checkGetAllUsersResponse = (res: request.Response) => {
        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toBe(user1.name);
        expect(res.body[1].name).toBe(user2.name);
      };

      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect(checkGetAllUsersResponse);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a specific user by ID', async () => {
      const createUserDto = {
        name: 'Ana Martinez',
        email: 'ana@example.com',
        age: 22,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto);

      const userId = createResponse.body.id;

      const checkGetUserByIdResponse = (res: request.Response) => {
        expect(res.body.id).toBe(userId);
        expect(res.body.name).toBe(createUserDto.name);
        expect(res.body.email).toBe(createUserDto.email);
      };

      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200)
        .expect(checkGetUserByIdResponse);
    });

    it('should return 404 when user does not exist', () => {
      const checkUserNotFoundResponse = (res: request.Response) => {
        expect(res.body.message).toContain('User with ID 999 not found');
      };

      return request(app.getHttpServer())
        .get('/users/999')
        .expect(404)
        .expect(checkUserNotFoundResponse);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update a user', async () => {
      const createUserDto = {
        name: 'Pedro Sanchez',
        email: 'pedro@example.com',
        age: 40,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto);

      const userId = createResponse.body.id;

      const updateUserDto = {
        name: 'Pedro Rodriguez',
        age: 41,
      };

      const checkUpdateUserResponse = (res: request.Response) => {
        expect(res.body.id).toBe(userId);
        expect(res.body.name).toBe(updateUserDto.name);
        expect(res.body.email).toBe(createUserDto.email); // no cambió
        expect(res.body.age).toBe(updateUserDto.age);
      };

      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send(updateUserDto)
        .expect(200)
        .expect(checkUpdateUserResponse);
    });

    it('should return 404 when updating non-existent user', () => {
      return request(app.getHttpServer())
        .patch('/users/999')
        .send({ name: 'Nuevo Nombre' })
        .expect(404);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const createUserDto = {
        name: 'Luis Garcia',
        email: 'luis@example.com',
        age: 33,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto);

      const userId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(204);

      // Verificar que el usuario ya no existe
      return request(app.getHttpServer()).get(`/users/${userId}`).expect(404);
    });

    it('should return 404 when deleting non-existent user', () => {
      return request(app.getHttpServer()).delete('/users/999').expect(404);
    });
  });

  describe('Integration flow', () => {
    it('should handle a complete CRUD cycle', async () => {
      // 1. Crear usuario
      const createUserDto = {
        name: 'Sofia Torres',
        email: 'sofia@example.com',
        age: 27,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body.id;

      // 2. Leer usuario
      const checkReadUserResponse = (res: request.Response) => {
        expect(res.body.name).toBe(createUserDto.name);
      };
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200)
        .expect(checkReadUserResponse);

      // 3. Actualizar usuario
      const updateUserDto = { age: 28 };
      const checkUpdateUserResponse = (res: request.Response) => {
        expect(res.body.age).toBe(28);
      };
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send(updateUserDto)
        .expect(200)
        .expect(checkUpdateUserResponse);

      // 4. Verificar en lista de usuarios
      const checkUserListResponse = (res: request.Response) => {
        const user = res.body.find((u) => u.id === userId);
        expect(user.age).toBe(28);
      };
      await request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect(checkUserListResponse);

      // 5. Eliminar usuario
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(204);

      // 6. Verificar que fue eliminado
      await request(app.getHttpServer()).get(`/users/${userId}`).expect(404);
    });
  });
});
