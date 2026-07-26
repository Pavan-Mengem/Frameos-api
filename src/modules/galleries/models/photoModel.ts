import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo, HasMany,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Studio } from '../../studios/models/studioModel';
import { Gallery } from './galleryModel';
import { Album } from './albumModel';
import { Favorite } from './favoriteModel';

export interface PhotoAttributes {
  id: string;
  studioId: string;
  galleryId: string;
  albumId: string | null;
  s3Key: string; // originals/{studioId}/{galleryId}/{photoId}.jpg
  s3ThumbKey: string | null; // thumbs/... written by the thumbnail worker
  originalFilename: string | null;
  mimeType: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isUploaded: boolean; // client confirms after successful PUT
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface PhotoCreationAttributes
  extends Optional<PhotoAttributes,
    'id' | 'albumId' | 's3ThumbKey' | 'originalFilename' | 'mimeType' | 'byteSize' | 'width' | 'height' |
    'sortOrder' | 'isUploaded' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

/** S3-backed asset. */
@Table({
  tableName: 'photos',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['studio_id'] },
    { fields: ['gallery_id'] },
    { fields: ['gallery_id', 'album_id'] },
    { unique: true, fields: ['s3_key'] },
  ],
})
export class Photo extends Model<PhotoAttributes, PhotoCreationAttributes> implements PhotoAttributes {
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

  @ForeignKey(() => Album)
  @Column(DataType.UUID)
  declare albumId: string | null;

  @BelongsTo(() => Album, { foreignKey: 'albumId', as: 'album' })
  declare album?: Album;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare s3Key: string;

  @Column(DataType.STRING)
  declare s3ThumbKey: string | null;

  @Column(DataType.STRING)
  declare originalFilename: string | null;

  @Column(DataType.STRING(80))
  declare mimeType: string | null;

  @Column(DataType.BIGINT)
  declare byteSize: number | null;

  @Column(DataType.INTEGER)
  declare width: number | null;

  @Column(DataType.INTEGER)
  declare height: number | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sortOrder: number;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isUploaded: boolean;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasMany(() => Favorite, { foreignKey: 'photoId', as: 'favorites' })
  declare favorites?: Favorite[];
}
