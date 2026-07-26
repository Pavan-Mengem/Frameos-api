import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo,
  DataType, CreatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Studio } from '../../studios/models/studioModel';
import { Gallery } from './galleryModel';
import { Photo } from './photoModel';

export interface FavoriteAttributes {
  id: string;
  studioId: string;
  galleryId: string;
  photoId: string;
  clientIdentifier: string; // opaque token from browser localStorage
  createdAt?: Date;
}

export interface FavoriteCreationAttributes
  extends Optional<FavoriteAttributes, 'id' | 'createdAt'> {}

/** Client-side "likes"; no client login. */
@Table({
  tableName: 'favorites',
  timestamps: true,
  updatedAt: false,
  paranoid: false,
  indexes: [
    { fields: ['studio_id'] },
    { fields: ['gallery_id'] },
    { unique: true, fields: ['photo_id', 'client_identifier'] },
  ],
})
export class Favorite extends Model<FavoriteAttributes, FavoriteCreationAttributes> implements FavoriteAttributes {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Studio)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare studioId: string;

  @BelongsTo(() => Studio, { foreignKey: 'studioId', as: 'studio' })
  declare studio?: Studio;

  @ForeignKey(() => Gallery)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare galleryId: string;

  @BelongsTo(() => Gallery, { foreignKey: 'galleryId', as: 'gallery' })
  declare gallery?: Gallery;

  @ForeignKey(() => Photo)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare photoId: string;

  @BelongsTo(() => Photo, { foreignKey: 'photoId', as: 'photo' })
  declare photo?: Photo;

  @AllowNull(false)
  @Column(DataType.STRING(80))
  declare clientIdentifier: string;

  @CreatedAt declare createdAt: Date;
}
