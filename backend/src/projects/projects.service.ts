import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async getProjectTags() {
    return this.prisma.projectTag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async getAppSettings() {
    const settings = await this.prisma.appSetting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }
}
