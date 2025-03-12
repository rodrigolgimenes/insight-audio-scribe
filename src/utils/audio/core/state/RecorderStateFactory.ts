
import { IRecorderState } from '../../types/recorderStateTypes';
import { RecorderStateImpl } from './RecorderStateImpl';

/**
 * Factory to create RecorderState instances
 */
export class RecorderStateFactory {
  /**
   * Creates a new RecorderState instance
   */
  static createRecorderState(): IRecorderState {
    return new RecorderStateImpl();
  }
}
