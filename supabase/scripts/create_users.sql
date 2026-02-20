-- 确保 pgcrypto 扩展已启用 (用于生成密码 Hash)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 清理旧用户 (如果存在)
-- 注意: 这将级联删除 public schema 中的所有相关数据 (cards, categories, etc.)
DELETE FROM auth.users WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com');

-- 2. 创建用户: 1405519648@qq.com
-- 默认密码: 12345678
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '1405519648@qq.com',
    crypt('12345678', gen_salt('bf')),
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 3. 创建用户: sleepyaxin@163.com
-- 默认密码: 12345678
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'sleepyaxin@163.com',
    crypt('12345678', gen_salt('bf')),
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 4. 插入 auth.identities (必须，否则无法通过 email 登录)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    format('{"sub": "%s", "email": "%s"}', id, email)::jsonb,
    'email',
    now(),
    now(),
    now()
FROM auth.users
WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com');

-- 5. 验证是否创建成功
SELECT id, email, created_at FROM auth.users WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com');
