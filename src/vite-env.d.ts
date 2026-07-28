/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EVERIFY_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
