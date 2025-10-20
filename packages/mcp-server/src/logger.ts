export type Logger = {
  info: (...messages: unknown[]) => void;
  warn: (...messages: unknown[]) => void;
  error: (...messages: unknown[]) => void;
  debug: (...messages: unknown[]) => void;
};

export function createLogger(enabled: boolean): Logger {
  const noop = () => undefined;

  const base = {
    info: console.error.bind(console, "[memoria-mcp]"),
    warn: console.warn.bind(console, "[memoria-mcp]"),
    error: console.error.bind(console, "[memoria-mcp]"),
  };

  return {
    ...base,
    debug: enabled ? console.error.bind(console, "[memoria-mcp]") : noop,
  };
}
