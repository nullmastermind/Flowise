import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { IChatRecord } from '../../Interface'

@Entity()
export class ChatRecord implements IChatRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid' })
  chatflowid: string

  @Column({ type: 'json' })
  chat_history: { message: string }[]

  @Column({ nullable: true })
  device_id?: string
}
