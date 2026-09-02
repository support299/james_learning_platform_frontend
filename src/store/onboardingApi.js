import { createApi } from '@reduxjs/toolkit/query/react'
import { authBaseQuery } from './authApi.js'

function fromUser(u) {
  if (!u) return null
  const displayName =
    [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    displayName,
  }
}

function fromChecklist(item) {
  return {
    id: item.id,
    label: item.label,
    isRequired: item.is_required,
    isCompleted: item.is_completed,
    completedBy: fromUser(item.completed_by),
    completedAt: item.completed_at,
    owner: fromUser(item.owner),
    comment: item.comment || '',
    isFlagged: item.is_flagged,
    sortOrder: item.sort_order,
    updatedAt: item.updated_at,
  }
}

function fromCarrierReq(req) {
  return {
    id: req.id,
    carrier: req.carrier,
    carrierName: req.carrier_name,
    carrierCode: req.carrier_code,
    carrierLine: req.carrier_line || 'life',
    status: req.status,
    isRequired: req.is_required,
    owner: fromUser(req.owner),
    comment: req.comment || '',
    isFlagged: req.is_flagged,
    completedBy: fromUser(req.completed_by),
    completedAt: req.completed_at,
    updatedAt: req.updated_at,
  }
}

function fromAgent(a) {
  return {
    id: a.id,
    fullName: a.full_name,
    cohort: a.cohort,
    cohortName: a.cohort_name,
    cohortStartDate: a.cohort_start_date,
    startDate: a.start_date,
    owner: fromUser(a.owner),
    role: a.role || '',
    state: a.state || '',
    agentType: a.agent_type || '',
    manuallyAtRisk: a.manually_at_risk,
    lastUpdatedBy: fromUser(a.last_updated_by),
    completionPercent: a.completion_percent,
    outstanding: a.outstanding || [],
    status: a.status,
    checklist: (a.checklist || []).map(fromChecklist),
    carriers: (a.carriers || []).map(fromCarrierReq),
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }
}

function fromCohort(c) {
  return {
    id: c.id,
    name: c.name,
    startDate: c.start_date,
    isActive: c.is_active,
    notes: c.notes || '',
    agentCount: c.agent_count ?? 0,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }
}

function fromPage(res, map) {
  if (res && Array.isArray(res.results)) {
    return { count: res.count, results: res.results.map(map) }
  }
  return { count: Array.isArray(res) ? res.length : 0, results: (res || []).map(map) }
}

function qs(params) {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value)
    }
  })
  const s = search.toString()
  return s ? `?${s}` : ''
}

