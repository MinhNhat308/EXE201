import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from "@simplewebauthn/server";
import { Model } from "mongoose";
import { toDto } from "../common/mongo";
import { User, UserDocument } from "./user.schema";
import { AuthService } from "./auth.service";

type StoredChallenge = { challenge: string; expiresAt: number };

@Injectable()
export class AuthPasskeyService {
  private readonly challenges = new Map<string, StoredChallenge>();

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
    private readonly authService: AuthService
  ) {}

  async getRegistrationOptions(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const { rpID, rpName, origin } = this.getWebAuthnConfig();
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.email,
      userDisplayName: user.fullName,
      attestationType: "none",
      excludeCredentials: (user.passkeys ?? []).map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports as AuthenticatorTransport[] | undefined
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred"
      }
    });

    this.storeChallenge(userId, options.challenge);
    return { options, origin };
  }

  async verifyRegistration(userId: string, body: Record<string, unknown>, deviceName?: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const expectedChallenge = this.consumeChallenge(userId);
    const { rpID, origin } = this.getWebAuthnConfig();

    const verification = await verifyRegistrationResponse({
      response: body as any,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException("Passkey registration failed");
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    user.passkeys = [
      ...(user.passkeys ?? []),
      {
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        deviceName: deviceName ?? credentialDeviceType,
        transports: credential.transports ?? []
      }
    ];
    await user.save();

    return { ok: true, backedUp: credentialBackedUp };
  }

  async getLoginOptions(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase(), isActive: true }).exec();
    if (!user || !user.passkeys?.length) {
      throw new BadRequestException("No passkey registered for this account");
    }

    const { rpID } = this.getWebAuthnConfig();
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports as AuthenticatorTransport[] | undefined
      })),
      userVerification: "preferred"
    });

    this.storeChallenge(email.toLowerCase(), options.challenge);
    return options;
  }

  async verifyLogin(email: string, body: Record<string, unknown>) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail, isActive: true }).exec();
    if (!user || !user.passkeys?.length) {
      throw new UnauthorizedException("Invalid passkey");
    }

    const expectedChallenge = this.consumeChallenge(normalizedEmail);
    const { rpID, origin } = this.getWebAuthnConfig();
    const credentialId = String((body as any).id ?? "");
    const passkey = user.passkeys.find((item) => item.credentialId === credentialId);

    if (!passkey) {
      throw new UnauthorizedException("Unknown passkey");
    }

    const verification = await verifyAuthenticationResponse({
      response: body as any,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, "base64url"),
        counter: passkey.counter,
        transports: passkey.transports as AuthenticatorTransport[] | undefined
      }
    });

    if (!verification.verified) {
      throw new UnauthorizedException("Passkey verification failed");
    }

    passkey.counter = verification.authenticationInfo.newCounter;
    await user.save();

    return this.authService.createTokenResponseForUser(user);
  }

  private getWebAuthnConfig() {
    const origin = this.config.get<string>("FRONTEND_ORIGIN") ?? "http://localhost:3000";
    const rpID = this.config.get<string>("WEBAUTHN_RP_ID") ?? "localhost";
    const rpName = this.config.get<string>("WEBAUTHN_RP_NAME") ?? "TeaFlow BobaPOS";
    return { origin, rpID, rpName };
  }

  private storeChallenge(key: string, challenge: string) {
    this.challenges.set(key, { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
  }

  private consumeChallenge(key: string) {
    const stored = this.challenges.get(key);
    this.challenges.delete(key);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException("Challenge expired. Please try again.");
    }
    return stored.challenge;
  }
}
