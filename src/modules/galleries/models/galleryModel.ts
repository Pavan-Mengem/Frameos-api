import {
  Table, Column, Model, PrimaryKey, AutoIncrement, Default, AllowNull, ForeignKey, BelongsTo, HasMany,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Studio } from '../../studios/models/studioModel';
import { Event } from '../../events/models/eventModel';
import { Album } from './albumModel';
import { Photo } from './photoModel';
import { Favorite } from './favoriteModel';

export interface GalleryAttributes {
  id: number;
  studioId: string;
  eventId: number | null;
  title: string;
  slug: string; // public URL segment (unique globally)
  passwordHash: string | null; // null → no password
  expiresAt: Date | null;
  isActive: boolean;
  coverPhotoId: number | null;
  viewCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface GalleryCreationAttributes
  extends Optional<GalleryAttributes,
    'id' | 'eventId' | 'passwordHash' | 'expiresAt' | 'isActive' | 'coverPhotoId' | 'viewCount' |
    'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

@Table({
  tableName: 'galleries',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['studio_id'] },
    { fields: ['studio_id', 'event_id'] },
    { unique: true, fields: ['slug'] },
  ],
})
export class Gallery extends Model<GalleryAttributes, GalleryCreationAttributes> implements GalleryAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Studio)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare studioId: string;

  @BelongsTo(() => Studio, { foreignKey: 'studioId', as: 'studio' })
  declare studio?: Studio;

  @ForeignKey(() => Event)
  @Column(DataType.INTEGER)
  declare eventId: number | null;

  @BelongsTo(() => Event, { foreignKey: 'eventId', as: 'event' })
  declare event?: Event;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column(DataType.STRING(80))
  declare slug: string;

  @Column(DataType.STRING)
  declare passwordHash: string | null;

  @Column(DataType.DATE)
  declare expiresAt: Date | null;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @Column(DataType.INTEGER)
  declare coverPhotoId: number | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare viewCount: number;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasMany(() => Album, { foreignKey: 'galleryId', as: 'albums' })
  declare albums?: Album[];

  @HasMany(() => Photo, { foreignKey: 'galleryId', as: 'photos' })
  declare photos?: Photo[];

  @HasMany(() => Favorite, { foreignKey: 'galleryId', as: 'favorites' })
  declare favorites?: Favorite[];
}
