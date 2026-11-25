import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateEventChatMessageDto {
  @Transform(({ obj, key }) => (typeof obj[key] === 'string' ? obj[key].trim() : obj[key]))
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;
}

export class SendEventChatMessageDto extends UpdateEventChatMessageDto {
  @IsUUID('4')
  id!: string;
}
