import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
import { BaseSearchDto } from '../crud/dto/base-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DealerId } from '../../shared/decorators/dealer-id.decorator';
import { CurrentUser, AuthUser } from '../../shared/decorators/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthUser) {
    return this.userService.getProfile(user.id);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  search(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.userService.searchUsers(dto, dealerId);
  }
}
