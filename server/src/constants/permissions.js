// 权限字典（Pause 2 起逐步启用）
export const PERMISSIONS = [
  // 系统管理
  { code: 'system:user:view',     name: '查看用户',   module: 'system' },
  { code: 'system:user:create',   name: '新建用户',   module: 'system' },
  { code: 'system:user:update',   name: '编辑用户',   module: 'system' },
  { code: 'system:user:delete',   name: '删除用户',   module: 'system' },
  { code: 'system:user:reset',    name: '重置密码',   module: 'system' },
  { code: 'system:role:view',     name: '查看角色',   module: 'system' },
  { code: 'system:role:manage',   name: '管理角色',   module: 'system' },
  { code: 'system:audit:view',    name: '查看操作日志', module: 'system' },

  // 会员
  { code: 'member:view',   name: '查看会员', module: 'member' },
  { code: 'member:create', name: '新建会员', module: 'member' },
  { code: 'member:update', name: '编辑会员', module: 'member' },
  { code: 'member:delete', name: '删除会员', module: 'member' },

  // 会籍
  { code: 'membership:view',   name: '查看会籍', module: 'membership' },
  { code: 'membership:manage', name: '办卡/续费/挂起', module: 'membership' },

  // 课程
  { code: 'course:view',    name: '查看课程', module: 'course' },
  { code: 'course:manage',  name: '课程管理', module: 'course' },
  { code: 'booking:view',   name: '查看预约', module: 'course' },
  { code: 'booking:manage', name: '预约管理', module: 'course' },

  // 签到
  { code: 'checkin:view',    name: '查看签到记录', module: 'checkin' },
  { code: 'checkin:manage',  name: '签到操作',     module: 'checkin' },

  // 商品
  { code: 'product:view',   name: '查看商品', module: 'product' },
  { code: 'product:manage', name: '商品与库存', module: 'product' },

  // 财务
  { code: 'order:view',   name: '查看订单', module: 'finance' },
  { code: 'order:manage', name: '收银与退款', module: 'finance' },
  { code: 'report:view',  name: '查看报表',   module: 'finance' },
];

// 角色默认权限映射
export const ROLE_PERMISSIONS = {
  admin: PERMISSIONS.map((p) => p.code), // 管理员拥有全部
  staff: [
    'member:view', 'member:create', 'member:update',
    'membership:view', 'membership:manage',
    'course:view', 'booking:view', 'booking:manage',
    'product:view', 'product:manage',
    'order:view', 'order:manage',
    'checkin:view', 'checkin:manage',
    'report:view',
  ],
  coach: [
    'member:view',
    'course:view',
    'booking:view', 'booking:manage',
    'checkin:view',
  ],
  member: [
    'course:view',
    'booking:view', 'booking:manage',
    'membership:view',
  ],
};
