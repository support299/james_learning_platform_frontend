// Dummy data for the AgentGrowth prototype. No backend — everything is served
// from this module.

export const courses = [
  {
    id: 'advanced-ux-research',
    updatedAt: '2026-07-15',
    title: 'Advanced UX Research',
    category: 'Design',
    rating: 4.8,
    ratingCount: '980',
    description:
      'Run rigorous user research programs — from cognitive theory to actionable insight.',
    meta: 'In Progress',
    cta: 'Resume',
    lessons: [
      {
        id: 'cognitive-load-theory',
        title: 'Cognitive Load Theory',
        type: 'video',
        duration: '12:45',
        youtubeId: 'yfoY53QXEnI',
        completed: true,
        overview:
          'In this lesson, we explore the fundamental principles of Cognitive Load Theory (CLT) and how it dictates the way users interact with digital interfaces. Understanding the limits of working memory is crucial for creating efficient, accessible designs.',
        objectives: [
          'Identify the three types of cognitive load: Intrinsic, Extraneous, and Germane.',
          'Apply the "Coherence Principle" to remove unnecessary visual noise from your UI.',
          'Utilize spatial contiguity to reduce search time in complex dashboards.',
          'Master the art of progressive disclosure to manage intrinsic load.',
        ],
        proTip:
          'The best interface is one that requires the least amount of conscious thought to navigate. When extraneous load is minimized, the user can focus entirely on the educational content.',
      },
      {
        id: 'information-architecture',
        title: 'Information Architecture',
        type: 'video',
        duration: '18:20',
        youtubeId: 'hdI2bqOjy3c',
        overview:
          'Learn how to structure content so users can predict where things live. We cover card sorting, tree testing, and the trade-offs between broad and deep navigation hierarchies.',
        objectives: [
          'Run an open and a closed card sort and interpret the results.',
          'Design navigation hierarchies that balance breadth and depth.',
          'Validate a sitemap with tree testing before any UI is drawn.',
        ],
        proTip:
          'If users have to think about where something might be, the architecture has already failed. Test the structure before you test the screens.',
      },
      {
        id: 'user-flow-mapping',
        title: 'User Flow Mapping',
        type: 'video',
        duration: '15:10',
        youtubeId: 'w7ejDZ8SWv8',
        overview:
          'Turn research insight into concrete journeys. This lesson walks through mapping entry points, decision nodes, and failure states for a real onboarding flow.',
        objectives: [
          'Map an end-to-end flow including error and abandonment paths.',
          'Identify friction points using drop-off data.',
          'Communicate flows to engineering with a shared notation.',
        ],
        proTip:
          'Every arrow in a flow diagram is a promise to the user. Map the unhappy paths first — that is where trust is won or lost.',
      },
      {
        id: 'case-study-analysis',
        title: 'Case Study Analysis',
        type: 'text',
        duration: '10 mins',
        overview:
          'A written deep-dive into how a fintech dashboard team cut task time by 40% by applying the principles from this module.',
        body: [
          { type: 'h2', text: 'Background' },
          {
            type: 'p',
            text: 'Northwind Analytics shipped a portfolio dashboard that scored well in visual design reviews but performed poorly in the field: median task completion time was 74 seconds against a target of 45, and support tickets mentioning "can\'t find" grew 18% quarter over quarter.',
          },
          { type: 'h2', text: 'What the research showed' },
          {
            type: 'p',
            text: 'Session recordings and a 12-participant usability study pointed to extraneous cognitive load, not missing features. Users scanned four separate regions of the screen to assemble one answer, and the primary action was styled identically to three secondary ones.',
          },
          {
            type: 'ul',
            items: [
              'Eye-tracking heatmaps showed attention split across disconnected panels.',
              'Card sorting revealed users grouped metrics by goal, not by data source.',
              'Tree testing of the revised hierarchy hit 89% first-click success.',
            ],
          },
          { type: 'h2', text: 'The redesign' },
          {
            type: 'p',
            text: 'The team regrouped metrics around user goals, applied spatial contiguity to co-locate related figures, and used progressive disclosure to hide advanced filters behind a single control. No functionality was removed.',
          },
          { type: 'h2', text: 'Outcome' },
          {
            type: 'p',
            text: 'Median task time fell to 44 seconds within one release cycle, and "can\'t find" tickets dropped by a third. The lesson: measurable UX wins came from reducing load, not adding capability.',
          },
        ],
      },
      {
        id: 'module-quiz',
        title: 'Module Quiz',
        type: 'quiz',
        meta: '8 Questions',
        questionCount: 8,
        overview:
          'Check your understanding of cognitive load, information architecture, and flow mapping before moving to the next module.',
      },
    ],
  },
  {
    id: 'advanced-ui-systems',
    updatedAt: '2026-07-02',
    title: 'Advanced UI Systems',
    category: 'Design',
    rating: 4.9,
    ratingCount: '1.2k',
    description:
      'Master the architecture of scalable design systems using modern minimalist principles.',
    meta: 'In Progress',
    cta: 'Resume',
    lessons: [
      {
        id: 'design-tokens',
        title: 'Design Tokens Fundamentals',
        type: 'video',
        duration: '14:30',
        youtubeId: 'yfoY53QXEnI',
        completed: true,
        overview:
          'Design tokens are the atoms of a scalable UI system. Learn how to name, layer, and distribute them across platforms.',
        objectives: [
          'Structure a three-tier token hierarchy: primitive, semantic, component.',
          'Automate token distribution to web and native platforms.',
        ],
        proTip:
          'Name tokens for their role, never their value — "surface-raised" survives a rebrand, "gray-100" does not.',
      },
      {
        id: 'component-api-design',
        title: 'Component API Design',
        type: 'text',
        duration: '12 mins',
        overview: 'A written guide to designing component props that scale.',
        body: [
          { type: 'h2', text: 'Props are promises' },
          {
            type: 'p',
            text: 'Every prop you expose is a contract you must honor for years. This reading covers composition over configuration, slot patterns, and how to deprecate gracefully.',
          },
          {
            type: 'ul',
            items: [
              'Prefer children and slots to boolean explosion.',
              'Reserve variant props for visual identity, not behavior.',
              'Ship codemods alongside breaking changes.',
            ],
          },
        ],
      },
      {
        id: 'systems-quiz',
        title: 'Systems Check',
        type: 'quiz',
        meta: '6 Questions',
        questionCount: 6,
        overview: 'A quick check on tokens and component API principles.',
      },
    ],
  },
  {
    id: 'full-stack-architecture',
    updatedAt: '2026-06-18',
    title: 'Full-Stack Architecture',
    category: 'Tech',
    rating: 4.7,
    ratingCount: '840',
    description:
      'Building robust, high-performance web applications with modern frameworks and patterns.',
    meta: '12 Modules',
    cta: 'Start Learning',
    lessons: [
      {
        id: 'client-server-model',
        title: 'The Client-Server Model',
        type: 'video',
        duration: '16:05',
        youtubeId: 'hdI2bqOjy3c',
        overview:
          'A ground-up look at how browsers, APIs, and databases cooperate — the mental model every architectural decision builds on.',
        objectives: [
          'Trace a request from browser to database and back.',
          'Choose between REST and RPC-style endpoints.',
        ],
        proTip:
          'Latency budgets are architecture. Decide how many round trips a page is allowed before you draw a single box.',
      },
      {
        id: 'api-design-reading',
        title: 'API Design Principles',
        type: 'text',
        duration: '8 mins',
        overview: 'A reading on pragmatic API design.',
        body: [
          { type: 'h2', text: 'Design for the reader' },
          {
            type: 'p',
            text: 'An API is a user interface for developers. Consistency, predictable errors, and pagination-by-default matter more than theoretical purity.',
          },
          {
            type: 'ul',
            items: [
              'Version from day one, even if v1 is the only version for years.',
              'Return machine-readable error codes with human-readable messages.',
              'Make list endpoints paginated before anyone asks.',
            ],
          },
        ],
      },
      {
        id: 'react-in-practice',
        title: 'React in Practice',
        type: 'video',
        duration: '22:40',
        youtubeId: 'w7ejDZ8SWv8',
        overview:
          'Component boundaries, state colocation, and data fetching patterns for production React applications.',
        objectives: [
          'Split pages into components along data boundaries.',
          'Colocate state with the components that own it.',
        ],
        proTip:
          'If two pieces of state always change together, they are one piece of state.',
      },
    ],
  },
  {
    id: 'strategic-leadership',
    updatedAt: '2026-05-30',
    title: 'Strategic Leadership',
    category: 'Business',
    rating: 4.8,
    ratingCount: '2.1k',
    description:
      'Develop management techniques for high-performance teams in the digital age.',
    meta: 'Self-Paced',
    cta: 'Resume',
    lessons: [
      {
        id: 'leading-through-change',
        title: 'Leading Through Change',
        type: 'video',
        duration: '19:15',
        youtubeId: 'PkZNo7MFNFg',
        completed: true,
        overview:
          'Change management frameworks for engineering and product leaders navigating reorganizations and strategy shifts.',
        objectives: [
          'Communicate a strategy change without losing team trust.',
          'Sequence quick wins to build momentum.',
        ],
        proTip:
          'People do not resist change; they resist loss. Name what is being lost and the resistance halves.',
      },
      {
        id: 'delegation-frameworks',
        title: 'Delegation Frameworks',
        type: 'text',
        duration: '9 mins',
        overview: 'A reading on the ladder of delegation.',
        body: [
          { type: 'h2', text: 'The delegation ladder' },
          {
            type: 'p',
            text: 'Delegation is not binary. This reading introduces a seven-rung ladder from "do exactly this" to "own this outcome" and shows how to pick the rung per person, per task.',
          },
          {
            type: 'ul',
            items: [
              'Match the rung to competence and confidence, not seniority.',
              'State the rung out loud — ambiguity is where delegation fails.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'product-thinking',
    updatedAt: '2026-07-10',
    title: 'Product Thinking',
    category: 'Design',
    rating: 5.0,
    ratingCount: '340',
    description:
      'Bridge the gap between design and business objectives through rigorous methodology.',
    meta: 'Popular',
    cta: 'Start Learning',
    lessons: [
      {
        id: 'outcomes-over-output',
        title: 'Outcomes over Output',
        type: 'video',
        duration: '13:50',
        youtubeId: 'Ke90Tje7VS0',
        overview:
          'Why shipping features is not the goal, and how to reframe roadmaps around measurable user outcomes.',
        objectives: [
          'Write outcome-based OKRs for a product team.',
          'Kill a feature idea using opportunity-cost framing.',
        ],
        proTip:
          'A roadmap of features is a list of guesses. A roadmap of outcomes is a list of bets you can measure.',
      },
      {
        id: 'discovery-reading',
        title: 'Continuous Discovery Habits',
        type: 'text',
        duration: '11 mins',
        overview: 'A reading on weekly discovery cadences.',
        body: [
          { type: 'h2', text: 'Talk to users every week' },
          {
            type: 'p',
            text: 'Teams that interview weekly compound learning the way savings compound interest. This reading covers recruiting automation, interview snapshots, and opportunity solution trees.',
          },
        ],
      },
    ],
  },
  {
    id: 'devops-for-scale',
    updatedAt: '2026-04-22',
    title: 'DevOps for Scale',
    category: 'Tech',
    rating: 4.6,
    ratingCount: '920',
    description:
      'Learn the industrial-grade processes for continuous integration and delivery at scale.',
    meta: 'Intermediate',
    cta: 'Resume',
    lessons: [
      {
        id: 'ci-fundamentals',
        title: 'CI Fundamentals',
        type: 'video',
        duration: '17:25',
        youtubeId: 'fBNz5xF-Kx4',
        completed: true,
        overview:
          'Pipelines, caching, and flake management — the foundations of a CI system developers trust.',
        objectives: [
          'Design a pipeline that fails fast and caches aggressively.',
          'Quarantine flaky tests without losing signal.',
        ],
        proTip:
          'A ten-minute pipeline that developers trust beats a three-minute one they retry twice.',
      },
      {
        id: 'deployment-strategies',
        title: 'Deployment Strategies',
        type: 'text',
        duration: '10 mins',
        overview: 'A reading comparing rollout strategies.',
        body: [
          { type: 'h2', text: 'Choosing a rollout strategy' },
          {
            type: 'p',
            text: 'Blue-green, canary, and feature-flagged rollouts each trade speed against blast radius. This reading gives a decision table for choosing per service.',
          },
          {
            type: 'ul',
            items: [
              'Canary when you have good metrics; blue-green when you need instant rollback.',
              'Feature flags decouple deploy from release — use them for anything user-visible.',
            ],
          },
        ],
      },
      {
        id: 'devops-quiz',
        title: 'Pipeline Quiz',
        type: 'quiz',
        meta: '5 Questions',
        questionCount: 5,
        overview: 'Check your understanding of CI/CD fundamentals.',
      },
    ],
  },
  {
    id: 'venture-dynamics',
    updatedAt: '2026-06-05',
    title: 'Venture Dynamics',
    category: 'Business',
    rating: 4.9,
    ratingCount: '1.5k',
    description:
      'Navigate the complexities of funding, growth, and sustainable business modeling.',
    meta: 'New',
    cta: 'Start Learning',
    lessons: [
      {
        id: 'funding-landscape',
        title: 'The Funding Landscape',
        type: 'video',
        duration: '20:10',
        youtubeId: 'rfscVS0vtbw',
        overview:
          'From pre-seed to Series B: what investors evaluate at each stage and how the bar moves.',
        objectives: [
          'Map your company to the right funding stage and instrument.',
          'Build a metrics narrative investors can verify.',
        ],
        proTip:
          'Raise on momentum, not on runway. The best time to fundraise is when you do not need to.',
      },
      {
        id: 'unit-economics',
        title: 'Unit Economics Deep Dive',
        type: 'text',
        duration: '12 mins',
        overview: 'A reading on CAC, LTV, and payback periods.',
        body: [
          { type: 'h2', text: 'The three numbers that matter' },
          {
            type: 'p',
            text: 'Customer acquisition cost, lifetime value, and payback period tell you whether growth is building a business or burning one. This reading works through the math with two contrasting SaaS examples.',
          },
          {
            type: 'ul',
            items: [
              'Blend CAC across channels, but never hide a failing channel in the blend.',
              'A payback period over 18 months needs a strategic justification, not an optimistic one.',
            ],
          },
        ],
      },
    ],
  },
]

export const categories = ['All', 'Design', 'Tech', 'Business']

export function getCourse(courseId) {
  return courses.find((c) => c.id === courseId)
}

export function getLesson(course, lessonId) {
  return course?.lessons.find((l) => l.id === lessonId)
}

export function firstLessonPath(course) {
  if (!course.lessons?.length) return null
  const next =
    course.lessons.find((l) => !l.completed) ?? course.lessons[0]
  return `/course/${course.id}/lesson/${next.id}`
}
