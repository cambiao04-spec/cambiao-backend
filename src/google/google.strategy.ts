import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, URL_BACKEND } from 'src/url';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {

    constructor() {
        super({
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: `${URL_BACKEND}/google/redirect`,
            scope: ['email', 'profile'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {

        const { name, emails } = profile;
        const user = {
            email: emails[0].value,
            username: name.givenName,
            accessToken
        };
        done(null, user);
    }
}
