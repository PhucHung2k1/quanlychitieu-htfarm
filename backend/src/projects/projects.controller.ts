import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('meta')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get('tags')
  getTags() {
    return this.projectsService.getProjectTags();
  }

  @Get('categories')
  getCategories() {
    return this.projectsService.getCategories();
  }

  @Get('settings')
  getSettings() {
    return this.projectsService.getAppSettings();
  }
}
