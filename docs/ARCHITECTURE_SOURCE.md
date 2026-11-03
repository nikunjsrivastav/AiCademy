# ARCHITECTURE_SOURCE.md

> Verbatim copy of "PART A: THE ARCHITECTURE PROPOSAL (SOURCE OF TRUTH)" as supplied by the project owner on 2026-10-05.
> The original PDF is not in the repository; this file replaces it. Do not edit the content below. Record deltas and decisions in /brain.md instead.

---

AiCademy: System Architecture Proposal

1. PROJECT OVERVIEW
AiCademy will be an AI-enabled digital classroom platform for university courses. The system will allow professors to organize courses, publish learning materials, create assignments, communicate with students, and review course performance. Students will be able to enroll in courses, access materials, submit assignments, ask course-related questions, and monitor their academic progress.
The platform will combine conventional classroom-management features with artificial intelligence. An AI service will provide retrieval-augmented answers based on course materials, evaluate assignment submissions against rubrics, assess the quality of student questions, and generate teaching suggestions from learning data.

2. PROPOSED TECH STACK
- Frontend: React and React Router. Provides a responsive single-page classroom interface.
- Frontend tooling: Vite. Used for development, bundling, and local previews.
- Frontend communications: Axios and REST. Handles authenticated HTTP requests to the server.
- Backend API: Node.js and Express. Exposes business operations, enforces authentication, and manages uploads.
- Database: MongoDB. Stores users, courses, assignments, and learning data.
- AI service: FastAPI. Isolates specialized AI workflows from the main API.
- Vector search: ChromaDB. Embeds and searches course-material chunks for RAG.
- Language model: OpenAI / Groq. Generates answers and structured evaluation results.
- File processing: Multer and a PDF extractor. Receives educational documents and extracts text.
- Authentication: JWT and bcryptjs. Hashes passwords and authorizes protected requests.
- Deployment: Docker and Docker Compose. Packages services for reproducible deployments.

3. PLANNED SYSTEM ARCHITECTURE
A layered client-server model with a supporting AI microservice. The Express API is the central application boundary, while the AI service handles computationally specialized operations.
Flow: User (Student / Professor) -> React Web Client (Vite) -> [REST / JWT] -> Express API (Auth and Domain) -> MongoDB and File Storage; Express API -> [Internal HTTP] -> FastAPI AI Service (Retrieval and Scoring) -> ChromaDB and Language Model.

3.1 Client Layer
The client provides login and registration screens, protected student and professor workspaces, course navigation, material management, assignment workflows, doubt-solving conversations, announcements, leaderboards, and analytics. Authentication state is held at the client layer for navigation and attached to API requests through bearer tokens.

3.2 Application Layer
The Express server follows an MVC-oriented organization. Routing modules map HTTP requests to controllers. Controllers validate inputs, apply role and resource permissions, invoke persistence operations, and coordinate calls to the AI service. Middleware handles security headers, cross-origin configuration, request parsing, logging, rate limiting, authentication, and file uploads.

3.3 AI Layer
The FastAPI service exposes narrowly scoped internal endpoints. It processes material ingestion, retrieves relevant course context, generates doubt responses, evaluates submissions, and scores question quality. It uses a vector store for course-specific retrieval and falls back to deterministic heuristics when an external model is unavailable.

3.4 Service Interaction
The browser never accesses MongoDB, the vector store, or the model provider directly. The API verifies identity and permissions before it reads or modifies application data or requests an AI operation. Internal service credentials and model-provider credentials remain on the server side.

4. PROPOSED DATA MODELS
The database uses document-oriented entities with references between users, courses, and learning activities.
- User: name, email address, password hash, role, profile information. Roles: student, professor, administrator.
- Course: public course identifier, name, description, enrollment code, professor reference, enrolled student references.
- Material: course ownership, title, description, material type, file location, uploader reference, vector-indexing metadata.
- Assignment: course ownership, title, description, rubric criteria, maximum marks, due date, project classification, creator reference.
- Submission: connects a student to an assignment; contains a file location, extracted-text status, evaluation status, marks, feedback, mistakes, suggestions, and confidence information.
- Doubt: course and student references, an optional conversation session, the question, generated answer, source citations, and a quality score.
- Announcement: course reference, author reference, message content, and optional links to assignments or projects.
- Comment: connects a user to an announcement; contains comment text and timestamps.
- Leaderboard: course-level ranking snapshots derived from assignment, project, and doubt-related scores.
- Chat-clear marker: stores a student and course timestamp so that a conversation can be visually cleared without immediately deleting historical records.
Application state is persisted in MongoDB. Uploaded documents are initially stored in managed local or mounted storage, with a design that allows later migration to object storage. Vector records include course and material identifiers so that retrieval remains restricted to the relevant course.

