-- Cleanup the broken users
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com'));
DELETE FROM auth.users WHERE email IN ('1405519648@qq.com', 'sleepyaxin@163.com');
