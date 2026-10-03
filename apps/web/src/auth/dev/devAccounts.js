// Development only - imported by DevLoginPanel.jsx, which production builds leave out.
// One seeded test account per role (see ../mockUsers.js and the root README).

export const DEV_ACCOUNTS = Object.freeze([
  { email: 'admin@fastfix.test', password: 'Admin123!', label: 'Admin', note: 'Approvals, users, tags' },
  { email: 'customer@fastfix.test', password: 'Test123!', label: 'Customer', note: 'Requests, 3D preview' },
  { email: 'mechanic@fastfix.test', password: 'Test123!', label: 'Mechanic', note: 'Approved, 2 skills' },
  { email: 'shop@fastfix.test', password: 'Test123!', label: 'Parts Shop', note: 'Al-Quds Auto Parts' },
  { email: 'shop2@fastfix.test', password: 'Test123!', label: 'Parts Shop 2', note: 'Ramallah Motors Supply' },
  { email: 'tow@fastfix.test', password: 'Test123!', label: 'Tow Company', note: 'Nablus Rescue, 2 trucks' },
  {
    email: 'pending-mechanic@fastfix.test',
    password: 'Test123!',
    label: 'Pending Mechanic',
    note: 'Waiting for approval',
  },
])
