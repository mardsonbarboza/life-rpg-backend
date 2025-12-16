import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new ConflictException('Username já está em uso');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        password: passwordHash,
        stats: {
          create: {
            strength: 10,
            agility: 10,
            intelligence: 10,
            vitality: 10,
          },
        },
      },
      include: {
        stats: true,
      },
    });

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Usuário criado com sucesso',
      user: userWithoutPassword,
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: data.username },
      include: { stats: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      username: user.username,
    };

    const token = this.jwtService.sign(payload);
    const { password, ...userWithoutPassword } = user;

    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { stats: true },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
  async logout(token: string) {
    try {
      // Decodificar token para pegar expiração
      const decoded = this.jwtService.decode(token) as any;

      if (!decoded || !decoded.exp) {
        throw new UnauthorizedException('Token inválido');
      }

      const expiresAt = new Date(decoded.exp * 1000);

      // Adicionar token à lista de revogados
      await this.prisma.revokedToken.create({
        data: {
          token,
          expiresAt,
        },
      });

      return { message: 'Logout realizado com sucesso' };
    } catch (error) {
      throw new UnauthorizedException('Erro ao processar logout');
    }
  }
}
