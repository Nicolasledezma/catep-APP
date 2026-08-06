INSERT INTO public.user_roles (user_id, role)
SELECT id, 'coordinador'::public.app_role FROM auth.users WHERE email = 'ledezmanicolas321@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;