import { validate } from 'class-validator';
import {
  IsAcceptablePassword,
  passwordProblem,
  personalPasswordProblem,
  temporaryPassword,
} from './password';

class Dto {
  @IsAcceptablePassword()
  password: string;
}

describe('password policy', () => {
  it.each([
    ['too short', 'Sh0rt!pass'],
    ['common', 'password1234'],
    ['common in another case', 'PASSWORD1234'],
    ['local guess', 'AlgerieTelecom'],
    ['one repeated character', 'aaaaaaaaaaaaaaaa'],
    ['too long', 'x'.repeat(129)],
  ])('refuses a %s password', (_, password) => {
    expect(passwordProblem(password)).not.toBeNull();
  });

  it('accepts a long passphrase without composition rules', () => {
    expect(passwordProblem('correct horse battery staple')).toBeNull();
  });

  it('counts characters, not bytes', () => {
    expect(passwordProblem('éééééééééééé'.slice(0, 11) + 'x')).toBeNull();
  });

  it('refuses a password built from who the user is', () => {
    const user = {
      nom: 'Benali',
      prenom: 'Ahmed',
      email: 'ahmed.benali@at.dz',
      matricule: 12345,
    };
    expect(personalPasswordProblem('my-benali-2026-pass', user)).not.toBeNull();
    expect(personalPasswordProblem('ahmed.benali-rocks', user)).not.toBeNull();
    expect(personalPasswordProblem('pass-12345-word!', user)).not.toBeNull();
    expect(personalPasswordProblem('granite lantern orbit', user)).toBeNull();
  });

  it('reports the reason through the DTO decorator', async () => {
    const dto = Object.assign(new Dto(), { password: 'short' });
    const [error] = await validate(dto);
    expect(Object.values(error.constraints)[0]).toMatch(/au moins 12/);
  });

  it('generates temporary passwords that pass the policy and differ', () => {
    const a = temporaryPassword();
    expect(a).toMatch(/^[a-zA-Z2-9]{4}(-[a-zA-Z2-9]{4}){3}$/);
    expect(passwordProblem(a)).toBeNull();
    expect(temporaryPassword()).not.toBe(a);
  });
});