5. ANTICIPATED API / ROUTING STRUCTURE
All public application routes are grouped under /api. Protected routes require a valid bearer token and apply role-specific authorization.

5.1 Authentication
- POST /api/auth/register: create a user account and return an access token.
- POST /api/auth/login: authenticate a user and return an access token.
- GET /api/auth/me: return the authenticated user profile.

5.2 Courses and Materials
- POST /api/courses: create a course for an authorized professor.
- GET /api/courses: list courses relevant to the authenticated user.
- POST /api/courses/:courseId/enroll: enroll a student.
- GET /api/courses/:courseId/students: return an authorized course roster.
- POST /api/materials: upload and register course material.
- GET /api/materials/course/:courseId: list materials for a course.
- PUT /api/materials/:materialId and DELETE /api/materials/:materialId: manage material records.
- POST /api/materials/:materialId/reindex: request vector reindexing.

5.3 Assignments and Submissions
- POST /api/assignments: create an assignment.
- GET /api/assignments/course/:courseId: list course assignments.
- PUT /api/assignments/:assignmentId and DELETE /api/assignments/:assignmentId: manage assignments.
- POST /api/submissions/:assignmentId/upload: accept a student submission.
- GET /api/submissions/:assignmentId: return submissions for an authorized viewer.
- PUT /api/submissions/:submissionId/score: allow an authorized professor to update a score.

5.4 AI-assisted Learning and Communication
- POST /api/doubts/ask: submit a student question for course-scoped AI assistance.
- GET /api/doubts/course/:courseId: retrieve permitted doubt history.
- POST /api/doubts/course/:courseId/clear: create a chat-clear marker.
- POST /api/announcements: publish a course announcement.
- GET /api/announcements/course/:courseId: list announcements.
- POST /api/announcements/:announcementId/comments: add a comment.
- POST /api/leaderboard/:courseId/recompute: recalculate rankings.
- GET /api/leaderboard/:courseId: retrieve rankings.
- GET /api/analytics/:courseId: return professor-facing learning analytics.
The AI service exposes internal routes such as /ingest-material, /evaluate-assignment, /ask-doubt-rag, and /score-doubt-quality. These are callable by the application API and are not exposed as the primary browser interface.

6. FUTURE CHALLENGES AND CONSIDERATIONS
- Security: validate JWTs, hash passwords, enforce server-side role and resource ownership checks, restrict upload types and sizes, sanitize filenames, keep model credentials outside client code.
- Privacy: student submissions, questions, and performance data require controlled access, retention policies, and careful handling of personally identifiable information.
- AI reliability: generated answers and evaluations require source citations, structured output validation, confidence indicators, fallback behavior, and possible professor review.
- Retrieval quality: material parsing, chunk size, embedding quality, metadata filtering, and stale-index cleanup affect the accuracy of course-specific answers.
- Scalability: synchronous evaluation and analytics could become bottlenecks. Consider background jobs, queues, caching, and asynchronous status updates as usage grows.
- File storage: local storage is convenient for development but lacks durability and horizontal scalability. Evaluate object storage and malware scanning for production.
- Service resilience: timeouts, retries, health checks, readiness checks, and graceful degradation are needed when MongoDB, the vector store, or the model provider is unavailable.
- Data consistency: submission status, material indexing status, leaderboard snapshots, and AI results need idempotent updates so retries do not create contradictory records.
- Observability: centralized logs, request identifiers, metrics, and audit events make API and AI failures diagnosable.
- Model and cost management: control token limits, rate limits, model selection, and prompt size to keep response time and provider costs predictable.
