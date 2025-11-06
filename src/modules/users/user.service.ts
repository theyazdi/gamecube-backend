import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { User, Profile } from '../../generated/client';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { CompleteProfileDto } from './dto/profile.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  async findUserByUuid(uuid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { uuid },
      include: {
        profile: true,
      },
    });
  }


  async findAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {
        profile: true,
      },
    });
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateUserByUuid(uuid: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { uuid },
      data,
    });
  }

  async deleteUser(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async deleteUserByUuid(uuid: string): Promise<User> {
    return this.prisma.user.delete({
      where: { uuid },
    });
  }

  async completeProfile(userId: number, data: CompleteProfileDto): Promise<Profile> {
    // Check if profile already exists
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // Update existing profile
      return this.prisma.profile.update({
        where: { userId },
        data,
      });
    } else {
      // Create new profile
      return this.prisma.profile.create({
        data: {
          userId,
          ...data,
        },
      });
    }
  }

  async getProfileByUserId(userId: number): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { userId },
    });
  }

}
