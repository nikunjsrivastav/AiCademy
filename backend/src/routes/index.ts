import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { uploadMaterial, uploadSubmission } from '../middleware/upload.js'

import * as authCtrl from '../controllers/authController.js'
import * as coursesCtrl from '../controllers/coursesController.js'
import * as materialsCtrl from '../controllers/materialsController.js'
import * as assignmentsCtrl from '../controllers/assignmentsController.js'
import * as submissionsCtrl from '../controllers/submissionsController.js'
import * as doubtsCtrl from '../controllers/doubtsController.js'
import * as announcementsCtrl from '../controllers/announcementsController.js'
import * as leaderboardCtrl from '../controllers/leaderboardController.js'
import * as analyticsCtrl from '../controllers/analyticsController.js'
import * as agentsCtrl from '../controllers/agentsController.js'
import * as adminCtrl from '../controllers/adminController.js'
import * as notificationsCtrl from '../controllers/notificationsController.js'
import * as searchCtrl from '../controllers/searchController.js'

export const apiRouter = Router()

// 5.1 Authentication
apiRouter.post('/auth/register', authCtrl.register)
apiRouter.post('/auth/login', authCtrl.login)
apiRouter.get('/auth/me', requireAuth, authCtrl.getMe)

// 5.2 Courses
apiRouter.get('/courses', requireAuth, coursesCtrl.listCourses)
apiRouter.get('/courses/lookup', requireAuth, coursesCtrl.lookupCourse)
apiRouter.get('/courses/:courseId', requireAuth, coursesCtrl.getCourse)
apiRouter.post('/courses', requireAuth, requireRole(['professor', 'administrator']), coursesCtrl.createCourse)
apiRouter.post('/courses/:courseId/enroll', requireAuth, coursesCtrl.enrollCourse)
apiRouter.get('/courses/:courseId/students', requireAuth, coursesCtrl.getCourseStudents)
apiRouter.post('/courses/:courseId/regenerate-code', requireAuth, coursesCtrl.regenerateCode)

// 5.2 Materials
apiRouter.get('/materials/course/:courseId', requireAuth, materialsCtrl.listMaterials)
apiRouter.post(
  '/materials',
  requireAuth,
  requireRole(['professor', 'administrator']),
  uploadMaterial.single('file'),
  materialsCtrl.uploadMaterial
)
apiRouter.delete('/materials/:materialId', requireAuth, materialsCtrl.deleteMaterial)
apiRouter.post('/materials/:materialId/reindex', requireAuth, materialsCtrl.reindexMaterial)

// 5.3 Assignments
apiRouter.get('/assignments/course/:courseId', requireAuth, assignmentsCtrl.listAssignments)
apiRouter.get('/assignments/:assignmentId', requireAuth, assignmentsCtrl.getAssignment)
apiRouter.post(
  '/assignments',
  requireAuth,
  requireRole(['professor', 'administrator']),
  assignmentsCtrl.createAssignment
)
apiRouter.delete(
  '/assignments/:assignmentId',
  requireAuth,
  requireRole(['professor', 'administrator']),
  assignmentsCtrl.deleteAssignment
)

// 5.3 Submissions
apiRouter.get('/submissions/:assignmentId', requireAuth, submissionsCtrl.listSubmissions)
apiRouter.post(
  '/submissions/:assignmentId/upload',
  requireAuth,
  uploadSubmission.single('file'),
  submissionsCtrl.uploadSubmission
)
apiRouter.put('/submissions/:submissionId/score', requireAuth, submissionsCtrl.scoreSubmission)

// 5.4 Doubts & AI Tutor
apiRouter.post('/doubts/ask', requireAuth, doubtsCtrl.askDoubt)
apiRouter.get('/doubts/course/:courseId', requireAuth, doubtsCtrl.listDoubts)
apiRouter.post('/doubts/course/:courseId/clear', requireAuth, doubtsCtrl.clearChat)

// 5.4 Announcements & Comments
apiRouter.get('/announcements/course/:courseId', requireAuth, announcementsCtrl.listAnnouncements)
apiRouter.post(
  '/announcements',
  requireAuth,
  requireRole(['professor', 'administrator']),
  announcementsCtrl.createAnnouncement
)
apiRouter.post('/announcements/:announcementId/comments', requireAuth, announcementsCtrl.addComment)

// 5.4 Leaderboard & Analytics
apiRouter.get('/leaderboard/:courseId', requireAuth, leaderboardCtrl.getLeaderboard)
apiRouter.post('/leaderboard/:courseId/recompute', requireAuth, leaderboardCtrl.recomputeLeaderboard)
apiRouter.get('/analytics/:courseId', requireAuth, analyticsCtrl.getAnalytics)

// B5 Agents & Approvals (EXTENSION)
apiRouter.get('/agents/runs', requireAuth, agentsCtrl.listRuns)
apiRouter.post('/agents/runs', requireAuth, agentsCtrl.startRun)
apiRouter.get('/agents/runs/:runId', requireAuth, agentsCtrl.getRunTrace)
apiRouter.post('/agents/runs/:runId/cancel', requireAuth, agentsCtrl.cancelRun)
apiRouter.get('/agents/approvals', requireAuth, agentsCtrl.listApprovals)
apiRouter.post('/agents/approvals/:approvalId/decide', requireAuth, agentsCtrl.decideApproval)
apiRouter.get('/agents/policy/:courseId', requireAuth, agentsCtrl.getPolicy)
apiRouter.put('/agents/policy/:courseId', requireAuth, agentsCtrl.updatePolicy)
apiRouter.get('/agents/memory/:courseId', requireAuth, agentsCtrl.listMemories)
apiRouter.delete('/agents/memory/:memoryId', requireAuth, agentsCtrl.deleteMemory)
apiRouter.get('/agents/study-plan/:courseId', requireAuth, agentsCtrl.getStudyPlan)
apiRouter.get('/agents/insights/:courseId', requireAuth, agentsCtrl.getInsights)
apiRouter.get('/agents/tools', requireAuth, agentsCtrl.listTools)

// Admin Platform Routes (EXTENSION)
apiRouter.get('/admin/users', requireAuth, requireRole(['administrator']), adminCtrl.getAdminUsers)
apiRouter.get('/admin/courses', requireAuth, requireRole(['administrator']), adminCtrl.getAdminCourses)

// Notifications & Search (EXTENSION)
apiRouter.get('/notifications', requireAuth, notificationsCtrl.listNotifications)
apiRouter.post('/notifications/mark-all-read', requireAuth, notificationsCtrl.markAllRead)
apiRouter.put('/notifications/:id/read', requireAuth, notificationsCtrl.markRead)
apiRouter.get('/search', requireAuth, searchCtrl.searchGlobal)

