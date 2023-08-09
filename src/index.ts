const timeouts = {};
const values = {};

interface IBackgroundSyncParams<T> {
  name: string;
  defaultValue: T;
  callbacks: {
    onExecute: (value: T) => Promise<any>;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
  };
  options: {
    delayType: 'debounce' | 'throttle';
    delayTime: number;
    concatenate?: (currentValue: T, newValue: T) => T;
    triggerCondition?: (value: T) => boolean;
    clearOnExecute?: boolean;
  };
}

// TODO save single instance of value to use from different locations
// TODO optionally clear value after callback
// TODO return value after success, handle error
// TODO default concat
const apiBackgroundSync = <T>({
  name,
  defaultValue,
  callbacks: { 
    onExecute, 
    onSuccess, 
    onError,
  },
  options: {
    delayType,
    delayTime,
    concatenate,
    triggerCondition,
    clearOnExecute,
  },
}: IBackgroundSyncParams<T>) => {
  values[name] = defaultValue;

  const execute = () => {
    onExecute(values[name])
      .then(onSuccess)
      .catch(onError);

    if (clearOnExecute) {
      values[name] = defaultValue;
    }
  };

  const removeTimeout = () => {
    if (timeouts[name]) {
      clearTimeout(timeouts[name]);
      delete timeouts[name];
    }
  }

  const debounce = async (value: T) => {
    removeTimeout();

    values[name] = concatenate ? concatenate(values[name], value) : value;

    if (triggerCondition && triggerCondition(values[name])) {
      execute();
      return;
    }

    timeouts[name] = setTimeout(() => execute(), delayTime);
  };

  const throttle = async (value: T) => {
    values[name] = concatenate ? concatenate(values[name], value) : value;
    
    if (triggerCondition && triggerCondition(values[name])) {
      removeTimeout();

      execute();

      return;
    }

    if (timeouts[name]) {
      return;
    }
  
    timeouts[name] = setTimeout(() => {
      removeTimeout();

      execute();
    }, delayTime);
  };

  return delayType === 'debounce' ? debounce : throttle;
};

export default apiBackgroundSync;
