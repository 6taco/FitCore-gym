import { useEffect, useState } from 'react';

/**
 * 对值进行防抖：在 delay 毫秒内没有新值传入时才更新返回值。
 * 常用于搜索输入框，避免每次击键都触发请求。
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