export const onboardingApi = createApi({
  reducerPath: 'onboardingApi',
  baseQuery: authBaseQuery,
  tagTypes: [
    'OnboardingAgent',
    'OnboardingCohort',
    'OnboardingDashboard',
    'OnboardingAudit',
    'OnboardingSettings',
    'OnboardingCatalog',
    'OnboardingSync',
  ],
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => 'onboarding/dashboard/',
      transformResponse: (d) => ({
        activeCohorts: d.active_cohorts,
        agentCount: d.agent_count,
        overallCompletion: d.overall_completion,
        onTrack: d.on_track,
        atRisk: d.at_risk,
        overdue: d.overdue,
        outstandingCount: d.outstanding_count,
        cohorts: (d.cohorts || []).map(fromCohort),
        recentActivity: (d.recent_activity || []).map((e) => ({
          id: e.id,
          action: e.action,
          label: e.label,
          actor: fromUser(e.actor),
          agent: e.agent,
          agentName: e.agent_name,
          createdAt: e.created_at,
        })),
      }),
      providesTags: ['OnboardingDashboard'],
    }),
    getAgents: builder.query({
      query: (params) => `onboarding/agents/${qs(params)}`,
      transformResponse: (res) => fromPage(res, fromAgent),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((a) => ({ type: 'OnboardingAgent', id: a.id })),
              { type: 'OnboardingAgent', id: 'LIST' },
            ]
          : [{ type: 'OnboardingAgent', id: 'LIST' }],
    }),
    getAgent: builder.query({
      query: (id) => `onboarding/agents/${id}/`,
      transformResponse: fromAgent,
      providesTags: (result, error, id) => [{ type: 'OnboardingAgent', id }],
    }),
    createAgent: builder.mutation({
      query: (body) => ({
        url: 'onboarding/agents/',
        method: 'POST',
        body,
      }),
      transformResponse: fromAgent,
      invalidatesTags: [
        { type: 'OnboardingAgent', id: 'LIST' },
        'OnboardingDashboard',
        'OnboardingCohort',
      ],
    }),
    updateAgent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `onboarding/agents/${id}/`,
        method: 'PATCH',
        body,
      }),
      transformResponse: fromAgent,
      invalidatesTags: (result, error, { id }) => [
        { type: 'OnboardingAgent', id },
        { type: 'OnboardingAgent', id: 'LIST' },
        'OnboardingDashboard',
        'OnboardingAudit',
        'OnboardingCohort',
      ],
    }),
    deleteAgent: builder.mutation({
      query: (id) => ({ url: `onboarding/agents/${id}/`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'OnboardingAgent', id },
        { type: 'OnboardingAgent', id: 'LIST' },
        'OnboardingDashboard',
        'OnboardingCohort',
        'OnboardingAudit',
      ],
    }),
    bulkCreateAgents: builder.mutation({
      query: (body) => ({
        url: 'onboarding/agents/bulk/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'OnboardingAgent', id: 'LIST' },
        'OnboardingDashboard',
        'OnboardingCohort',
      ],
    }),
    patchChecklistItem: builder.mutation({
      query: ({ agentId, itemId, ...body }) => ({
        url: `onboarding/agents/${agentId}/checklist/${itemId}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { agentId }) => [
        { type: 'OnboardingAgent', id: agentId },
        { type: 'OnboardingAgent', id: 'LIST' },
        'OnboardingDashboard',
        'OnboardingAudit',
      ],
    }),
    patchCarrierRequirement: builder.mutation({
      query: ({ agentId, reqId, ...body }) => ({
        url: `onboarding/agents/${agentId}/carriers/${reqId}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { agentId }) => [
        { type: 'OnboardingAgent', id: agentId },
        { type: 'OnboardingAgent', id: 'LIST' },
        'OnboardingDashboard',
        'OnboardingAudit',
      ],
    }),
    getCohorts: builder.query({
      query: () => 'onboarding/cohorts/',
      transformResponse: (res) => fromPage(res, fromCohort),
      providesTags: ['OnboardingCohort'],
    }),
    createCohort: builder.mutation({
      query: (body) => ({
        url: 'onboarding/cohorts/',
        method: 'POST',
        body,
      }),
      transformResponse: fromCohort,
      invalidatesTags: ['OnboardingCohort', 'OnboardingDashboard'],
    }),
    updateCohort: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `onboarding/cohorts/${id}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['OnboardingCohort', 'OnboardingDashboard'],
    }),
    deleteCohort: builder.mutation({
      query: (id) => ({ url: `onboarding/cohorts/${id}/`, method: 'DELETE' }),
      invalidatesTags: [
        'OnboardingCohort',
        'OnboardingDashboard',
        { type: 'OnboardingAgent', id: 'LIST' },
        'OnboardingAudit',
      ],
    }),
    getAudit: builder.query({
      query: (params) => `onboarding/audit/${qs(params)}`,
      transformResponse: (res) => ({
        count: res.count,
        results: (res.results || []).map((row) => ({
          agentId: row.agent_id,
          agentName: row.agent_name,
          cohortId: row.cohort_id,
          cohortName: row.cohort_name,
          startDate: row.start_date,
          itemType: row.item_type,
          itemId: row.item_id,
          label: row.label,
          carrier: row.carrier,
          owner: fromUser(row.owner),
          status: row.status,
          agentStatus: row.agent_status,
          comment: row.comment || '',
          isFlagged: row.is_flagged,
          dueContext: row.due_context,
        })),
      }),
      providesTags: ['OnboardingAudit'],
    }),
    getSettings: builder.query({
      query: () => 'onboarding/settings/',
      transformResponse: (s) => ({
        atRiskAfterDays: s.at_risk_after_days,
        overdueAfterDays: s.overdue_after_days,
        defaultTemplate: s.default_template,
        syncEnabled: s.sync_enabled,
        sheetConfigured: s.sheet_configured,
        sheetTab: s.sheet_tab,
        syncState: s.sync_state,
        updatedAt: s.updated_at,
      }),
      providesTags: ['OnboardingSettings'],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({
        url: 'onboarding/settings/',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['OnboardingSettings', 'OnboardingDashboard'],
    }),
    getSync: builder.query({
      query: () => 'onboarding/sync/',
      providesTags: ['OnboardingSync'],
    }),
    triggerSync: builder.mutation({
      query: () => ({ url: 'onboarding/sync/', method: 'POST' }),
      invalidatesTags: ['OnboardingSync', 'OnboardingSettings'],
    }),
    getStaff: builder.query({
      query: () => 'onboarding/staff/',
      transformResponse: (rows) => rows.map(fromUser),
    }),
    getCarriers: builder.query({
      query: () => 'onboarding/carriers/',
      transformResponse: (res) => (res.results ?? res).map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        line: c.line || 'life',
        isActive: c.is_active,
        sortOrder: c.sort_order,
      })),
      providesTags: ['OnboardingCatalog'],
    }),
    createCarrier: builder.mutation({
      query: (body) => ({ url: 'onboarding/carriers/', method: 'POST', body }),
      invalidatesTags: ['OnboardingCatalog'],
    }),
    deleteCarrier: builder.mutation({
      query: (id) => ({ url: `onboarding/carriers/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['OnboardingCatalog'],
    }),
    getChecklistDefinitions: builder.query({
      query: () => 'onboarding/checklist-definitions/',
      transformResponse: (res) => (res.results ?? res).map((d) => ({
        id: d.id,
        label: d.label,
        isRequired: d.is_required,
        isActive: d.is_active,
        sortOrder: d.sort_order,
      })),
      providesTags: ['OnboardingCatalog'],
    }),
    createChecklistDefinition: builder.mutation({
      query: (body) => ({
        url: 'onboarding/checklist-definitions/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OnboardingCatalog'],
    }),
    deleteChecklistDefinition: builder.mutation({
      query: (id) => ({
        url: `onboarding/checklist-definitions/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OnboardingCatalog'],
    }),
    getTemplates: builder.query({
      query: () => 'onboarding/templates/',
      transformResponse: (res) => (res.results ?? res).map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        state: t.state,
        agentType: t.agent_type,
        isDefault: t.is_default,
        isActive: t.is_active,
        carriers: t.carriers,
        items: t.items,
      })),
      providesTags: ['OnboardingCatalog'],
    }),
    createTemplate: builder.mutation({
      query: (body) => ({ url: 'onboarding/templates/', method: 'POST', body }),
      invalidatesTags: ['OnboardingCatalog'],
    }),
    updateTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `onboarding/templates/${id}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['OnboardingCatalog'],
    }),
  }),
})

export const {
  useGetDashboardQuery,
  useGetAgentsQuery,
  useGetAgentQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
  useBulkCreateAgentsMutation,
  usePatchChecklistItemMutation,
  usePatchCarrierRequirementMutation,
  useGetCohortsQuery,
  useCreateCohortMutation,
  useUpdateCohortMutation,
  useDeleteCohortMutation,
  useGetAuditQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetSyncQuery,
  useTriggerSyncMutation,
  useGetStaffQuery,
  useGetCarriersQuery,
  useCreateCarrierMutation,
  useDeleteCarrierMutation,
  useGetChecklistDefinitionsQuery,
  useCreateChecklistDefinitionMutation,
  useDeleteChecklistDefinitionMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
} = onboardingApi
