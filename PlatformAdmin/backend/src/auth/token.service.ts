import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type TokenType = "access" | "refresh";

export type JwtPayload = {
  sub: string;
  email: string;
  fullName: string;
  role: string;
  tenantId?: string;
  tokenType?: TokenType;
  exp: number;
};

function base64UrlEncode(value: object | string) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  return Buffer.from(raw).toString("base64url");
}

function base64UrlDecode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  sign(payload: Omit<JwtPayload, "exp">, expiresInSeconds: number, tokenType: TokenType = "access") {
    const header = { alg: "HS256", typ: "JWT" };
    const body = { ...payload, tokenType, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(body);
    const signature = this.signData(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string, expectedType?: TokenType): JwtPayload {
    const [encodedHeader, encodedPayload, signature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException("Invalid token");
    }

    const expected = this.signData(`${encodedHeader}.${encodedPayload}`);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      throw new UnauthorizedException("Invalid token signature");
    }

    const payload = base64UrlDecode<JwtPayload>(encodedPayload);
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Token expired");
    }

    if (expectedType && payload.tokenType && payload.tokenType !== expectedType) {
      throw new UnauthorizedException(`Expected ${expectedType} token`);
    }

    return payload;
  }

  private signData(data: string) {
    const secret = this.config.get<string>("JWT_SECRET") ?? "dev-secret-change-me";
    return createHmac("sha256", secret).update(data).digest("base64url");
  }
}
