import { Router } from "express";
import type { Request, Response } from "express";
import type { AuthService } from "../../services/authService.js";
import type {
  OAuthService,
} from "../../services/oauthService.js";

function getBaseUrl(req: Request): string {
  const forwardedProto =
    req.header("x-forwarded-proto") ?? req.protocol;

  const forwardedHost =
    req.header("x-forwarded-host") ?? req.get("host");

  return `${forwardedProto}://${forwardedHost}`;
}

function getMcpResource(req: Request): string {
  return `${getBaseUrl(req)}/mcp`;
}

export function createOAuthRouter(
  authService: AuthService,
  oauthService: OAuthService,
): Router {
  const router = Router();

  /*
   * Protected resource metadata.
   * Claude uses this to discover the authorization server.
   */
  router.get(
    "/.well-known/oauth-protected-resource",
    (req, res) => {
      const resource = getMcpResource(req);
      const baseUrl = getBaseUrl(req);

      res.json({
        resource,
        authorization_servers: [
          baseUrl,
        ],
      });
    },
  );

  /*
   * Authorization server metadata.
   */
  router.get(
    "/.well-known/oauth-authorization-server",
    (req, res) => {
      const baseUrl = getBaseUrl(req);

      res.json({
        issuer: baseUrl,
        authorization_endpoint:
          `${baseUrl}/authorize`,
        token_endpoint:
          `${baseUrl}/token`,
        registration_endpoint:
          `${baseUrl}/register`,

        response_types_supported: [
          "code",
        ],

        grant_types_supported: [
          "authorization_code",
        ],

        token_endpoint_auth_methods_supported: [
          "none",
        ],

        code_challenge_methods_supported: [
          "S256",
        ],

        scopes_supported: [
          "mcp",
        ],
      });
    },
  );

  /*
   * Dynamic Client Registration.
   *
   * Claude can automatically register itself here
   * when "No client ID — register one automatically"
   * is selected.
   */
  router.post(
    "/register",
    (req, res) => {
      const body = req.body as Record<
        string,
        unknown
      >;

      const redirectUris =
        Array.isArray(body.redirect_uris)
          ? body.redirect_uris.filter(
              (value): value is string =>
                typeof value === "string",
            )
          : [];

      if (redirectUris.length === 0) {
        res.status(400).json({
          error:
            "redirect_uris is required",
        });
        return;
      }

      const client =
        oauthService.registerClient(
          redirectUris,
        );

      res.status(201).json({
        client_id: client.client_id,
        client_id_issued_at:
          Math.floor(Date.now() / 1000),
        redirect_uris:
          client.redirect_uris,
        token_endpoint_auth_method:
          client.token_endpoint_auth_method,
        grant_types: [
          "authorization_code",
        ],
        response_types: ["code"],
      });
    },
  );

  /*
   * Authorization endpoint.
   *
   * GET  -> show Quill login page
   * POST -> verify Quill account and issue auth code
   */
  router.get(
    "/authorize",
    (req, res) => {
      console.log("[OAUTH] /authorize query:", req.query);

      try {
        const {
          client_id,
          redirect_uri,
          response_type,
          state,
          code_challenge,
          code_challenge_method,
          resource,
        } = req.query;

        if (
          typeof client_id !== "string" ||
          typeof redirect_uri !== "string" ||
          response_type !== "code" ||
          typeof code_challenge !== "string" ||
          code_challenge_method !== "S256"
        ) {
          res.status(400).send(
            "Invalid OAuth authorization request.",
          );
          return;
        }

        const client =
          oauthService.getClient(
            client_id,
          );

        if (!client) {
          res.status(400).send(
            "Unknown OAuth client.",
          );
          return;
        }

        if (
          !client.redirect_uris.includes(
            redirect_uri,
          )
        ) {
          res.status(400).send(
            "Invalid redirect URI.",
          );
          return;
        }

        const resourceValue =
          typeof resource === "string"
            ? resource
            : getMcpResource(req);

        res.type("html").send(
          loginPage({
            clientId: client_id,
            redirectUri: redirect_uri,
            state:
              typeof state === "string"
                ? state
                : "",
            codeChallenge:
              code_challenge,
            codeChallengeMethod:
              code_challenge_method,
            resource: resourceValue,
          }),
        );
      } catch (error) {
        console.error("[OAUTH] /authorize error:", error);
        res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  router.post(
    "/authorize",
    (req, res) => {
      const {
        client_id,
        redirect_uri,
        state,
        code_challenge,
        code_challenge_method,
        resource,
        email,
        password,
      } = req.body as Record<
        string,
        unknown
      >;

      if (
        typeof client_id !== "string" ||
        typeof redirect_uri !== "string" ||
        typeof code_challenge !== "string" ||
        code_challenge_method !== "S256" ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        res.status(400).send(
          "Invalid OAuth login request.",
        );
        return;
      }

      const client =
        oauthService.getClient(
          client_id,
        );

      if (!client) {
        res.status(400).send(
          "Unknown OAuth client.",
        );
        return;
      }

      if (
        !client.redirect_uris.includes(
          redirect_uri,
        )
      ) {
        res.status(400).send(
          "Invalid redirect URI.",
        );
        return;
      }

      const user =
        authService.verifyPassword(
          email,
          password,
        );

      if (!user) {
        res
          .status(401)
          .type("html")
          .send(
            loginPage({
              clientId: client_id,
              redirectUri: redirect_uri,
              state:
                typeof state ===
                "string"
                  ? state
                  : "",
              codeChallenge:
                code_challenge,
              codeChallengeMethod:
                "S256",
              resource:
                typeof resource ===
                "string"
                  ? resource
                  : getMcpResource(req),
              error:
                "Invalid email or password.",
            }),
          );

        return;
      }

      const authorizationCode =
        oauthService.createAuthorizationCode(
          {
            clientId: client_id,
            redirectUri:
              redirect_uri,
            userId: user.id,
            codeChallenge:
              code_challenge,
            resource:
              typeof resource ===
              "string"
                ? resource
                : getMcpResource(req),
          },
        );

      const url =
        new URL(redirect_uri);

      url.searchParams.set(
        "code",
        authorizationCode,
      );

      if (typeof state === "string") {
        url.searchParams.set(
          "state",
          state,
        );
      }

      res.redirect(url.toString());
    },
  );

  /*
   * Token endpoint.
   */
  router.post(
    "/token",
    (req, res) => {
      const body =
        req.body as Record<
          string,
          unknown
        >;

      const code =
        typeof body.code ===
        "string"
          ? body.code
          : "";

      const clientId =
        typeof body.client_id ===
        "string"
          ? body.client_id
          : "";

      const redirectUri =
        typeof body.redirect_uri ===
        "string"
          ? body.redirect_uri
          : "";

      const codeVerifier =
        typeof body.code_verifier ===
        "string"
          ? body.code_verifier
          : "";

      const resource =
        typeof body.resource ===
        "string"
          ? body.resource
          : getMcpResource(req);

      const result =
        oauthService.exchangeAuthorizationCode(
          {
            code,
            clientId,
            redirectUri,
            codeVerifier,
            resource,
          },
        );

      if (!result) {
        res.status(400).json({
          error:
            "invalid_grant",
        });
        return;
      }

      res.json(result);
    },
  );

  return router;
}

function loginPage(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  resource: string;
  error?: string;
}): string {
  const errorHtml = input.error
    ? `
      <div style="
        margin-bottom:16px;
        padding:12px;
        border-radius:10px;
        background:#3b1111;
        color:#fca5a5;
        font-size:14px;
      ">
        ${escapeHtml(input.error)}
      </div>
    `
    : "";

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1"
  >
  <title>Sign in to Quill</title>
</head>

<body style="
  margin:0;
  min-height:100vh;
  display:grid;
  place-items:center;
  background:#09090b;
  color:#f4f4f5;
  font-family:Inter,system-ui,-apple-system,
    BlinkMacSystemFont,'Segoe UI',sans-serif;
">

  <main style="
    width:min(100% - 40px,420px);
    padding:32px;
    box-sizing:border-box;
    border:1px solid #27272a;
    border-radius:20px;
    background:#111113;
    box-shadow:0 25px 80px rgba(0,0,0,.4);
  ">

    <div style="
      width:38px;
      height:38px;
      display:grid;
      place-items:center;
      border-radius:10px;
      background:#8b5cf6;
      color:white;
      font-weight:800;
      margin-bottom:22px;
    ">
      Q
    </div>

    <h1 style="
      margin:0 0 8px;
      font-size:26px;
    ">
      Sign in to Quill
    </h1>

    <p style="
      margin:0 0 24px;
      color:#a1a1aa;
      line-height:1.5;
    ">
      Authorize this AI agent to access
      your Quill workspace.
    </p>

    ${errorHtml}

    <form method="POST" action="/authorize">

      <input
        type="hidden"
        name="client_id"
        value="${escapeHtml(input.clientId)}"
      >

      <input
        type="hidden"
        name="redirect_uri"
        value="${escapeHtml(input.redirectUri)}"
      >

      <input
        type="hidden"
        name="state"
        value="${escapeHtml(input.state)}"
      >

      <input
        type="hidden"
        name="code_challenge"
        value="${escapeHtml(input.codeChallenge)}"
      >

      <input
        type="hidden"
        name="code_challenge_method"
        value="S256"
      >

      <input
        type="hidden"
        name="resource"
        value="${escapeHtml(input.resource)}"
      >

      <label style="
        display:block;
        margin-bottom:16px;
        font-size:14px;
      ">
        Email

        <input
          type="email"
          name="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
          style="
            width:100%;
            box-sizing:border-box;
            margin-top:8px;
            padding:12px;
            border:1px solid #3f3f46;
            border-radius:10px;
            background:#18181b;
            color:#f4f4f5;
            outline:none;
          "
        >
      </label>

      <label style="
        display:block;
        margin-bottom:20px;
        font-size:14px;
      ">
        Password

        <input
          type="password"
          name="password"
          required
          autocomplete="current-password"
          placeholder="Your Quill password"
          style="
            width:100%;
            box-sizing:border-box;
            margin-top:8px;
            padding:12px;
            border:1px solid #3f3f46;
            border-radius:10px;
            background:#18181b;
            color:#f4f4f5;
            outline:none;
          "
        >
      </label>

      <button
        type="submit"
        style="
          width:100%;
          padding:12px;
          border:0;
          border-radius:10px;
          background:#8b5cf6;
          color:white;
          font-weight:700;
          cursor:pointer;
        "
      >
        Authorize Quill
      </button>

    </form>
  </main>
</body>
</html>
  `;
}

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}