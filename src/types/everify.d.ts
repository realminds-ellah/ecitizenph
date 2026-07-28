export {};

interface EverifySdkResponse {
  status: string;
  result: {
    photo: string;
    session_id: string;
    photo_url: string;
  };
}

interface EverifySdkInstance {
  start: (opts: { pubKey: string }) => Promise<EverifySdkResponse>;
}

declare global {
  interface Window {
    eKYC?: () => EverifySdkInstance;
  }
}
