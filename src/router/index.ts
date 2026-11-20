import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
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
    {
      path: '/dashboard',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    // Rute admin: path mengikuti katalog menu backend (auth-register-rbac). Menu tanpa halaman
    // memakai ComingSoonView; Pengguna & Role tetap di halaman lama (/users, /roles).
    { path: '/admin', redirect: { name: 'home' } },
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
    { path: '/admin/pengguna', redirect: { name: 'users' } },
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
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersView.vue'),
      meta: { requireSuperAdmin: true },
    },
    {
      path: '/roles',
      name: 'roles',
      component: () => import('../views/RolesView.vue'),
      meta: { requireSuperAdmin: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
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
