import { createRouter, createWebHistory } from 'vue-router'
import { PERMISSIONS } from '@/constants/roles'
import { authGuard } from './guard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // Hanya landing yang punya anchor; hash lain (mis. token aktivasi) tidak boleh dijadikan selector.
    if (to.hash && to.name === 'landing') {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      return { el: to.hash, top: 8, behavior: reduced ? 'auto' : 'smooth' }
    }
    return savedPosition ?? (to.path === from.path ? false : { top: 0 })
  },
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
      meta: { public: true },
    },
    {
      path: '/demo/:slug',
      name: 'demo',
      component: () => import('../views/DemoView.vue'),
      meta: { public: true },
    },
    // Rute admin: path mengikuti katalog menu backend (auth-register-rbac). Menu tanpa halaman
    // memakai ComingSoonView. Rute lama (/dashboard, /users, /roles) dialihkan agar bookmark tetap jalan.
    { path: '/dashboard', redirect: { name: 'home' } },
    {
      path: '/admin',
      name: 'home',
      component: () => import('../views/AdminDashboardView.vue'),
      meta: { requireSuperAdmin: true },
    },
    {
      path: '/admin/template',
      name: 'admin-templates',
      component: () => import('../views/AdminTemplatesView.vue'),
      meta: { requireSuperAdmin: true },
    },
    {
      path: '/admin/template/:id/editor',
      name: 'admin-template-editor',
      component: () => import('../views/ComingSoonView.vue'),
      meta: { requireSuperAdmin: true },
    },
    {
      path: '/admin/membership',
      name: 'admin-membership',
      component: () => import('../views/AdminMembershipView.vue'),
      meta: { requireSuperAdmin: true },
    },
    {
      path: '/admin/pengguna',
      name: 'admin-users',
      component: () => import('../views/AdminUsersView.vue'),
      meta: { requirePermission: PERMISSIONS.USERS_MANAGE },
    },
    {
      path: '/admin/pengguna/role',
      name: 'admin-roles',
      component: () => import('../views/AdminRolesView.vue'),
      meta: { requirePermission: PERMISSIONS.USERS_MANAGE },
    },
    {
      path: '/admin/pengguna/role/:id',
      name: 'admin-role-access',
      component: () => import('../views/AdminRoleAccessView.vue'),
      meta: { requirePermission: PERMISSIONS.USERS_MANAGE },
    },
    { path: '/users', redirect: { name: 'admin-users' } },
    { path: '/roles', redirect: { name: 'admin-roles' } },
    {
      path: '/admin/:section(undangan|tamu|pengaturan)',
      name: 'admin-coming-soon',
      component: () => import('../views/ComingSoonView.vue'),
      meta: { requireSuperAdmin: true },
    },
    {
      path: '/app/:rest(.+)?',
      name: 'app-coming-soon',
      component: () => import('../views/ComingSoonView.vue'),
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('../views/ForbiddenView.vue'),
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/daftar',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/cek-email',
      name: 'check-email',
      component: () => import('../views/CheckEmailView.vue'),
      meta: { public: true },
    },
    {
      path: '/aktivasi',
      name: 'activate',
      component: () => import('../views/ActivateView.vue'),
      meta: { public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { public: true },
    },
  ],
})

router.beforeEach(authGuard)

export default router
