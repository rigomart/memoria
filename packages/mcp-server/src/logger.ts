export type Logger = {
  info: (...messages: unknown[]) => void;
  warn: (...messages: unknown[]) => void;
  error: (...messages: unknown[]) => void;
  debug: (...messages: unknown[]) => void;
};

export function createLogger(enabled: boolean): Logger {
  const noop = () => undefined;

  const base = {
    info: console.error.bind(console, "[contextor-mcp]"),
    warn: console.warn.bind(console, "[contextor-mcp]"),
    error: console.error.bind(console, "[contextor-mcp]"),
  };

  return {
    ...base,
    debug: enabled ? console.error.bind(console, "[contextor-mcp]") : noop,
  };
}
