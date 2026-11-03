/** All MSW handlers. Each module mirrors one resource from PDF Section 5 or B5. */
import { authHandlers } from './auth'
import { demoHandlers } from './demo'
import { courseHandlers } from './courses'
import { materialHandlers } from './materials'
import { assignmentHandlers } from './assignments'
import { submissionHandlers } from './submissions'
import { doubtHandlers } from './doubts'
import { announcementHandlers } from './announcements'
import { leaderboardHandlers } from './leaderboard'
import { analyticsHandlers } from './analytics'
import { notificationHandlers } from './notifications'
import { adminHandlers } from './admin'
import { agentsHandlers } from './agents'

export const handlers = [
  ...authHandlers,
  ...courseHandlers,
  ...materialHandlers,
  ...assignmentHandlers,
  ...submissionHandlers,
  ...doubtHandlers,
  ...announcementHandlers,
  ...leaderboardHandlers,
  ...analyticsHandlers,
  ...notificationHandlers,
  ...adminHandlers,
  ...agentsHandlers,
  ...demoHandlers,
]

