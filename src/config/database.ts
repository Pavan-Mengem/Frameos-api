import { Sequelize } from 'sequelize-typescript';
import { env } from './env';
import { logger } from './logger';
import { Client } from '../modules/clients/models/clientModel';
import { Studio } from '../modules/studios/models/studioModel';
import { WebhookEvent } from '../modules/webhooks/models/webhookEventModel';
import { Counter } from '../modules/invoicing/models/counterModel';
import { Job } from '../modules/jobs/models/jobModel';
import { Lead } from '../modules/leads/models/leadModel';
import { Event } from '../modules/events/models/eventModel';
import { TeamAssignment } from '../modules/events/models/teamAssignmentModel';
import { User } from '../modules/users/models/userModel';
import { Otp } from '../modules/users/models/otpModel';
import { Quotation } from '../modules/quotations/models/quotationModel';
import { QuotationLineItem } from '../modules/quotations/models/quotationLineItemModel';
import { Payment } from '../modules/payments/models/paymentModel';
import { Invoice } from '../modules/payments/models/invoiceModel';
import { Gallery } from '../modules/galleries/models/galleryModel';
import { Album } from '../modules/galleries/models/albumModel';
import { Photo } from '../modules/galleries/models/photoModel';
import { Favorite } from '../modules/galleries/models/favoriteModel';

// sequelize-typescript's Sequelize subclasses the plain sequelize Sequelize class,
// so modules not yet converted to @Table decorators (using Model.init(...) directly)
// keep working unchanged against this same instance during the module-by-module migration.
export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'postgres',
  logging: env.isProd ? false : (msg) => logger.debug(msg),
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    underscored: true, // studio_id, created_at in DB; camelCase in code
    timestamps: true,
    paranoid: true,    // soft deletes (deleted_at)
  },
  // decorator-based (@Table) model classes get added here module by module
  models: [
    Client, Studio, WebhookEvent, Counter, Job, Lead, Event, TeamAssignment, User, Otp,
    Quotation, QuotationLineItem, Payment, Invoice, Gallery, Album, Photo, Favorite,
  ],
});
