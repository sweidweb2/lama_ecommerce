/** Shared E2E env gates — keep credentials out of the repo; set in shell or `.env.local`. */

export const e2eEnabled = process.env.E2E_RUN === "1";

/** When true, missing catalog/shipping/creds fail instead of skip. */
export const e2eStrict = process.env.E2E_STRICT === "1";

export function cred(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const e2eUser = {
  email: () => cred("E2E_USER_EMAIL"),
  password: () => cred("E2E_USER_PASSWORD"),
  ready: () => Boolean(cred("E2E_USER_EMAIL") && cred("E2E_USER_PASSWORD")),
};

export const e2eAdmin = {
  email: () => cred("E2E_ADMIN_EMAIL"),
  password: () => cred("E2E_ADMIN_PASSWORD"),
  ready: () => Boolean(cred("E2E_ADMIN_EMAIL") && cred("E2E_ADMIN_PASSWORD")),
};

export const e2eInactive = {
  email: () => cred("E2E_INACTIVE_EMAIL"),
  password: () => cred("E2E_INACTIVE_PASSWORD"),
  ready: () =>
    Boolean(cred("E2E_INACTIVE_EMAIL") && cred("E2E_INACTIVE_PASSWORD")),
};
