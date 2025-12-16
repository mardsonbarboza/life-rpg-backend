import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      // Verificar se o token está revogado
      const revoked = await this.prismaService.revokedToken.findUnique({
        where: { token },
      });

      if (revoked) {
        throw new UnauthorizedException('Token revogado');
      }

      // Validar token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Buscar usuário
      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
        include: { stats: true },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const { password, ...userWithoutPassword } = user;
      request['user'] = userWithoutPassword;
    } catch (err) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
