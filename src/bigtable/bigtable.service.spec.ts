import { Test, TestingModule } from '@nestjs/testing';
import { APP_CONFIGURATION } from '../config';
import { BigTableService } from './bigtable.service';

// Mock functions we'll use to control behavior
const mockExistsFn = jest.fn();
const mockInsertFn = jest.fn();
const mockCloseFn = jest.fn();

// Mock Bigtable
jest.mock('@google-cloud/bigtable', () => {
  return {
    Bigtable: jest.fn().mockImplementation(() => {
      return {
        instance: jest.fn().mockImplementation(() => {
          return {
            table: jest.fn().mockImplementation(() => {
              return {
                exists: mockExistsFn,
                insert: mockInsertFn,
              };
            }),
          };
        }),
        close: mockCloseFn,
      };
    }),
  };
});

describe('BigTableService', () => {
  let bigtableService: BigTableService;
  let mockAppConfig: any;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock configuration
    mockAppConfig = {
      bigtableSettings: {
        instanceName: 'test-instance',
        tableName: 'test-table',
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BigTableService,
        {
          provide: APP_CONFIGURATION,
          useValue: mockAppConfig,
        },
      ],
    }).compile();

    bigtableService = module.get<BigTableService>(BigTableService);

    // Create spy for Logger methods
    logSpy = jest
      .spyOn(bigtableService['logger'], 'log')
      .mockImplementation(() => {});
    warnSpy = jest
      .spyOn(bigtableService['logger'], 'warn')
      .mockImplementation(() => {});
    errorSpy = jest
      .spyOn(bigtableService['logger'], 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize Bigtable and set configuration', () => {
      expect(bigtableService).toBeDefined();
      expect((bigtableService as any).bigtableSettings).toEqual(
        mockAppConfig.bigtableSettings,
      );
    });
  });

  describe('onModuleInit', () => {
    it('should successfully connect to existing table', async () => {
      // Setup mock to return that table exists
      mockExistsFn.mockResolvedValueOnce([true]);

      await bigtableService.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initializing connection to Bigtable instance'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connected to Bigtable table'),
      );
    });

    it('should warn if table does not exist', async () => {
      mockExistsFn.mockResolvedValueOnce([false]);

      await bigtableService.onModuleInit();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Table test-table does not exist'),
      );
    });

    it('should handle initialization errors', async () => {
      const testError = new Error('Connection error');
      mockExistsFn.mockRejectedValueOnce(testError);

      await bigtableService.onModuleInit();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to initialize Bigtable connection',
        testError,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should successfully close Bigtable connection', async () => {
      mockCloseFn.mockResolvedValueOnce(null);

      await bigtableService.onModuleDestroy();

      expect(mockCloseFn).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        'Bigtable connection closed successfully',
      );
    });

    it('should handle cleanup errors', async () => {
      const testError = new Error('Cleanup error');
      mockCloseFn.mockRejectedValueOnce(testError);

      await bigtableService.onModuleDestroy();

      expect(errorSpy).toHaveBeenCalledWith(
        'Error during Bigtable cleanup',
        testError,
      );
    });
  });

  describe('insertEvent', () => {
    beforeEach(async () => {
      // Initialize the bigtableService by connecting to Bigtable
      mockExistsFn.mockResolvedValueOnce([true]);
      await bigtableService.onModuleInit();
      jest.clearAllMocks(); // Clear logs from initialization
    });

    it('should successfully insert data into Bigtable', async () => {
      const rowKey = 'test-row-key';
      const dataFamily = { field1: 'value1', field2: { nested: 'value' } };
      const metaFamily = { timestamp: '2023-01-01', type: 'test' };

      mockInsertFn.mockResolvedValueOnce([]);

      const result = await bigtableService.insertEvent(
        rowKey,
        dataFamily,
        metaFamily,
      );

      expect(result).toBe(true);
      expect(mockInsertFn).toHaveBeenCalledWith([
        expect.objectContaining({
          key: rowKey,
          data: expect.objectContaining({
            meta: expect.any(Object),
            data: expect.any(Object),
          }),
        }),
      ]);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Event saved to Bigtable with row key: ${rowKey}`,
        ),
      );
    });

    it('should handle error when inserting data', async () => {
      const rowKey = 'test-row-key';
      const dataFamily = { field1: 'value1' };
      const metaFamily = { timestamp: '2023-01-01' };
      const testError = new Error('Insert error');

      mockInsertFn.mockRejectedValueOnce(testError);

      const result = await bigtableService.insertEvent(
        rowKey,
        dataFamily,
        metaFamily,
      );

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error saving event to Bigtable'),
        testError.stack,
      );
    });

    it('should handle non-Error objects when inserting data fails', async () => {
      const rowKey = 'test-row-key';
      const dataFamily = { field1: 'value1' };
      const metaFamily = { timestamp: '2023-01-01' };

      mockInsertFn.mockRejectedValueOnce('String error');

      const result = await bigtableService.insertEvent(
        rowKey,
        dataFamily,
        metaFamily,
      );

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error saving event to Bigtable: String error',
      );
    });

    it('should correctly format data and metadata', async () => {
      const rowKey = 'test-row-key';
      const dataFamily = {
        stringField: 'string-value',
        objectField: { id: 123, name: 'test' },
      };
      const metaFamily = {
        timestamp: '2023-01-01',
        metadata: { source: 'test-app' },
      };

      mockInsertFn.mockImplementationOnce((rows) => {
        return Promise.resolve([rows]);
      });

      await bigtableService.insertEvent(rowKey, dataFamily, metaFamily);

      // Check that the correct data was passed to insert
      expect(mockInsertFn).toHaveBeenCalledTimes(1);
      const insertCall = mockInsertFn.mock.calls[0][0][0];

      // Verify row key
      expect(insertCall.key).toBe(rowKey);

      // Check that all values were converted to buffers
      expect(Object.keys(insertCall.data)).toEqual(['meta', 'data']);

      // Verify Buffer conversion for each value
      Object.entries(insertCall.data.meta).forEach(([key, value]) => {
        expect(Buffer.isBuffer(value)).toBe(true);
      });

      Object.entries(insertCall.data.data).forEach(([key, value]) => {
        expect(Buffer.isBuffer(value)).toBe(true);
      });

      // String value check
      expect(insertCall.data.meta.timestamp.toString()).toBe('2023-01-01');
      expect(insertCall.data.data.stringField.toString()).toBe('string-value');

      // Object value check - should be stringified JSON
      expect(JSON.parse(insertCall.data.meta.metadata.toString())).toEqual({
        source: 'test-app',
      });
      expect(JSON.parse(insertCall.data.data.objectField.toString())).toEqual({
        id: 123,
        name: 'test',
      });
    });
  });
});
