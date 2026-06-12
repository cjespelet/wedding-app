import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes.js';
import { weddingRouter } from '../modules/wedding/wedding.routes.js';
import { rsvpRouter } from '../modules/rsvp/rsvp.routes.js';
import { galleryRouter } from '../modules/gallery/gallery.routes.js';
import { djRouter } from '../modules/dj/dj.routes.js';
import { guestbookRouter } from '../modules/guestbook/guestbook.routes.js';
import { adminRouter } from '../modules/admin/admin.routes.js';
import { checkinRouter } from '../modules/checkin/checkin.routes.js';
import { djMessagesRouter } from '../modules/dj-messages/dj-messages.routes.js';
import { menuRouter } from '../modules/menu/menu.routes.js';
import { songsRouter } from '../modules/songs/songs.routes.js';
import { uploadRouter } from '../modules/upload/upload.routes.js';
import { photosRouter } from '../modules/photos/photos.routes.js';
import { commentsRouter } from '../modules/comments/comments.routes.js';
import { notificationsRouter } from '../modules/notifications/notifications.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/wedding', weddingRouter);
apiRouter.use('/rsvp', rsvpRouter);
apiRouter.use('/gallery', galleryRouter);
apiRouter.use('/dj', djRouter);
apiRouter.use('/guestbook', guestbookRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/checkin', checkinRouter);
apiRouter.use('/dj-messages', djMessagesRouter);
apiRouter.use('/menu', menuRouter);
apiRouter.use('/songs', songsRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/photos', photosRouter);
apiRouter.use('/comments', commentsRouter);
apiRouter.use('/notifications', notificationsRouter);

