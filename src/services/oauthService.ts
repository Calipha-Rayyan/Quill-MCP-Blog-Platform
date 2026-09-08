import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export interface OAuthClient {
  client_id: string;
  redirect_uris: string[];
  token_endpoint_auth_method: "none";
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  userId: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  resource: string;
  expiresAt: number;
}

interface AccessToken {
  token: string;
  clientId: string;
  userId: string;
  resource: string;
  expiresAt: number;
}

function randomToken(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

export class OAuthService {
  private readonly clients = new Map<
    string,
    OAuthClient
  >();

  private readonly authorizationCodes =
    new Map<string, AuthorizationCode>();

  private readonly accessTokens =
    new Map<string, AccessToken>();

  registerClient(
    redirectUris: string[],
  ): OAuthClient {
    const clientId = randomToken("qc");

    const client: OAuthClient = {
      client_id: clientId,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
    };

    this.clients.set(clientId, client);

    return client;
  }

  getClient(
    clientId: string,
  ): OAuthClient | null {
    return this.clients.get(clientId) ?? null;
  }

  createAuthorizationCode(input: {
    clientId: string;
    redirectUri: string;
    userId: string;
    codeChallenge: string;
    resource: string;
  }): string {
    const client =
      this.clients.get(input.clientId);

    if (!client) {
      throw new Error("Unknown OAuth client");
    }

    if (
      !client.redirect_uris.includes(
        input.redirectUri,
      )
    ) {
      throw new Error(
        "Invalid redirect URI",
      );
    }

    const code = randomToken("code");

    this.authorizationCodes.set(
      code,
      {
        code,
        clientId: input.clientId,
        redirectUri: input.redirectUri,
        userId: input.userId,
        codeChallenge:
          input.codeChallenge,
        codeChallengeMethod: "S256",
        resource: input.resource,
        expiresAt: now() + 300,
      },
    );

    return code;
  }

  exchangeAuthorizationCode(input: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
    resource: string;
  }): {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
  } | null {
    const record =
      this.authorizationCodes.get(
        input.code,
      );

    if (!record) {
      return null;
    }

    this.authorizationCodes.delete(
      input.code,
    );

    if (
      record.expiresAt <= now() ||
      record.clientId !== input.clientId ||
      record.redirectUri !==
        input.redirectUri ||
      record.resource !==
        input.resource
    ) {
      return null;
    }

    const challenge = createHash(
      "sha256",
    )
      .update(input.codeVerifier)
      .digest("base64url");

    const a = Buffer.from(challenge);
    const b = Buffer.from(
      record.codeChallenge,
    );

    if (
      a.length !== b.length ||
      !timingSafeEqual(a, b)
    ) {
      return null;
    }

    const token = randomToken("atk");

    const expiresIn = 3600;

    this.accessTokens.set(
      token,
      {
        token,
        clientId: input.clientId,
        userId: record.userId,
        resource: record.resource,
        expiresAt:
          now() + expiresIn,
      },
    );

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: expiresIn,
    };
  }

  authenticateAccessToken(
    token: string,
    resource: string,
  ): string | null {
    const record =
      this.accessTokens.get(token);

    if (!record) {
      return null;
    }

    if (record.expiresAt <= now()) {
      this.accessTokens.delete(token);
      return null;
    }

    if (
      record.resource !== resource
    ) {
      return null;
    }

    return record.userId;
  }
}