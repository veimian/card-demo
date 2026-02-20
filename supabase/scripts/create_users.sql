-- 确保 pgcrypto 扩展已启用
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 清理旧用户 (如果存在)
-- 注意：这里使用 CASCADE 可能会比较危险，但如果只是测试数据没问题。
-- 安全起见，先删除 identities，再删除 users
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com'));
DELETE FROM auth.users WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com');

-- 2. 创建用户: 1405519648@qq.com
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

-- 4. 插入 auth.identities
-- 修正：添加 provider_id 并进行显式类型转换 (UUID -> TEXT)
INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id::text, -- 显式转换为 text
    id,
    format('{"sub": "%s", "email": "%s"}', id, email)::jsonb,
    'email',
    now(),
    now(),
    now()
FROM auth.users
WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com');

-- 5. 验证
SELECT id, email FROM auth.users WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com');
