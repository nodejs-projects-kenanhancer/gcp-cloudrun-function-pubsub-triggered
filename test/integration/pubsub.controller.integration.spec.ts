import type { Message } from '@google/events/cloud/pubsub/v1/MessagePublishedData';
import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PubsubProcessorService } from '../../src/pubsub';
import { PubsubController } from '../../src/pubsub/pubsub.controller';

describe('PubsubController (integration)', () => {
  let app: NestExpressApplication;
  let handleMessageMock: jest.Mock;

  beforeEach(async () => {
    handleMessageMock = jest.fn().mockResolvedValue(undefined);
    // Create a mock PubsubProcessorService
    const mockPubsubService = {
      handleMessage: handleMessageMock,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PubsubController],
      providers: [
        {
          provide: PubsubProcessorService,
          useValue: mockPubsubService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/POST pubsub/test should accept valid CloudEvent', () => {
    const validEvent: Message = {
      messageId: 'message-id-123',
      data: 'dGVzdCBtZXNzYWdl', // "test message" in base64
      publishTime: '2023-01-01T00:00:00.000Z',
    };

    return request(app.getHttpServer())
      .post('/pubsub/test')
      .send(validEvent)
      .expect(HttpStatus.NO_CONTENT)
      .then(() => {
        expect(handleMessageMock).toHaveBeenCalledWith(
          expect.objectContaining(validEvent),
        );
      });
  });

  it('/POST pubsub/test should reject invalid CloudEvent', () => {
    const invalidEvent = {} as Message;

    return request(app.getHttpServer())
      .post('/pubsub/test')
      .send(invalidEvent)
      .expect(HttpStatus.NO_CONTENT);
  });

  it('should return 400 for invalid payload', () => {
    const invalidEvent = {
      // Missing required fields
      id: 'test-id-123',
    } as Message;

    return request(app.getHttpServer())
      .post('/pubsub/test')
      .send(invalidEvent)
      .expect(HttpStatus.NO_CONTENT);
  });

  it('should return 204 for valid base64 payload', () => {
    // Create a valid CloudEvent
    const validEvent: Message = {
      messageId: 'message-id-123',
      publishTime: '2023-01-01T00:00:00.000Z',
      data: 'eyJpZCI6IjU2OTc2NjZiLWU3OTItNGFkMS05ZDk0LTM1MTc0ZjQwNWQ4MSIsInRvcGljIjoiYmFzdF9hY2NvdW50X2JpbGxpbmdfaG9sZF92MSIsInBhcnRpdGlvbiI6MSwib2Zmc2V0IjoiNDgxMzkiLCJ0aW1lc3RhbXAiOiIyMDI1LTA1LTE1VDA1OjEzOjQ4LjIxOFoiLCJrZXkiOiIzMDYwNDM0NiIsInZhbHVlIjp7ImhvbGRJZCI6IjQ0MDgyOCIsImFjY291bnRJZCI6IjMwNjA0MzQ2IiwiY2xpZW50SWQiOiI3NmNjYjU0OS1lNThmLTQzMDEtOGRlMS0yZGNiNDNiMTVmY2UiLCJhZ2VudElkIjoiYmljb19maW5hbF9iaWxsaW5nX2NvbnRyb2xzIiwicmVhc29uIjoiSG9sZCBkZWxldGVkIGF1dG9tYXRpY2FsbHkgYnkgZmluYWwgYmlsbGluZyBjb250cm9scyBzZXJ2aWNlIiwiYWN0aW9uIjoiRGVsZXRlZCIsImFjdGlvblRpbWVzdGFtcCI6MTc0NzI4NjAyNDk0MSwiY3VycmVudFN0YXRlIjp7ImNvbS5vdm9lbmVyZ3kua2Fma2EuYmFzdC5iaWxsaW5nLk9uSG9sZCI6eyJob2xkcyI6W3siaG9sZElkIjoiNDQwODI5IiwicmVhc29uIjoiQmlsbGluZyBDb250cm9sczogRmluYWxsZWQgLyBNaXNzaW5nIGZpbmFsIGRheSBjaGFyZ2UgKEFVVE8pIFtpZDo2ZDBmYWFiNzZiNmE5NzBmM2Y2NzIxMTIxMjRiMGRjNV0iLCJhZ2VudElkIjoiYmljb19maW5hbF9iaWxsaW5nX2NvbnRyb2xzIiwiY2xpZW50SWQiOiI3NmNjYjU0OS1lNThmLTQzMDEtOGRlMS0yZGNiNDNiMTVmY2UiLCJob2xkVGltZVN0YW1wIjoxNzQ3Mjg1OTQ1OTAxfV19fSwibWV0YWRhdGEiOnsiZXZlbnRJZCI6IjE1MDAxZTJjNTU1MmE3NTg0YTA5ZTUxY2MzMmJmY2MwYWIyNDkzMzY2ZTc3NzMyODBhMDM0ZDE1YWY4NWIyNGIiLCJjcmVhdGVkQXQiOjE3NDcyODYwMjQ5NDEsInRyYWNlVG9rZW4iOiJjOGNkMzU0NC0wYTEyLTQ2N2UtODUyNy1jYjhmOGVkODQ2MTcifX0sImhlYWRlcnMiOnt9fQ==',
    };

    return request(app.getHttpServer())
      .post('/pubsub/test')
      .send(validEvent)
      .expect(HttpStatus.NO_CONTENT);
  });
});
