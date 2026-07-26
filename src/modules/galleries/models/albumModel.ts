import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo, HasMany,
  DataType, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Studio } from '../../studios/models/studioModel';
import { Gallery } from './galleryModel';
import { Photo } from './photoModel';

export interface AlbumAttributes {
  id: string;
  studioId: string;
  galleryId: string;
  title: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AlbumCreationAttributes
  extends Optional<AlbumAttributes, 'id' | 'sortOrder' | 'createdAt' | 'updatedAt'> {}

/** Optional grouping inside a gallery. */
@Table({
  tableName: 'albums',
  timestamps: true,
  paranoid: false,
  indexes: [{ fields: ['studio_id'] }, { fields: ['gallery_id'] }],
})
export class Album extends Model<AlbumAttributes, AlbumCreationAttributes> implements AlbumAttributes {
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

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sortOrder: number;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;

  @HasMany(() => Photo, { foreignKey: 'albumId', as: 'photos' })
  declare photos?: Photo[];
}
